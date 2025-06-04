"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ShoppingCart, CreditCard, Eye, Clock, XCircle, User, Target, Sparkles, Copy } from "lucide-react"

// Tipos de datos
interface CartItem {
  id: string
  numbers: number[]
  price: number
}

interface PurchaseOrder {
  id: string
  playerName: string
  playerEmail: string
  playerPhone: string
  cartItems: CartItem[]
  totalAmount: number
  status: "pending" | "paid" | "verified" | "rejected"
  createdAt: string
  paymentMethod: string
  transactionId?: string
  referenceNumber?: string
  senderPhone?: string
  senderName?: string
}

export default function UserPanel() {
  // Estados principales
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [playerInfo, setPlayerInfo] = useState({
    name: "",
    email: "",
    phone: "",
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

  // Configuración del juego
  const CARD_PRICE = 2 // Precio por cartón en USD
  const MIN_CARDS = 1
  const MAX_CARDS = 10

  // Información de cuentas para pagos
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

  // Generar cartón aleatorio
  const generateRandomCard = (): number[] => {
    const numbers: number[] = []
    while (numbers.length < 24) {
      const num = Math.floor(Math.random() * 75) + 1
      if (!numbers.includes(num)) {
        numbers.push(num)
      }
    }
    return numbers.sort((a, b) => a - b)
  }

  // Agregar cartón al carrito
  const addCardToCart = () => {
    if (cartItems.length >= MAX_CARDS) {
      alert(`Máximo ${MAX_CARDS} cartones por compra`)
      return
    }

    const newCard: CartItem = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      numbers: generateRandomCard(),
      price: CARD_PRICE,
    }

    setCartItems((prev) => [...prev, newCard])
  }

  // Remover cartón del carrito
  const removeCardFromCart = (cardId: string) => {
    setCartItems((prev) => prev.filter((card) => card.id !== cardId))
  }

  // Calcular total
  const totalAmount = cartItems.reduce((sum, card) => sum + card.price, 0)

  // Copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("¡Copiado al portapapeles!")
  }

  // Procesar compra
  const processPurchase = async () => {
    if (!playerInfo.name || !playerInfo.email || !playerInfo.phone) {
      alert("Por favor completa toda tu información personal")
      return
    }

    if (cartItems.length === 0) {
      alert("Agrega al menos un cartón al carrito")
      return
    }

    if (!paymentInfo.method) {
      alert("Por favor selecciona un método de pago")
      return
    }

    // Validaciones específicas por método de pago
    if (paymentInfo.method === "pago-movil") {
      if (!paymentInfo.referenceNumber || !paymentInfo.senderPhone || !paymentInfo.senderName) {
        alert("Para Pago Móvil necesitas: Número de referencia, teléfono del emisor y nombre del emisor")
        return
      }
    } else {
      if (!paymentInfo.transactionId) {
        alert("Por favor ingresa el ID de transacción")
        return
      }
    }

    const newOrder: PurchaseOrder = {
      id: `order-${Date.now()}`,
      playerName: playerInfo.name,
      playerEmail: playerInfo.email,
      playerPhone: playerInfo.phone,
      cartItems: [...cartItems],
      totalAmount: totalAmount,
      status: "pending",
      createdAt: new Date().toISOString(),
      paymentMethod: paymentInfo.method,
      transactionId: paymentInfo.transactionId,
      referenceNumber: paymentInfo.referenceNumber,
      senderPhone: paymentInfo.senderPhone,
      senderName: paymentInfo.senderName,
    }

    // Simular envío al panel administrativo
    const existingOrders = JSON.parse(localStorage.getItem("bingoOrders") || "[]")
    existingOrders.push(newOrder)
    localStorage.setItem("bingoOrders", JSON.stringify(existingOrders))

    // Enviar notificación de WhatsApp - MEJORADO
    try {
      console.log("📱 Enviando notificación de orden recibida...")
      console.log("📊 Datos a enviar:", {
        playerName: playerInfo.name,
        playerPhone: playerInfo.phone,
        orderId: newOrder.id,
        amount: totalAmount,
        cartCount: cartItems.length,
      })

      const notificationResponse = await fetch("/api/notifications/order-received", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName: playerInfo.name,
          playerPhone: playerInfo.phone,
          orderId: newOrder.id,
          amount: totalAmount,
          cartCount: cartItems.length,
        }),
      })

      console.log("📱 Status de respuesta:", notificationResponse.status)

      const notificationResult = await notificationResponse.json()
      console.log("📱 Resultado completo:", notificationResult)

      if (notificationResponse.ok && notificationResult.success) {
        console.log("✅ Notificación enviada exitosamente:", notificationResult.messageId)
      } else {
        console.error("❌ Error en notificación:", notificationResult)
        // Mostrar el error al usuario
        alert(
          `Orden enviada correctamente, pero hubo un problema con la notificación WhatsApp: ${notificationResult.error || "Error desconocido"}`,
        )
      }
    } catch (error) {
      console.error("💥 Error crítico enviando notificación:", error)
      alert(`Orden enviada correctamente, pero no se pudo enviar la notificación WhatsApp. Error: ${error.message}`)
    }

    setOrders((prev) => [newOrder, ...prev])
    setCartItems([])
    setPaymentInfo({
      method: "",
      transactionId: "",
      referenceNumber: "",
      senderPhone: "",
      senderName: "",
    })
    setShowPaymentForm(false)

    alert("¡Compra enviada! Espera la verificación del administrador.")
  }

  // Cargar órdenes del localStorage
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("bingoOrders") || "[]")
    const userOrders = savedOrders.filter((order: PurchaseOrder) => order.playerEmail === playerInfo.email)
    setOrders(userOrders)
  }, [playerInfo.email])

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
            Selecciona tus cartones, completa tu información y realiza el pago para participar
          </p>
          <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-4 rounded-xl max-w-md mx-auto">
            <p className="text-green-800 font-bold">💰 Precio por cartón: ${CARD_PRICE} USD</p>
            <p className="text-green-700 text-sm">Métodos de pago disponibles: Pago Móvil, Zelle, Binance, PayPal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información del Jugador */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Tu Información
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
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
                  <Label htmlFor="email" className="text-gray-700 font-medium">
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={playerInfo.email}
                    onChange={(e) => setPlayerInfo((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="tu@email.com"
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
              </CardContent>
            </Card>

            {/* Resumen del Carrito */}
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

          {/* Selección de Cartones */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Selecciona tus Cartones
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <p className="text-gray-600">
                      Cartones en el carrito: <span className="font-bold text-purple-600">{cartItems.length}</span>
                    </p>
                    <p className="text-sm text-gray-500">Máximo {MAX_CARDS} cartones por compra</p>
                  </div>
                  <Button
                    onClick={addCardToCart}
                    disabled={cartItems.length >= MAX_CARDS}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Generar Cartón
                  </Button>
                </div>

                {cartItems.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cartItems.map((card, index) => (
                      <div
                        key={card.id}
                        className="border-2 border-purple-200 rounded-xl p-4 bg-gradient-to-br from-purple-50 to-pink-50"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-purple-800">Cartón #{index + 1}</h4>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-purple-300 text-purple-600">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Cartón #{index + 1} - Vista Completa</DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-5 gap-2 p-4">
                                  {card.numbers.map((num, i) => (
                                    <div
                                      key={i}
                                      className="p-3 text-center border-2 rounded-lg bg-white border-purple-300 text-purple-700 font-bold"
                                    >
                                      {num}
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCardFromCart(card.id)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
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
                        <div className="text-center">
                          <span className="text-sm text-gray-500">... y {card.numbers.length - 10} números más</span>
                        </div>
                        <div className="text-center mt-2">
                          <Badge className="bg-green-500 text-white">${card.price} USD</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert className="border-0 bg-gradient-to-r from-blue-100 to-purple-100 shadow-lg rounded-xl">
                    <Target className="h-4 w-4" />
                    <AlertDescription className="text-blue-800 font-medium">
                      Haz clic en "Generar Cartón" para agregar cartones a tu carrito
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Mis Órdenes */}
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
                            <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p>
                              <span className="font-medium">Cartones:</span> {order.cartItems.length}
                            </p>
                            <p>
                              <span className="font-medium">Total:</span> ${order.totalAmount} USD
                            </p>
                          </div>
                          <div>
                            <p>
                              <span className="font-medium">Pago:</span>{" "}
                              {PAYMENT_ACCOUNTS[order.paymentMethod as keyof typeof PAYMENT_ACCOUNTS]?.name ||
                                order.paymentMethod}
                            </p>
                            {order.referenceNumber && (
                              <p>
                                <span className="font-medium">Ref:</span> {order.referenceNumber}
                              </p>
                            )}
                            {order.transactionId && (
                              <p>
                                <span className="font-medium">ID:</span> {order.transactionId}
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
                      No tienes órdenes aún. ¡Compra tus primeros cartones!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal de Pago */}
        <Dialog open={showPaymentForm} onOpenChange={setShowPaymentForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Información de Pago - ${totalAmount} USD
              </DialogTitle>
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
                        juego. Recibirás una confirmación por email.
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
                <Button variant="outline" onClick={() => setShowPaymentForm(false)} className="flex-1">
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
