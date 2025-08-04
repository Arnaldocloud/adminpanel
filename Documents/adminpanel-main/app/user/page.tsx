"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { ShoppingCart, CreditCard, Eye, Clock, XCircle, User, Target, Sparkles, Copy, Grid3X3, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import CardGallery from "@/components/card-gallery"
import type { CardImage } from "@/lib/supabase-storage"
import { orderService, type Order as OrderType } from "@/lib/order-service"

// Tipos de datos
interface CartItem {
  id: string
  numbers: number[]
  price: number
  cardNumber?: number
  imageUrl?: string
}

type PurchaseOrder = OrderType

export default function UserPanel() {
  const { toast } = useToast()
  
  // Estados principales
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [selectedCards, setSelectedCards] = useState<CardImage[]>([])
  const [playerInfo, setPlayerInfo] = useState({
    name: "",
    phone: "",
    cedula: "",
  })
  const [paymentInfo, setPaymentInfo] = useState({
    method: "",
    transactionId: "",
    referenceNumber: "",
    senderPhone: "",
    senderName: "",
  })
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [showCardGallery, setShowCardGallery] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Configuración del juego
  const CARD_PRICE = 2 // Precio por cartón en USD
  const MIN_CARDS = 1
  const MAX_CARDS = 10

  // Información de cuentas para pagos (mismo que antes)
  const PAYMENT_ACCOUNTS = {
    "pago-movil": {
      name: "Pago Móvil",
      bank: "Banco de Venezuela",
      phone: "0414-1234567",
      ci: "V-12345678",
      holder: "BINGO ADMIN C.A.",
    },
    zelle: {
      name: "Zelle",
      email: "bingo@admin.com",
      holder: "BINGO ADMIN",
    },
    binance: {
      name: "Binance Pay",
      id: "123456789",
      holder: "BINGO ADMIN",
    },
    paypal: {
      name: "PayPal",
      email: "bingo@admin.com",
      holder: "BINGO ADMIN",
    },
  }

  // Manejar selección de cartones desde la galería
  const handleCardsSelected = (cards: CardImage[]) => {
    const newCartItems: CartItem[] = cards.map((card) => ({
      id: `card-${card.cardNumber}`,
      numbers: card.numbers,
      price: CARD_PRICE,
      cardNumber: card.cardNumber,
      imageUrl: card.imageUrl,
    }))

    setCartItems(newCartItems)
    setSelectedCards(cards)
    setShowCardGallery(false)
  }

  // Remover cartón del carrito
  const removeCardFromCart = (cardId: string) => {
    setCartItems((prev) => prev.filter((card) => card.id !== cardId))
    setSelectedCards((prev) => prev.filter((card) => `card-${card.cardNumber}` !== cardId))
  }

  // Calcular total
  const totalAmount = cartItems.reduce((sum, card) => sum + card.price, 0)

  // Copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("¡Copiado al portapapeles!")
  }

  // Procesar compra (adaptado para cartones seleccionados)
  const processPurchase = async () => {
    if (!playerInfo.name || !playerInfo.phone || !playerInfo.cedula) {
      toast({
        title: 'Datos incompletos',
        description: 'Por favor completa tu nombre, teléfono y cédula de identidad',
        variant: 'destructive',
      })
      return
    }

    if (cartItems.length === 0) {
      toast({
        title: 'Carrito vacío',
        description: 'Selecciona al menos un cartón de la galería',
        variant: 'destructive',
      })
      return
    }

    if (!paymentInfo.method) {
      toast({
        title: 'Método de pago requerido',
        description: 'Por favor selecciona un método de pago',
        variant: 'destructive',
      })
      return
    }

    // Validaciones específicas por método de pago
    if (paymentInfo.method === "pago-movil") {
      if (!paymentInfo.referenceNumber || !paymentInfo.senderPhone || !paymentInfo.senderName) {
        toast({
          title: 'Datos de pago incompletos',
          description: 'Para Pago Móvil necesitas: Número de referencia, teléfono del emisor y nombre del emisor',
          variant: 'destructive',
        })
        return
      }
    } else if (!paymentInfo.transactionId) {
      toast({
        title: 'ID de transacción requerido',
        description: 'Por favor ingresa el ID de la transacción',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      
      // Preparar los ítems del carrito en el formato correcto para Supabase
      const cartItemsData = cartItems.map(item => ({
        card_id: item.id,
        card_number: item.cardNumber || 0,
        numbers: item.numbers,
        price: item.price,
        image_url: item.imageUrl || ''
      }));
      
      // Crear la orden en Supabase
      const newOrder = await orderService.createOrder({
        player_name: playerInfo.name,
        player_phone: playerInfo.phone,
        player_cedula: playerInfo.cedula,
        total_amount: totalAmount,
        payment_method: paymentInfo.method,
        transaction_id: paymentInfo.transactionId,
        reference_number: paymentInfo.referenceNumber || "",
        sender_phone: paymentInfo.senderPhone || "",
        sender_name: paymentInfo.senderName || "",
        cart_items: cartItemsData,
        status: 'pending' // Asegurar que el estado inicial sea 'pending'
      });

      // Enviar notificación de WhatsApp
      try {
        await fetch("/api/notifications/order-received", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerName: playerInfo.name,
            playerPhone: playerInfo.phone,
            orderId: newOrder.id,
            amount: totalAmount,
            cartCount: cartItems.length,
          }),
        })
      } catch (error) {
        console.error('Error enviando notificación:', error)
      }

      // Limpiar el estado
      setCartItems([]);
      setSelectedCards([]);
      setShowPaymentForm(false);
      setPaymentInfo({
        method: "",
        transactionId: "",
        referenceNumber: "",
        senderPhone: "",
        senderName: "",
      });
      
      // Recargar las órdenes para el usuario
      const userOrders = await orderService.getOrdersByCedula(playerInfo.cedula);
      setOrders(userOrders);

      toast({
        title: "¡Orden creada!",
        description: "Tu orden ha sido registrada y está pendiente de verificación.",
      })

    } catch (error) {
      console.error('Error creando orden:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la orden. Por favor intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar y suscribirse a cambios en las órdenes
  useEffect(() => {
    if (!playerInfo.cedula) return

    const loadOrders = async () => {
      try {
        setIsLoading(true)
        const userOrders = await orderService.getOrdersByCedula(playerInfo.cedula)
        setOrders(userOrders)
      } catch (error) {
        console.error('Error cargando órdenes:', error)
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las órdenes',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadOrders()

    // Suscribirse a cambios en tiempo real
    const subscription = orderService.subscribeToOrders(playerInfo.cedula, (updatedOrders) => {
      setOrders(updatedOrders)
    })

    // Limpiar suscripción al desmontar
    return () => {
      subscription.unsubscribe()
    }
  }, [playerInfo.cedula, toast])

  // Obtener estado de la orden
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 text-white">⏳ Pendiente</Badge>
      case "paid":
        return <Badge className="bg-blue-500 text-white">💳 Pago Confirmado</Badge>
      case "verified":
        return <Badge className="bg-green-500 text-white">✅ Verificado - Puede Jugar</Badge>
      case "rejected":
        return <Badge className="bg-red-500 text-white">❌ Rechazado</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">❓ Desconocido</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Compra tus Cartones de Bingo
            </h1>
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Selecciona tus cartones favoritos de nuestra galería, completa tu información y realiza el pago
          </p>
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-xl max-w-md mx-auto">
            <p className="text-green-800 font-bold">💰 Precio por cartón: ${CARD_PRICE} USD</p>
            <p className="text-green-700 text-sm">Elige tus cartones favoritos de la galería</p>
          </div>
        </div>

        <Tabs defaultValue="select" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select">Seleccionar Cartones</TabsTrigger>
            <TabsTrigger value="cart">Mi Carrito ({cartItems.length})</TabsTrigger>
            <TabsTrigger value="orders">Mis Órdenes</TabsTrigger>
          </TabsList>

          {/* Selección de cartones */}
          <TabsContent value="select" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Tu Información
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-700 font-medium">
                      Nombre Completo *
                    </Label>
                    <Input
                      id="name"
                      value={playerInfo.name}
                      onChange={(e) => setPlayerInfo((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Tu nombre completo"
                      className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-700 font-medium">
                      Teléfono *
                    </Label>
                    <Input
                      id="phone"
                      value={playerInfo.phone}
                      onChange={(e) => setPlayerInfo((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="0414-1234567"
                      className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cedula" className="text-gray-700 font-medium">
                      Cédula de Identidad *
                    </Label>
                    <Input
                      id="cedula"
                      value={playerInfo.cedula}
                      onChange={(e) => setPlayerInfo((prev) => ({ ...prev, cedula: e.target.value }))}
                      placeholder="V-12345678"
                      className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {playerInfo.cedula && (
              <CardGallery userCedula={playerInfo.cedula} onCardsSelected={handleCardsSelected} maxCards={MAX_CARDS} />
            )}

            {!playerInfo.cedula && (
              <Alert className="border-blue-300 bg-blue-50">
                <Target className="h-4 w-4" />
                <AlertDescription className="text-blue-800 font-medium">
                  Completa tu información personal para acceder a la galería de cartones
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          {/* Carrito */}
          <TabsContent value="cart" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Cartones Seleccionados ({cartItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {cartItems.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cartItems.map((card, index) => (
                          <div
                            key={card.id}
                            className="border-2 border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-pink-50"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-bold text-purple-800">Cartón #{card.cardNumber || index + 1}</h4>
                              <div className="flex gap-2">
                                {card.imageUrl && (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-purple-300 text-purple-600 bg-transparent"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                      <DialogHeader>
                                        <DialogTitle>Cartón #{card.cardNumber}</DialogTitle>
                                      </DialogHeader>
                                      <img
                                        src={card.imageUrl || "/placeholder.svg"}
                                        alt={`Cartón ${card.cardNumber}`}
                                        className="w-full rounded-lg"
                                      />
                                    </DialogContent>
                                  </Dialog>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeCardFromCart(card.id)}
                                  className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl || "/placeholder.svg"}
                                alt={`Cartón ${card.cardNumber}`}
                                className="w-full h-32 object-cover rounded-lg mb-3"
                              />
                            ) : (
                              <div className="grid grid-cols-5 gap-1 text-xs mb-3">
                                {card.numbers.slice(0, 10).map((num, i) => (
                                  <div
                                    key={i}
                                    className="p-1 text-center border rounded bg-white border-purple-200 text-purple-600 font-medium"
                                  >
                                    {num}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="text-center">
                              <Badge className="bg-green-500 text-white">${card.price} USD</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert className="border-0 bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg rounded-xl">
                        <Grid3X3 className="h-4 w-4" />
                        <AlertDescription className="text-blue-800 font-medium">
                          No has seleccionado cartones aún. Ve a "Seleccionar Cartones" para elegir de la galería.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Resumen del Carrito
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cartones:</span>
                        <span className="font-semibold">{cartItems.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Precio por cartón:</span>
                        <span className="font-semibold">${CARD_PRICE} USD</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">${totalAmount} USD</span>
                      </div>
                    </div>

                    {cartItems.length > 0 && (
                      <Button
                        onClick={() => setShowPaymentForm(true)}
                        className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Proceder al Pago
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Mis Órdenes */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Mis Órdenes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="border-2 border-gray-200 rounded-xl p-4 bg-gradient-to-r from-gray-50 to-blue-50"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-bold text-gray-800">Orden #{order.id.slice(-8)}</p>
                            <p className="text-sm text-gray-600">{new Date(order.created_at).toLocaleString()}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p>
                              <span className="font-medium">Cartones:</span> {order.cart_items.length}
                            </p>
                            <p>
                              <span className="font-medium">Total:</span> ${order.total_amount} USD
                            </p>
                            <p>
                              <span className="font-medium">Cédula:</span> {order.player_cedula}
                            </p>
                          </div>
                          <div>
                            <p>
                              <span className="font-medium">Pago:</span>{" "}
                              {PAYMENT_ACCOUNTS[order.payment_method as keyof typeof PAYMENT_ACCOUNTS]?.name ||
                                order.payment_method}
                            </p>
                            {order.reference_number && (
                              <p>
                                <span className="font-medium">Ref:</span> {order.reference_number}
                              </p>
                            )}
                            {order.transaction_id && (
                              <p>
                                <span className="font-medium">ID:</span> {order.transaction_id}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert className="border-0 bg-gradient-to-r from-gray-100 to-blue-100 shadow-lg rounded-xl">
                    <Clock className="h-4 w-4" />
                    <AlertDescription className="text-gray-700 font-medium">
                      No tienes órdenes aún. ¡Selecciona tus cartones favoritos y realiza tu primera compra!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Pago (mismo que antes, pero adaptado) */}
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Información de Pago - ${totalAmount} USD
              </DialogTitle>
              <DialogDescription>
                Completa la información de pago para procesar tu orden de {cartItems.length} cartones seleccionados
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Selección de método de pago */}
              <div className="space-y-4">
                <Label className="text-lg font-bold text-gray-800">Selecciona tu método de pago:</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(PAYMENT_ACCOUNTS).map(([key, account]) => (
                    <div
                      key={key}
                      onClick={() => setPaymentInfo((prev) => ({ ...prev, method: key }))}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        paymentInfo.method === key
                          ? "border-blue-500 bg-blue-50 shadow-lg"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            paymentInfo.method === key ? "border-blue-500 bg-blue-500" : "border-gray-300"
                          }`}
                        >
                          {paymentInfo.method === key && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{account.name}</p>
                          <p className="text-sm text-gray-600">
                            {key === "pago-movil" && "🇻🇪 Método preferido en Venezuela"}
                            {key === "zelle" && "🇺🇸 Transferencia rápida"}
                            {key === "binance" && "₿ Criptomonedas"}
                            {key === "paypal" && "💳 Internacional"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Información de la cuenta seleccionada */}
              {paymentInfo.method && (
                <Card className="border-2 border-blue-200 bg-blue-50">
                  <CardHeader className="bg-blue-600 text-white rounded-t-lg">
                    <CardTitle className="text-lg">
                      📋 Datos para {PAYMENT_ACCOUNTS[paymentInfo.method as keyof typeof PAYMENT_ACCOUNTS].name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {paymentInfo.method === "pago-movil" && (
                      <>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <div>
                            <p className="font-bold">🏦 Banco: {PAYMENT_ACCOUNTS["pago-movil"].bank}</p>
                            <p>📱 Teléfono: {PAYMENT_ACCOUNTS["pago-movil"].phone}</p>
                            <p>🆔 Cédula: {PAYMENT_ACCOUNTS["pago-movil"].ci}</p>
                            <p>👤 Titular: {PAYMENT_ACCOUNTS["pago-movil"].holder}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(PAYMENT_ACCOUNTS["pago-movil"].phone)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <Alert className="border-yellow-300 bg-yellow-50">
                          <AlertDescription className="text-yellow-800">
                            💡 <strong>Instrucciones:</strong> Realiza el Pago Móvil por{" "}
                            <strong>${totalAmount} USD</strong> y luego completa los datos de confirmación abajo.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}

                    {paymentInfo.method === "zelle" && (
                      <>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <div>
                            <p className="font-bold">📧 Email: {PAYMENT_ACCOUNTS.zelle.email}</p>
                            <p>👤 Titular: {PAYMENT_ACCOUNTS.zelle.holder}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(PAYMENT_ACCOUNTS.zelle.email)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <Alert className="border-green-300 bg-green-50">
                          <AlertDescription className="text-green-800">
                            💡 <strong>Instrucciones:</strong> Envía <strong>${totalAmount} USD</strong> por Zelle y
                            proporciona el ID de confirmación.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}

                    {paymentInfo.method === "binance" && (
                      <>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <div>
                            <p className="font-bold">🆔 Binance ID: {PAYMENT_ACCOUNTS.binance.id}</p>
                            <p>👤 Titular: {PAYMENT_ACCOUNTS.binance.holder}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(PAYMENT_ACCOUNTS.binance.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <Alert className="border-orange-300 bg-orange-50">
                          <AlertDescription className="text-orange-800">
                            💡 <strong>Instrucciones:</strong> Usa Binance Pay para enviar{" "}
                            <strong>${totalAmount} USD</strong> en USDT y proporciona el hash de transacción.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}

                    {paymentInfo.method === "paypal" && (
                      <>
                        <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                          <div>
                            <p className="font-bold">📧 PayPal: {PAYMENT_ACCOUNTS.paypal.email}</p>
                            <p>👤 Titular: {PAYMENT_ACCOUNTS.paypal.holder}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(PAYMENT_ACCOUNTS.paypal.email)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <Alert className="border-blue-300 bg-blue-50">
                          <AlertDescription className="text-blue-800">
                            💡 <strong>Instrucciones:</strong> Envía <strong>${totalAmount} USD</strong> por PayPal y
                            proporciona el ID de transacción.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Formulario de confirmación */}
              {paymentInfo.method && (
                <Card className="border-2 border-green-200">
                  <CardHeader className="bg-green-600 text-white rounded-t-lg">
                    <CardTitle className="text-lg">✅ Confirma tu Pago</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {paymentInfo.method === "pago-movil" ? (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="referenceNumber" className="text-gray-700 font-medium">
                            Número de Referencia *
                          </Label>
                          <Input
                            id="referenceNumber"
                            value={paymentInfo.referenceNumber}
                            onChange={(e) => setPaymentInfo((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                            placeholder="Ej: 123456789"
                            className="border-2 border-green-200 focus:border-green-500 rounded-lg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="senderPhone" className="text-gray-700 font-medium">
                            Teléfono del Emisor *
                          </Label>
                          <Input
                            id="senderPhone"
                            value={paymentInfo.senderPhone}
                            onChange={(e) => setPaymentInfo((prev) => ({ ...prev, senderPhone: e.target.value }))}
                            placeholder="0414-1234567"
                            className="border-2 border-green-200 focus:border-green-500 rounded-lg"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="senderName" className="text-gray-700 font-medium">
                            Nombre del Emisor *
                          </Label>
                          <Input
                            id="senderName"
                            value={paymentInfo.senderName}
                            onChange={(e) => setPaymentInfo((prev) => ({ ...prev, senderName: e.target.value }))}
                            placeholder="Nombre completo del que envió el pago"
                            className="border-2 border-green-200 focus:border-green-500 rounded-lg"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="transactionId" className="text-gray-700 font-medium">
                          ID de Transacción / Hash *
                        </Label>
                        <Input
                          id="transactionId"
                          value={paymentInfo.transactionId}
                          onChange={(e) => setPaymentInfo((prev) => ({ ...prev, transactionId: e.target.value }))}
                          placeholder="ID de confirmación de la transacción"
                          className="border-2 border-green-200 focus:border-green-500 rounded-lg"
                        />
                      </div>
                    )}

                    <Alert className="border-0 bg-blue-50">
                      <AlertDescription className="text-blue-800 text-sm">
                        ℹ️ Después de completar el pago, el administrador verificará la transacción y te dará acceso al
                        juego. Recibirás una confirmación por WhatsApp.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={processPurchase}
                  disabled={!paymentInfo.method}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold rounded-lg disabled:opacity-50"
                >
                  ✅ Confirmar Compra
                </Button>
                <Button variant="outline" onClick={() => setShowPaymentForm(false)} className="flex-1 bg-transparent">
                  ❌ Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
