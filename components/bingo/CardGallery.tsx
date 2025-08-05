'use client';

import { useState, useEffect, FC, useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cardInventoryService } from '@/lib/card-inventory-service';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";

// Interface para las imágenes de los cartones
export interface CardImage {
  id: string;
  cardNumber: number;
  numbers: number[];
  imageUrl?: string;
  isSelected?: boolean;
  isReserved?: boolean;
  isAvailable?: boolean;
  isReserving?: boolean;
  reservedBy?: string;      // ID del usuario que reservó el cartón
  reservedUntil?: string;   // Fecha de expiración de la reserva
}

interface CardGalleryProps {
  userCedula: string;
  onCardsSelected: (cards: CardImage[]) => void;
  maxCards: number;
  selectedCards?: CardImage[];
}

const CardGallery: FC<CardGalleryProps> = ({ 
  userCedula, 
  onCardsSelected, 
  maxCards,
  selectedCards: externalSelectedCards = []
}) => {
  const [cards, setCards] = useState<CardImage[]>([]);
  const [internalSelectedCards, setInternalSelectedCards] = useState<CardImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  
  // Sincronizar con las selecciones externas si se proporcionan
  useEffect(() => {
    if (externalSelectedCards) {
      setInternalSelectedCards(externalSelectedCards);
    }
  }, [externalSelectedCards]);

  // Función para transformar los datos de la API al formato esperado
  const transformCardData = useCallback((apiCard: any): CardImage => ({
    id: apiCard.id || `card-${apiCard.card_number}`,
    cardNumber: apiCard.card_number,
    numbers: apiCard.numbers || [],
    imageUrl: apiCard.image_url,
    isAvailable: apiCard.is_available,
    isReserved: !apiCard.is_available && !!apiCard.reserved_by,
    reservedBy: apiCard.reserved_by,
    reservedUntil: apiCard.reserved_until,
    isReserving: false
  }), []);

  // Función para cargar más cartones (paginación)
  const loadMoreCards = useCallback(async () => {
    if (!hasMore || isLoading || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/cards?page=${nextPage}`);
      const data = await response.json();
      
      if (data.cards.length === 0) {
        setHasMore(false);
        toast({
          title: 'No hay más cartones',
          description: 'Has llegado al final de los cartones disponibles',
        });
        return;
      }
      
      const newCards = data.cards.map(transformCardData);
      setCards(prevCards => [...prevCards, ...newCards]);
      setPage(nextPage);
    } catch (error) {
      console.error('Error loading more cards:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar más cartones',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, hasMore, isLoading, isLoadingMore, toast, transformCardData]);
  
  // Configurar el observer para carga infinita
  useEffect(() => {
    if (!loadMoreCards) return;
    
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 300) return;
      loadMoreCards();
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMoreCards]);

  // Función para cargar los cartones
  const fetchCards = useCallback(async (pageNum = 1, limit = 20) => {
    const isFirstPage = pageNum === 1;
    
    try {
      if (isFirstPage) {
        setIsLoading(true);
        setError(null);
      } else {
        setIsLoadingMore(true);
      }

      const { cards, total, hasMore: fetchError } = await cardInventoryService.getAvailableCards(pageNum, limit);
      
      if (fetchError) {
        throw fetchError;
      }

      const newCards = cards.map(transformCardData);
      
      if (isFirstPage) {
        setCards(newCards);
      } else {
        setCards(prevCards => [...prevCards, ...newCards]);
      }
      
      setHasMore(newCards.length === limit);
      
      return {
        cards: newCards,
        hasMore: newCards.length === limit
      };
    } catch (err) {
      console.error('Error loading cards:', err);
      setError('Error al cargar los cartones. Por favor, intenta de nuevo.');
      
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los cartones',
        variant: 'destructive',
      });
      
      return { cards: [], hasMore: false };
    } finally {
      if (isFirstPage) {
        setIsLoading(false);
      } else {
        setIsLoadingMore(false);
      }
    }
  }, [userCedula, transformCardData, toast]);

  // Cargar los cartones disponibles
  useEffect(() => {
    fetchCards(1, 20);
  }, [fetchCards]);

  // Cargar los cartones disponibles
  useEffect(() => {
    fetchCards(1, 20);
  }, [userCedula, fetchCards]);
  
  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    const subscription = cardInventoryService.subscribeToCards(
      (updatedCards) => {
        setCards(updatedCards.map(transformCardData));
      },
      { reservedBy: userCedula }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, [userCedula]);

  const handleCardSelect = (card: CardImage) => {
    // No permitir seleccionar cartones reservados por otro usuario
    if (card.isReserved && card.reservedBy !== userCedula) {
      toast({
        title: 'Cartón no disponible',
        description: 'Este cartón ya ha sido reservado por otro usuario',
        variant: 'destructive',
      });
      return;
    }
    
    // Si el cartón ya está seleccionado, quitarlo de la selección
    if (internalSelectedCards.some(c => c.cardNumber === card.cardNumber)) {
      const updated = internalSelectedCards.filter(c => c.cardNumber !== card.cardNumber);
      setInternalSelectedCards(updated);
      onCardsSelected(updated);
      return;
    }

    // Si ya se alcanzó el máximo de cartones permitidos
    if (internalSelectedCards.length >= maxCards) {
      toast({
        title: 'Límite alcanzado',
        description: `Solo puedes seleccionar hasta ${maxCards} cartones`,
        variant: 'destructive',
      });
      return;
    }

    // Agregar el cartón a la selección
    const updated = [...internalSelectedCards, { ...card, isSelected: true }];
    setInternalSelectedCards(updated);
    onCardsSelected(updated);
  };

  // Determinar si un cartón está seleccionado
  const isCardSelected = (card: CardImage) => {
    return internalSelectedCards.some(c => c.cardNumber === card.cardNumber);
  };
  
  // Determinar si un cartón está reservado por el usuario actual
  const isReservedByCurrentUser = (card: CardImage) => {
    return card.reservedBy === userCedula && !card.isAvailable;
  };
  
  // Determinar si un cartón está disponible para selección
  const isCardAvailable = (card: CardImage) => {
    return card.isAvailable || isReservedByCurrentUser(card);
  };

  // Función para manejar la reserva de cartones seleccionados
  const handleReserveCards = async () => {
    if (internalSelectedCards.length === 0 || isReserving) return;
    
    setIsReserving(true);
    
    try {
      // Llamar al servicio para reservar los cartones
      const { success, error } = await cardInventoryService.reserveCards(
        internalSelectedCards.map(card => card.cardNumber),
        userCedula
      );
      
      if (error) {
        throw error;
      }
      
      // Actualizar el estado local de los cartones
      setCards(prevCards => 
        prevCards.map(card => {
          const isSelected = internalSelectedCards.some(c => c.cardNumber === card.cardNumber);
          if (isSelected) {
            return {
              ...card,
              isReserved: true,
              isAvailable: false,
              reservedBy: userCedula,
              reservedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 horas desde ahora
            };
          }
          return card;
        })
      );
      
      // Limpiar la selección
      setInternalSelectedCards([]);
      onCardsSelected([]);
      
      toast({
        title: '¡Reserva exitosa!',
        description: `Has reservado ${internalSelectedCards.length} cartón(es) correctamente.`,
      });
      
    } catch (err) {
      console.error('Error al reservar cartones:', err);
      toast({
        title: 'Error',
        description: 'No se pudieron reservar los cartones. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsReserving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <span className="text-lg font-medium">Cargando cartones disponibles...</span>
        <p className="text-sm text-gray-500">Por favor espera un momento</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => fetchCards(1, 20)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            'Reintentar'
          )}
        </Button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="text-center p-8 space-y-4">
        <p className="text-gray-500">No hay cartones disponibles en este momento.</p>
        <Button 
          variant="outline"
          onClick={() => fetchCards(1, 20)}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Cargando...
            </>
          ) : (
            'Recargar'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium">Selecciona hasta {maxCards} cartones</h3>
        <p className="text-sm text-gray-500">
          {internalSelectedCards.length} de {maxCards} cartones seleccionados
        </p>
        <Button 
          variant="default" 
          className="mt-2"
          onClick={handleReserveCards}
          disabled={internalSelectedCards.length === 0 || isReserving}
        >
          {isReserving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            `Reservar ${internalSelectedCards.length} cartón${internalSelectedCards.length !== 1 ? 'es' : ''}`
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {cards.map((card) => {
          const isSelected = isCardSelected(card);
          const isReserved = card.isReserved && !isReservedByCurrentUser(card);
          const isAvailable = isCardAvailable(card);
          
          return (
            <div 
              key={card.id || `card-${card.cardNumber}`} 
              className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                isReserved 
                  ? 'opacity-70 cursor-not-allowed' 
                  : isAvailable 
                    ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer' 
                    : 'opacity-50 cursor-not-allowed'
              } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => isAvailable && handleCardSelect(card)}
            >
              {isReserved && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <span className="text-white font-bold text-sm bg-red-500 px-2 py-1 rounded">
                    {card.reservedBy === userCedula ? 'Reservado por ti' : 'Reservado'}
                  </span>
                </div>
              )}
              
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="aspect-square bg-gray-100 rounded-md mb-2 flex items-center justify-center">
                    {card.imageUrl ? (
                      <img 
                        src={card.imageUrl} 
                        alt={`Cartón de Bingo #${card.cardNumber}`} 
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm text-center p-2">
                        <p>Cartón</p>
                        <p className="font-bold">#{card.cardNumber}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Cartón #{card.cardNumber}</span>
                    {isSelected ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : isReserved ? (
                      <XCircle className="h-5 w-5 text-red-500" />
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {isLoadingMore && (
        <div className="mt-4 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      )}
      
      {!hasMore && cards.length > 0 && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Has llegado al final de la lista
        </p>
      )}
    </div>
  );
};

export default CardGallery;