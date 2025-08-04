"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShoppingCart, Eye, Clock, Search, Grid3X3, List, CheckCircle, Loader2 } from "lucide-react"
import { cardInventoryService } from "@/lib/card-inventory-service"
import type { CardImage } from "@/lib/supabase-storage"

interface CardGalleryProps {
  userCedula: string
  onCardsSelected: (cards: CardImage[]) => void
  maxCards?: number
}

export default function CardGallery({ userCedula, onCardsSelected, maxCards = 10 }: CardGalleryProps) {
  const [cards, setCards] = useState<CardImage[]>([])
  const [selectedCards, setSelectedCards] = useState<CardImage[]>([])
  const [reservedCards, setReservedCards] = useState<CardImage[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [reservationTimer, setReservationTimer] = useState<number | null>(null)

  // Cargar cartones disponibles
  const loadCards = async (pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) setLoading(true)
      else setLoadingMore(true)

      const result = await cardInventoryService.getAvailableCards(pageNum, 20)

      if (append) {
        setCards((prev) => [...prev, ...result.cards])
      } else {
        setCards(result.cards)
      }

      setHasMore(result.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error("Error loading cards:", error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Cargar cartones reservados del usuario
  const loadReservedCards = async () => {
    try {
      const reserved = await cardInventoryService.getUserReservedCards(userCedula)
      setReservedCards(reserved)

      // Si hay reservas, iniciar timer
      if (reserved.length > 0 && reserved[0].reservedUntil) {
        const timeLeft = new Date(reserved[0].reservedUntil).getTime() - Date.now()
        if (timeLeft > 0) {
          setReservationTimer(Math.floor(timeLeft / 1000))
        }
      }
    } catch (error) {
      console.error("Error loading reserved cards:", error)
    }
  }

  // Seleccionar/deseleccionar cartón
  const toggleCardSelection = (card: CardImage) => {
    setSelectedCards((prev) => {
      const isSelected = prev.some((c) => c.cardNumber === card.cardNumber)

      if (isSelected) {
        return prev.filter((c) => c.cardNumber !== card.cardNumber)
      } else {
        if (prev.length >= maxCards) {
          alert(`Máximo ${maxCards} cartones por compra`)
          return prev
        }
        return [...prev, card]
      }
    })
  }

  // Reservar cartones seleccionados
  const reserveSelectedCards = async () => {
    if (selectedCards.length === 0) return

    try {
      setLoading(true)

      const cardNumbers = selectedCards.map((c) => c.cardNumber)
      await cardInventoryService.reserveCards(cardNumbers, userCedula)

      // Actualizar estado
      await loadCards(1, false)
      await loadReservedCards()

      setSelectedCards([])
      onCardsSelected(selectedCards)

      alert(`${selectedCards.length} cartones reservados por 5 minutos`)
    } catch (error) {
      console.error("Error reserving cards:", error)
      alert("Error al reservar cartones. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Liberar reservas
  const releaseReservations = async () => {
    try {
      await cardInventoryService.releaseUserReservations(userCedula)
      await loadCards(1, false)
      await loadReservedCards()
      setReservationTimer(null)
      alert("Reservas liberadas")
    } catch (error) {
      console.error("Error releasing reservations:", error)
    }
  }

  // Timer para reservas
  useEffect(() => {
    if (reservationTimer && reservationTimer > 0) {
      const interval = setInterval(() => {
        setReservationTimer((prev) => {
          if (prev && prev > 1) {
            return prev - 1
          } else {
            loadCards(1, false)
            loadReservedCards()
            return null
          }
        })
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [reservationTimer])

  // Cargar datos iniciales
  useEffect(() => {
    loadCards()
    loadReservedCards()
  }, [userCedula])

  // Filtrar cartones por búsqueda
  const filteredCards = cards.filter(
    (card) =>
      card.cardNumber.toString().includes(searchTerm) ||
      card.numbers.some((num) => num.toString().includes(searchTerm)),
  )

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" />
              Galería de Cartones
            </div>
            <Badge className="bg-white/20 text-white">
              {selectedCards.length}/{maxCards} seleccionados
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Cartones reservados */}
          {reservedCards.length > 0 && (
            <Alert className="border-orange-300 bg-orange-50">
              <Clock className="h-4 w-4" />
              <AlertDescription className="text-orange-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>Tienes {reservedCards.length} cartones reservados</strong>
                    {reservationTimer && (
                      <div className="text-sm mt-1">
                        Tiempo restante: <strong>{formatTime(reservationTimer)}</strong>
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={releaseReservations}
                    className="border-orange-300 text-orange-600 bg-transparent"
                  >
                    Liberar Reservas
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Controles */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por número..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              <div className="flex gap-1 border rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === "list" ? "default" : "ghost"}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedCards.length > 0 && (
                <Button
                  onClick={reserveSelectedCards}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Reservar {selectedCards.length} cartones
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Galería de cartones */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Cargando cartones...</span>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredCards.map((card) => {
                    const isSelected = selectedCards.some((c) => c.cardNumber === card.cardNumber)

                    return (
                      <div
                        key={card.cardNumber}
                        className={`relative border-2 rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "border-green-500 bg-green-50 shadow-lg scale-105"
                            : "border-gray-200 hover:border-blue-300 hover:shadow-md"
                        }`}
                        onClick={() => toggleCardSelection(card)}
                      >
                        <div className="aspect-square relative">
                          <img
                            src={card.imageUrl || "/placeholder.svg"}
                            alt={`Cartón ${card.cardNumber}`}
                            className="w-full object-contain aspect-[3/4]"
                            loading="lazy"
                          />

                          {/* Overlay de selección */}
                          {isSelected && (
                            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                              <CheckCircle className="h-8 w-8 text-green-600 bg-white rounded-full" />
                            </div>
                          )}

                          {/* Número del cartón */}
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-black/70 text-white">#{card.cardNumber}</Badge>
                          </div>
                        </div>

                          {/* Número del cartón en la parte inferior */}
                          <div className="p-2 bg-white text-center">
                            <Badge variant="outline" className="bg-white">#{card.cardNumber}</Badge>
                          </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCards.map((card) => {
                    const isSelected = selectedCards.some((c) => c.cardNumber === card.cardNumber)

                    return (
                      <div
                        key={card.cardNumber}
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-blue-300"
                        }`}
                        onClick={() => toggleCardSelection(card)}
                      >
                        <img
                          src={card.imageUrl || "/placeholder.svg"}
                          alt={`Cartón ${card.cardNumber}`}
                          className="w-16 h-16 object-cover rounded"
                          loading="lazy"
                        />

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge>#{card.cardNumber}</Badge>
                            {isSelected && <CheckCircle className="h-4 w-4 text-green-600" />}
                          </div>

                          <div className="grid grid-cols-12 gap-1 text-xs">
                            {card.numbers.map((num, i) => (
                              <div key={i} className="text-center text-gray-600 font-mono">
                                {num}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Cartón #{card.cardNumber}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <img
                                src={card.imageUrl || "/placeholder.svg"}
                                alt={`Cartón ${card.cardNumber}`}
                                className="w-full rounded-lg"
                              />
                              <div>
                                <Label className="font-medium">Números del cartón:</Label>
                                <div className="grid grid-cols-8 gap-2 mt-2">
                                  {card.numbers.map((num, i) => (
                                    <div key={i} className="p-2 text-center border rounded bg-gray-50 font-mono">
                                      {num}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Cargar más */}
              {hasMore && (
                <div className="text-center mt-6">
                  <Button onClick={() => loadCards(page + 1, true)} disabled={loadingMore} variant="outline">
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Cargando...
                      </>
                    ) : (
                      "Cargar más cartones"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
