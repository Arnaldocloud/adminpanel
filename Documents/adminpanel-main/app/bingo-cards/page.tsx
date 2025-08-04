"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CardGallery from '@/components/bingo/CardGallery';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/use-toast';
import { cardInventoryService } from '@/lib/card-inventory-service';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CartItem {
  id: string;
  cardNumber: number;
  numbers: number[];
  price?: number;
  // Propiedades opcionales que podrían ser necesarias
  imageUrl?: string;
  isSelected?: boolean;
  isReserved?: boolean;
  isAvailable?: boolean;
}

export default function BingoCardsPage() {
  const [selectedCards, setSelectedCards] = useState<CartItem[]>([]);
  const [userCedula, setUserCedula] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [reservationError, setReservationError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login'); // Redirigir si no hay sesión
      } else {
        // Asumiendo que la cédula se guarda en user_metadata
        setUserCedula(session.user.user_metadata?.cedula || session.user.id);
        setIsLoading(false);
      }
    };
    checkUser();
  }, [router, supabase]);

  const handleSelectionChange = useCallback((cards: CartItem[]) => {
    setSelectedCards(cards.map(c => ({
      id: c.id,
      cardNumber: c.cardNumber || 0, // Asegurar que siempre haya un número de cartón
      numbers: c.numbers || [],      // Incluir el array de números
      price: c.price,               // Mantener el precio si existe
      imageUrl: c.imageUrl,         // Mantener la URL de la imagen si existe
      isSelected: true              // Marcar como seleccionado
    })));
  }, []);

  // Función para reservar los cartones seleccionados
  const reserveSelectedCards = useCallback(async () => {
    if (!userCedula || selectedCards.length === 0) return;
    
    setIsProcessing(true);
    setReservationError(null);
    
    try {
      const cardNumbers = selectedCards.map(card => card.cardNumber).filter(Boolean) as number[];
      
      // Intentar reservar los cartones
      const result = await cardInventoryService.reserveCards(cardNumbers, userCedula);
      
      if (!result.success) {
        setReservationError(result.error || 'Error al reservar los cartones');
        toast({
          title: 'Error de reserva',
          description: result.error || 'No se pudieron reservar los cartones seleccionados',
          variant: 'destructive',
        });
        return false;
      }
      
      // Si la reserva fue exitosa, redirigir al checkout
      router.push('/checkout');
      return true;
    } catch (error) {
      console.error('Error reservando cartones:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setReservationError(errorMessage);
      toast({
        title: 'Error',
        description: 'Ocurrió un error al procesar tu solicitud',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  }, [selectedCards, userCedula, router, toast]);

  const handleProceedToCheckout = async () => {
    if (selectedCards.length === 0) {
      toast({
        title: 'No hay cartones seleccionados',
        description: 'Por favor selecciona al menos un cartón para continuar.',
        variant: 'destructive',
      });
      return;
    }
    
    // Reservar los cartones antes de proceder al pago
    await reserveSelectedCards();
  };

  const totalPrice = selectedCards.reduce((sum, card) => sum + (card.price || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="ml-2">Verificando sesión...</p>
      </div>
    );
  }
  
  if (!userCedula) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error de autenticación</AlertTitle>
          <AlertDescription>
            No se pudo verificar tu identidad. Por favor inicia sesión nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Bingo Card Gallery</h1>
        <p className="text-muted-foreground mt-2">
          Select your bingo cards from our collection of 2000 unique cards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Tabs 
            defaultValue="gallery" 
            className="w-full"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
              <TabsTrigger value="gallery">Gallery</TabsTrigger>
              <TabsTrigger value="my-cards">My Cards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="gallery">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>Cartones de Bingo Disponibles</CardTitle>
                      <CardDescription>
                        Selecciona hasta 5 cartones para reservar por 5 minutos
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {selectedCards.length} {selectedCards.length === 1 ? 'seleccionado' : 'seleccionados'}
                      </span>
                      {selectedCards.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setSelectedCards([])}
                          disabled={isProcessing}
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reservationError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {reservationError}
                        </AlertDescription>
                      </Alert>
                    )}
                    <CardGallery 
                      userCedula={userCedula}
                      onCardsSelected={handleSelectionChange}
                      maxCards={5}
                      selectedCards={selectedCards}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="my-cards">
              <Card>
                <CardHeader>
                  <CardTitle>Mis Cartones</CardTitle>
                  <CardDescription>
                    Visualiza y administra tus cartones de bingo comprados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      Aún no tienes cartones de bingo comprados.
                    </p>
                    <Button onClick={() => setActiveTab('gallery')}>
                      Ver Cartones
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Resumen de la Orden</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    {selectedCards.length} {selectedCards.length === 1 ? 'Cartón' : 'Cartones'}
                  </span>
                  <span className="text-sm">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>
                
                {reservationError && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {reservationError}
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  className="w-full mt-4" 
                  size="lg"
                  onClick={handleProceedToCheckout}
                  disabled={selectedCards.length === 0 || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Proceder al Pago
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Al completar tu compra, aceptas nuestros Términos de Servicio
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
