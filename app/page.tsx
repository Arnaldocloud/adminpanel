"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import {
  Users,
  CreditCard,
  Trophy,
  Play,
  RotateCcw,
  Plus,
  Eye,
  CheckCircle,
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

    // Enviar notificaciones de WhatsApp
    if (newStatus === "verified") {
      try {
        const order = purchaseOrders.find((o) => o.id === orderId)
        if (order) {
          await fetch("/api/notifications/payment-verified", {
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
        }
      } catch (error) {
        console.error("Error sending verification notification:", error)
      }
    } else if (newStatus === "rejected") {
      try {
        const order = purchaseOrders.find((o) => o.id === orderId)
        if (order) {
          await fetch("/api/notifications/payment-rejected", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              playerName: order.playerName,
              playerPhone: order.playerPhone,
              orderId: order.id,
              reason: "Pago no verificado", // Puedes hacer esto configurable
            }),
          })
        }
      } catch (error) {
        console.error("Error sending rejection notification:", error)
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

            {/* Gestión de Jugadores */}
            <TabsContent value="players" className="space-y-6">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Agregar Jugadores Manualmente
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="playerName" className="text-gray-700 font-medium">
                        Nombre del Jugador
                      </Label>
                      <Input
                        id="playerName"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="Nombre completo"
                        className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playerPhone" className="text-gray-700 font-medium">
                        Teléfono
                      </Label>
                      <Input
                        id="playerPhone"
                        value={newPlayerPhone}
                        onChange={(e) => setNewPlayerPhone(e.target.value)}
                        placeholder="0414-1234567"
                        className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="playerCedula" className="text-gray-700 font-medium">
                        Cédula de Identidad
                      </Label>
                      <Input
                        id="playerCedula"
                        value={newPlayerCedula}
                        onChange={(e) => setNewPlayerCedula(e.target.value)}
                        placeholder="V-12345678"
                        className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCount" className="text-gray-700 font-medium">
                        Cantidad de Cartones
                      </Label>
                      <Input
                        id="cardCount"
                        type="number"
                        min="1"
                        value={newPlayerCards}
                        onChange={(e) => setNewPlayerCards(e.target.value)}
                        placeholder="1"
                        className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={addPlayer}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Jugador
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-gradient-to-r from-blue-200 to-indigo-200 h-0.5" />

                  <div className="space-y-4">
                    <Label htmlFor="csvData" className="text-gray-700 font-medium text-lg">
                      Carga Masiva (CSV)
                    </Label>
                    <Textarea
                      id="csvData"
                      value={csvData}
                      onChange={(e) => setCsvData(e.target.value)}
                      placeholder="Formato: Nombre, Teléfono, Cédula, Num1, Num2, ..., Num24"
                      rows={4}
                      className="border-2 border-blue-200 focus:border-blue-500 rounded-lg"
                    />
                    <div className="flex gap-3">
                      <Button
                        onClick={processCsvData}
                        variant="outline"
                        className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 font-medium rounded-lg bg-transparent"
                      >
                        Procesar CSV
                      </Button>
                      <Button
                        onClick={clearAll}
                        variant="outline"
                        className="border-2 border-red-500 text-red-600 hover:bg-red-50 font-medium rounded-lg bg-transparent"
                      >
                        Limpiar Todo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Jugadores Registrados ({players.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-700">Nombre</TableHead>
                        <TableHead className="font-semibold text-gray-700">Teléfono</TableHead>
                        <TableHead className="font-semibold text-gray-700">Cédula</TableHead>
                        <TableHead className="font-semibold text-gray-700">Cartones</TableHead>
                        <TableHead className="font-semibold text-gray-700">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player, index) => (
                        <TableRow key={player.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <TableCell className="font-medium text-gray-900">{player.name}</TableCell>
                          <TableCell className="text-gray-600">{player.phone}</TableCell>
                          <TableCell className="text-gray-600 font-mono">{player.cedula}</TableCell>
                          <TableCell>
                            <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                              {player.cardsCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-lg bg-transparent"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Cartones
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                  <DialogTitle className="text-xl font-bold text-gray-800">
                                    Cartones de {player.name} (C.I: {player.cedula})
                                  </DialogTitle>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                  {player.cards.map((card, index) => (
                                    <div
                                      key={card.id}
                                      className="border-2 border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-indigo-50"
                                    >
                                      <h4 className="font-bold mb-3 text-blue-800">Cartón #{index + 1}</h4>
                                      <div className="grid grid-cols-5 gap-1 text-sm">
                                        {card.numbers.map((num, i) => (
                                          <div
                                            key={i}
                                            className={`p-2 text-center text-sm border-2 rounded-lg font-bold transition-all duration-200 ${
                                              calledNumbers.includes(num)
                                                ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 text-white shadow-lg transform scale-105"
                                                : "bg-white border-gray-300 text-gray-700 hover:border-blue-300"
                                            }`}
                                          >
                                            {num}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Módulo de Juego */}
            <TabsContent value="game" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-red-50">
                  <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Play className="h-5 w-5" />
                      Control del Juego
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="text-center space-y-6">
                      {lastCalledNumber && (
                        <div className="p-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300">
                          <div className="text-sm text-orange-100 mb-2 font-medium">Último número cantado:</div>
                          <div className="text-7xl font-bold text-white drop-shadow-lg">{lastCalledNumber}</div>
                          <div className="mt-2 text-orange-100">¡Marca tus cartones!</div>
                        </div>
                      )}

                      <div className="flex gap-4 justify-center flex-wrap">
                        {!currentGame && (
                          <Button
                            onClick={startGame}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200"
                          >
                            <Play className="w-5 h-5 mr-2" />
                            Iniciar Juego
                          </Button>
                        )}

                        <Button
                          onClick={callNextNumber}
                          size="lg"
                          disabled={calledNumbers.length >= 75}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Cantar Siguiente Número
                        </Button>

                        <Button
                          onClick={resetGame}
                          variant="outline"
                          size="lg"
                          className="border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-bold py-4 px-8 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 bg-transparent"
                        >
                          <RotateCcw className="w-5 h-5 mr-2" />
                          Reiniciar Juego
                        </Button>
                      </div>

                      <div className="bg-white/70 rounded-lg p-4">
                        <div className="text-lg font-semibold text-gray-700">
                          Progreso: {calledNumbers.length} / 75 números
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(calledNumbers.length / 75) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-lg">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Números Cantados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-10 gap-2 max-h-64 overflow-y-auto">
                      {Array.from({ length: 75 }, (_, i) => i + 1).map((num) => (
                        <div
                          key={num}
                          className={`p-2 text-center text-sm border-2 rounded-lg font-bold transition-all duration-300 ${
                            calledNumbers.includes(num)
                              ? "bg-gradient-to-br from-purple-500 to-indigo-600 border-purple-500 text-white shadow-lg transform scale-110"
                              : "bg-gray-50 border-gray-300 text-gray-400 hover:border-gray-400"
                          }`}
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Verificación de Ganadores */}
            <TabsContent value="winners" className="space-y-6">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Estado de Ganadores
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {winners.length > 0 ? (
                    <div className="space-y-6">
                      <Alert className="border-0 bg-gradient-to-r from-green-100 to-emerald-100 shadow-lg rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-500 rounded-full">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                          <AlertDescription className="text-green-800 font-semibold text-lg">
                            🎉 ¡Se encontraron {winners.length} ganador(es)! 🎉
                          </AlertDescription>
                        </div>
                      </Alert>

                      {winners.map((winner, index) => (
                        <Card key={index} className="border-0 shadow-xl bg-gradient-to-br from-yellow-50 to-orange-50">
                          <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
                            <CardTitle className="flex items-center gap-2">
                              <Trophy className="h-6 w-6" />🏆 ¡BINGO! - Ganador #{index + 1}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <h4 className="font-bold text-lg text-gray-800 mb-3">Información del Ganador:</h4>
                                <div className="space-y-2">
                                  <p className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Nombre:</span>
                                    <span className="text-gray-900">{winner.player.name}</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Teléfono:</span>
                                    <span className="text-gray-900">{winner.player.phone}</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Cédula:</span>
                                    <span className="text-gray-900 font-mono">{winner.player.cedula}</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-700">Cartón ID:</span>
                                    <span className="text-gray-900">{winner.card.id}</span>
                                  </p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-bold text-lg text-gray-800 mb-3">Cartón Ganador:</h4>
                                <div className="grid grid-cols-5 gap-1 text-xs">
                                  {winner.card.numbers.map((num, i) => (
                                    <div
                                      key={i}
                                      className="p-2 text-center border-2 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 border-green-500 text-white font-bold shadow-lg"
                                    >
                                      {num}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Alert className="border-0 bg-gradient-to-r from-blue-100 to-indigo-100 shadow-lg rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500 rounded-full">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <AlertDescription className="text-blue-800 font-medium">
                          {currentGame
                            ? "Aún no hay ganadores. ¡Continúa cantando números!"
                            : "Inicia un juego para verificar ganadores."}
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Historial */}
            <TabsContent value="history" className="space-y-6">
              <Card className="border-0 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Historial de Actividades
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {gameHistory.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {gameHistory.map((entry, index) => (
                        <div
                          key={entry.id}
                          className={`flex justify-between items-center p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-lg ${
                            index % 2 === 0
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200"
                              : "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200"
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{entry.name}</p>
                            <p className="text-sm text-gray-600">{new Date(entry.created_at).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={`${
                                entry.status === "active"
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                  : "bg-gradient-to-r from-gray-500 to-slate-500"
                              } text-white`}
                            >
                              {entry.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {entry.players_count} jugadores, {entry.total_cards} cartones
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert className="border-0 bg-gradient-to-r from-gray-100 to-slate-100 shadow-lg rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-500 rounded-full">
                          <History className="h-5 w-5 text-white" />
                        </div>
                        <AlertDescription className="text-gray-700 font-medium">
                          No hay actividades registradas aún. ¡Comienza agregando jugadores!
                        </AlertDescription>
                      </div>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

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
