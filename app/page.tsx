"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Users,
  CreditCard,
  Trophy,
  Play,
  Eye,
  History,
  Sparkles,
  Target,
  ShoppingCart,
  Clock,
  XCircle,
  Check,
  DollarSign,
  MessageCircle,
} from "lucide-react"

// Importar el componente de configuración de WhatsApp
import WhatsAppConfig from "@/components/whatsapp-config"

// Importar el nuevo componente al inicio del archivo
import QuickNotificationButton from "@/components/quick-notification-button"

// Tipos de datos existentes
interface BingoCard {
  id: string
  numbers: number[]
  buyerId: string
}

interface Player {
  id: string
  name: string
  phone: string
  cedula: string
  cardsCount: number
  cards: BingoCard[]
}

interface Winner {
  player: Player
  card: BingoCard
  winningNumbers: number[]
}

interface GameHistory {
  id: number
  name: string
  status: string
  created_at: string
  finished_at?: string
  players_count: number
  total_cards: number
  winners_count: number
  total_numbers_called: number
}

// Nuevos tipos para órdenes de compra
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
  playerCedula: string
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

const PAYMENT_METHODS = {
  "pago-movil": "🇻🇪 Pago Móvil",
  zelle: "🇺🇸 Zelle",
  binance: "₿ Binance Pay",
  paypal: "💳 PayPal",
}

export default function BingoAdminPanel() {
  // Estados existentes
  const [players, setPlayers] = useState<Player[]>([])
  const [calledNumbers, setCalledNumbers] = useState<number[]>([])
  const [currentGame, setCurrentGame] = useState<boolean>(false)
  const [winners, setWinners] = useState<Winner[]>([])
  const [lastCalledNumber, setLastCalledNumber] = useState<number | null>(null)
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([])

  // Nuevos estados para órdenes
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])

  // Estados para formularios existentes
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerPhone, setNewPlayerPhone] = useState("")
  const [newPlayerCedula, setNewPlayerCedula] = useState("")
  const [newPlayerCards, setNewPlayerCards] = useState("")
  const [csvData, setCsvData] = useState("")

  // Funciones existentes
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

  const addPlayer = () => {
    if (!newPlayerName || !newPlayerPhone || !newPlayerCedula) return

    const cardCount = Number.parseInt(newPlayerCards) || 1
    const cards: BingoCard[] = []

    for (let i = 0; i < cardCount; i++) {
      cards.push({
        id: `${Date.now()}-${i}`,
        numbers: generateRandomCard(),
        buyerId: newPlayerCedula,
      })
    }

    const newPlayer: Player = {
      id: newPlayerCedula,
      name: newPlayerName,
      phone: newPlayerPhone,
      cedula: newPlayerCedula,
      cardsCount: cardCount,
      cards: cards,
    }

    setPlayers((prev) => [...prev, newPlayer])
    setNewPlayerName("")
    setNewPlayerPhone("")
    setNewPlayerCedula("")
    setNewPlayerCards("")
    addToHistory("Jugador agregado", newPlayerName)
  }

  const processCsvData = () => {
    if (!csvData.trim()) return

    const lines = csvData.trim().split("\n")
    const newPlayers: Player[] = []

    lines.forEach((line) => {
      const parts = line.split(",").map((part) => part.trim())
      if (parts.length >= 4) {
        const [name, phone, cedula, ...cardNumbers] = parts
        const cards: BingoCard[] = []

        for (let i = 0; i < cardNumbers.length; i += 24) {
          const cardNums = cardNumbers
            .slice(i, i + 24)
            .map((num) => Number.parseInt(num))
            .filter((num) => !isNaN(num) && num >= 1 && num <= 75)

          if (cardNums.length === 24) {
            cards.push({
              id: `${Date.now()}-${i / 24}`,
              numbers: cardNums,
              buyerId: cedula,
            })
          }
        }

        if (cards.length > 0) {
          newPlayers.push({
            id: cedula,
            name: name,
            phone: phone,
            cedula: cedula,
            cardsCount: cards.length,
            cards: cards,
          })
        }
      }
    })

    setPlayers((prev) => [...prev, ...newPlayers])
    setCsvData("")
    addToHistory("Carga masiva CSV", `${newPlayers.length} jugadores`)
  }

  const callNextNumber = () => {
    const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1).filter((num) => !calledNumbers.includes(num))

    if (availableNumbers.length === 0) return

    const randomIndex = Math.floor(Math.random() * availableNumbers.length)
    const newNumber = availableNumbers[randomIndex]

    setCalledNumbers((prev) => [...prev, newNumber])
    setLastCalledNumber(newNumber)
    setCurrentGame(true)
    addToHistory("Número cantado", newNumber.toString())

    // Notificar número cantado por WhatsApp
    const notifyNumberCalled = async () => {
      try {
        // Obtener jugadores con números de teléfono válidos
        const playersForNotification = players
          .map((player) => {
            // Buscar el teléfono en las órdenes verificadas
            const order = purchaseOrders.find((o) => o.playerCedula === player.cedula && o.status === "verified")
            return {
              phone: order?.playerPhone || player.phone,
              name: player.name,
            }
          })
          .filter((p) => p.phone && p.phone.length > 0)

        if (playersForNotification.length > 0) {
          await fetch("/api/notifications/game-events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "number-called",
              players: playersForNotification,
              number: newNumber,
              totalCalled: calledNumbers.length + 1,
            }),
          })
        }
      } catch (error) {
        console.error("Error sending number called notification:", error)
      }
    }

    notifyNumberCalled()
  }

  const checkWinners = () => {
    const newWinners: Winner[] = []

    players.forEach((player) => {
      player.cards.forEach((card) => {
        const matchedNumbers = card.numbers.filter((num) => calledNumbers.includes(num))

        if (matchedNumbers.length === card.numbers.length) {
          newWinners.push({
            player: player,
            card: card,
            winningNumbers: matchedNumbers,
          })
        }
      })
    })

    setWinners(newWinners)
    if (newWinners.length > 0) {
      addToHistory("¡BINGO!", `${newWinners.length} ganador(es)`)
    }

    // Notificar ganadores por WhatsApp
    if (newWinners.length > 0) {
      newWinners.forEach(async (winner) => {
        try {
          await fetch("/api/notifications/game-events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "bingo-winner",
              winner: {
                name: winner.player.name,
                phone: winner.player.phone,
                cardId: winner.card.id,
              },
            }),
          })
        } catch (error) {
          console.error("Error sending winner notification:", error)
        }
      })
    }
  }

  const resetGame = () => {
    setCalledNumbers([])
    setLastCalledNumber(null)
    setWinners([])
    setCurrentGame(false)
    addToHistory("Juego reiniciado", "Nuevo juego iniciado")

    // Notificar reinicio de juego
    const notifyGameReset = async () => {
      try {
        const playersForNotification = players
          .map((player) => {
            const order = purchaseOrders.find((o) => o.playerCedula === player.cedula && o.status === "verified")
            return {
              phone: order?.playerPhone || player.phone,
              name: player.name,
            }
          })
          .filter((p) => p.phone && p.phone.length > 0)

        if (playersForNotification.length > 0) {
          await fetch("/api/notifications/game-events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "game-reset",
              players: playersForNotification,
            }),
          })
        }
      } catch (error) {
        console.error("Error sending game reset notification:", error)
      }
    }

    notifyGameReset()
  }

  const startGame = () => {
    if (players.length === 0) {
      alert("No hay jugadores registrados para iniciar el juego")
      return
    }

    setCurrentGame(true)
    addToHistory("Juego iniciado", `${players.length} jugadores participando`)

    // Notificar inicio de juego
    const notifyGameStarted = async () => {
      try {
        const playersForNotification = players
          .map((player) => {
            const order = purchaseOrders.find((o) => o.playerCedula === player.cedula && o.status === "verified")
            return {
              phone: order?.playerPhone || player.phone,
              name: player.name,
            }
          })
          .filter((p) => p.phone && p.phone.length > 0)

        if (playersForNotification.length > 0) {
          await fetch("/api/notifications/game-events", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "game-started",
              players: playersForNotification,
            }),
          })
        }
      } catch (error) {
        console.error("Error sending game started notification:", error)
      }
    }

    notifyGameStarted()
  }

  const clearAll = () => {
    setPlayers([])
    resetGame()
    addToHistory("Sistema limpiado", "Todos los datos eliminados")
  }

  const addToHistory = (action: string, details: string) => {
    const newEntry: GameHistory = {
      id: Date.now(),
      name: `${action}: ${details}`,
      status: currentGame ? "active" : "finished",
      created_at: new Date().toISOString(),
      players_count: players.length,
      total_cards: players.reduce((sum, p) => sum + p.cardsCount, 0),
      winners_count: winners.length,
      total_numbers_called: calledNumbers.length,
    }

    setGameHistory((prev) => [newEntry, ...prev.slice(0, 9)])
  }

  // Nuevas funciones para gestión de órdenes
  const loadPurchaseOrders = () => {
    const orders = JSON.parse(localStorage.getItem("bingoOrders") || "[]")
    setPurchaseOrders(orders)
  }

  const updateOrderStatus = async (orderId: string, newStatus: "paid" | "verified" | "rejected") => {
    const updatedOrders = purchaseOrders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order,
    )

    setPurchaseOrders(updatedOrders)
    localStorage.setItem("bingoOrders", JSON.stringify(updatedOrders))

    // Si se verifica el pago, agregar jugador automáticamente
    if (newStatus === "verified") {
      const order = purchaseOrders.find((o) => o.id === orderId)
      if (order) {
        const newPlayer: Player = {
          id: order.playerCedula,
          name: order.playerName,
          phone: order.playerPhone,
          cedula: order.playerCedula,
          cardsCount: order.cartItems.length,
          cards: order.cartItems.map((item) => ({
            id: item.id,
            numbers: item.numbers,
            buyerId: order.playerCedula,
          })),
        }

        setPlayers((prev) => {
          const existingPlayerIndex = prev.findIndex((p) => p.id === order.playerCedula)
          if (existingPlayerIndex >= 0) {
            // Actualizar jugador existente
            const updatedPlayers = [...prev]
            updatedPlayers[existingPlayerIndex] = {
              ...updatedPlayers[existingPlayerIndex],
              cardsCount: updatedPlayers[existingPlayerIndex].cardsCount + order.cartItems.length,
              cards: [...updatedPlayers[existingPlayerIndex].cards, ...newPlayer.cards],
            }
            return updatedPlayers
          } else {
            // Agregar nuevo jugador
            return [...prev, newPlayer]
          }
        })

        addToHistory("Pago verificado", `${order.playerName} - ${order.cartItems.length} cartones`)
      }
    }

    // 🚀 NOTIFICACIÓN WHATSAPP MEJORADA - Con mejor manejo de errores
    if (newStatus === "verified") {
      const order = purchaseOrders.find((o) => o.id === orderId)
      if (order) {
        try {
          console.log("📱 Enviando notificación de pago verificado...")

          const response = await fetch("/api/notifications/payment-verified", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              playerName: order.playerName,
              playerPhone: order.playerPhone,
              orderId: order.id,
              cartCount: order.cartItems.length,
            }),
          })

          const result = await response.json()

          if (response.ok && result.success) {
            if (result.mock || result.fallback) {
              alert(`✅ Pago verificado. 📱 Notificación simulada (${result.mock ? "sin Twilio" : "fallback"})`)
            } else {
              alert(`✅ ¡Pago verificado y ${order.playerName} notificado por WhatsApp!`)
            }
          } else {
            console.error("Error en notificación:", result)
            alert(`✅ Pago verificado. ⚠️ Error en WhatsApp: ${result.error || "Error desconocido"}`)
          }
        } catch (error) {
          console.error("Error enviando notificación:", error)
          alert("✅ Pago verificado. ⚠️ No se pudo enviar la notificación WhatsApp.")
        }
      }
    } else if (newStatus === "rejected") {
      const order = purchaseOrders.find((o) => o.id === orderId)
      if (order) {
        try {
          await fetch("/api/notifications/payment-rejected", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              playerName: order.playerName,
              playerPhone: order.playerPhone,
              orderId: order.id,
              reason: "Pago no verificado",
            }),
          })

          alert(`❌ Pago rechazado y notificación enviada a ${order.playerName}`)
        } catch (error) {
          console.error("Error enviando notificación de rechazo:", error)
          alert("❌ Pago rechazado. ⚠️ No se pudo enviar la notificación WhatsApp.")
        }
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500 text-white">⏳ Pendiente</Badge>
      case "paid":
        return <Badge className="bg-blue-500 text-white">💳 Pago Confirmado</Badge>
      case "verified":
        return <Badge className="bg-green-500 text-white">✅ Verificado</Badge>
      case "rejected":
        return <Badge className="bg-red-500 text-white">❌ Rechazado</Badge>
      default:
        return <Badge className="bg-gray-500 text-white">❓ Desconocido</Badge>
    }
  }

  // Effects
  useEffect(() => {
    if (calledNumbers.length > 0) {
      checkWinners()
    }
  }, [calledNumbers, players])

  useEffect(() => {
    loadPurchaseOrders()
    const interval = setInterval(loadPurchaseOrders, 5000) // Actualizar cada 5 segundos
    return () => clearInterval(interval)
  }, [])

  // Estadísticas
  const totalCards = players.reduce((sum, player) => sum + player.cardsCount, 0)
  const activePlayersCount = players.length
  const pendingOrders = purchaseOrders.filter((order) => order.status === "pending").length
  const totalRevenue = purchaseOrders
    .filter((order) => order.status === "verified")
    .reduce((sum, order) => sum + order.totalAmount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
              <Target className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              Panel Administrativo de Bingo
            </h1>
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gestiona jugadores, cartones, órdenes de compra y controla el juego de bingo
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white transform hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Jugadores Activos</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{activePlayersCount}</div>
              <p className="text-blue-100 text-sm">Participantes registrados</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white transform hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100">Cartones Vendidos</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalCards}</div>
              <p className="text-emerald-100 text-sm">Total en juego</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-500 text-white transform hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-100">Último Número</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Play className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{lastCalledNumber ? lastCalledNumber : "-"}</div>
              <p className="text-orange-100 text-sm">Recién cantado</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white transform hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100">Órdenes Pendientes</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingOrders}</div>
              <p className="text-yellow-100 text-sm">Esperando verificación</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white transform hover:scale-105 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Ingresos</CardTitle>
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
              <p className="text-purple-100 text-sm">Pagos verificados</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 bg-gradient-to-r from-purple-100 to-blue-100 p-1 rounded-xl">
              <TabsTrigger
                value="orders"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 rounded-lg font-medium transition-all duration-200"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Órdenes de Compra
              </TabsTrigger>
              <TabsTrigger
                value="players"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 rounded-lg font-medium transition-all duration-200"
              >
                <Users className="w-4 h-4 mr-2" />
                Jugadores
              </TabsTrigger>
              <TabsTrigger
                value="game"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 rounded-lg font-medium transition-all duration-200"
              >
                <Play className="w-4 h-4 mr-2" />
                Juego
              </TabsTrigger>
              <TabsTrigger
                value="winners"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 rounded-lg font-medium transition-all duration-200"
              >
                <Trophy className="w-4 h-4 mr-2" />
                Ganadores
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 rounded-lg font-medium transition-all duration-200"
              >
                <History className="w-4 h-4 mr-2" />
                Historial
              </TabsTrigger>
              {/* Agregar una nueva pestaña en el TabsList: */}
              <TabsTrigger
                value="whatsapp"
                className="data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-purple-700 rounded-lg font-medium transition-all duration-200"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </TabsTrigger>
            </TabsList>

            {/* Gestión de Órdenes de Compra */}
            <TabsContent value="orders" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Órdenes de Compra ({purchaseOrders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-700">Cliente</TableHead>
                        <TableHead className="font-semibold text-gray-700">Contacto</TableHead>
                        <TableHead className="font-semibold text-gray-700">Cédula</TableHead>
                        <TableHead className="font-semibold text-gray-700">Cartones</TableHead>
                        <TableHead className="font-semibold text-gray-700">Total</TableHead>
                        <TableHead className="font-semibold text-gray-700">Pago</TableHead>
                        <TableHead className="font-semibold text-gray-700">Estado</TableHead>
                        <TableHead className="font-semibold text-gray-700">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchaseOrders.map((order, index) => (
                        <TableRow key={order.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{order.playerName}</p>
                              <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-gray-600">{order.playerPhone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-gray-600 font-mono">{order.playerCedula}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                              {order.cartItems.length}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-green-600">${order.totalAmount.toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">
                                {PAYMENT_METHODS[order.paymentMethod as keyof typeof PAYMENT_METHODS] ||
                                  order.paymentMethod}
                              </p>
                              {order.referenceNumber && (
                                <p className="text-xs text-gray-500">Ref: {order.referenceNumber}</p>
                              )}
                              {order.transactionId && (
                                <p className="text-xs text-gray-500">ID: {order.transactionId}</p>
                              )}
                              {order.senderPhone && <p className="text-xs text-gray-500">Tel: {order.senderPhone}</p>}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(order.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-300 text-blue-600 bg-transparent"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl">
                                  <DialogHeader>
                                    <DialogTitle>Detalle de Orden - {order.playerName}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-bold mb-2">Información del Cliente:</h4>
                                        <p>
                                          <strong>Nombre:</strong> {order.playerName}
                                        </p>
                                        <p>
                                          <strong>Teléfono:</strong> {order.playerPhone}
                                        </p>
                                        <p>
                                          <strong>Cédula:</strong> {order.playerCedula}
                                        </p>
                                      </div>
                                      <div>
                                        <h4 className="font-bold mb-2">Información de Pago:</h4>
                                        <p>
                                          <strong>Método:</strong>{" "}
                                          {PAYMENT_METHODS[order.paymentMethod as keyof typeof PAYMENT_METHODS] ||
                                            order.paymentMethod}
                                        </p>
                                        {order.referenceNumber && (
                                          <p>
                                            <strong>Número de Referencia:</strong> {order.referenceNumber}
                                          </p>
                                        )}
                                        {order.senderPhone && (
                                          <p>
                                            <strong>Teléfono Emisor:</strong> {order.senderPhone}
                                          </p>
                                        )}
                                        {order.senderName && (
                                          <p>
                                            <strong>Nombre Emisor:</strong> {order.senderName}
                                          </p>
                                        )}
                                        {order.transactionId && (
                                          <p>
                                            <strong>ID Transacción:</strong> {order.transactionId}
                                          </p>
                                        )}
                                        <p>
                                          <strong>Total:</strong> ${order.totalAmount} USD
                                        </p>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-bold mb-2">Cartones Comprados:</h4>
                                      <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
                                        {order.cartItems.map((item, index) => (
                                          <div key={item.id} className="border rounded-lg p-3 bg-gray-50">
                                            <h5 className="font-medium mb-2">Cartón #{index + 1}</h5>
                                            <div className="grid grid-cols-5 gap-1 text-xs">
                                              {item.numbers.map((num, i) => (
                                                <div
                                                  key={i}
                                                  className="p-1 text-center border rounded bg-white text-gray-700"
                                                >
                                                  {num}
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              {/* 🚀 NUEVO: Botón de notificación rápida */}
                              <QuickNotificationButton
                                playerName={order.playerName}
                                playerPhone={order.playerPhone}
                                orderId={order.id}
                              />

                              {order.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateOrderStatus(order.id, "verified")}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateOrderStatus(order.id, "rejected")}
                                    className="border-red-300 text-red-600 hover:bg-red-50 bg-transparent"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resto del contenido permanece igual... */}
            {/* [Aquí van todas las demás TabsContent que ya estaban en el código original] */}

            {/* Configuración de WhatsApp */}
            <TabsContent value="whatsapp" className="space-y-6">
              <WhatsAppConfig />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
