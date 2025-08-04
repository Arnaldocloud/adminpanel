"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
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
  Package,
  Loader2,
  AlertCircle,
  RefreshCw
} from "lucide-react"

// Importar componentes
import WhatsAppConfig from "@/components/whatsapp-config"
import QuickNotificationButton from "@/components/quick-notification-button"
import AdminCardManagement from "@/components/admin-card-management"
import { orderService } from "@/lib/order-service"

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

// Componente para mostrar el estado de la orden
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pendiente</Badge>
    case 'paid':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Pagado</Badge>
    case 'verified':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verificado</Badge>
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazado</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
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
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])

  // Estados para formularios existentes
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerPhone, setNewPlayerPhone] = useState("")
  const [newPlayerCedula, setNewPlayerCedula] = useState("")
  const [newPlayerCards, setNewPlayerCards] = useState("")
  const [csvData, setCsvData] = useState("")

  // Funciones existentes (mantengo las principales)
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

  const callNextNumber = () => {
    const availableNumbers = Array.from({ length: 75 }, (_, i) => i + 1).filter((num) => !calledNumbers.includes(num))

    if (availableNumbers.length === 0) return

    const randomIndex = Math.floor(Math.random() * availableNumbers.length)
    const newNumber = availableNumbers[randomIndex]

    setCalledNumbers((prev) => [...prev, newNumber])
    setLastCalledNumber(newNumber)
    setCurrentGame(true)
    addToHistory("Número cantado", newNumber.toString())
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
  }

  const resetGame = () => {
    setCalledNumbers([])
    setLastCalledNumber(null)
    setWinners([])
    setCurrentGame(false)
    addToHistory("Juego reiniciado", "Nuevo juego iniciado")
  }

  const startGame = () => {
    if (players.length === 0) {
      alert("No hay jugadores registrados para iniciar el juego")
      return
    }

    setCurrentGame(true)
    addToHistory("Juego iniciado", `${players.length} jugadores participando`)
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

  // Estados para gestión de órdenes
  const [isLoadingOrders, setIsLoadingOrders] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)

  // Función para actualizar el estado de una orden
  const updateOrderStatus = async (orderId: string, status: 'pending' | 'paid' | 'verified' | 'rejected') => {
    try {
      // Aquí iría la lógica para actualizar el estado en la base de datos
      // Por ahora, simulamos la actualización actualizando el estado local
      setPurchaseOrders((prevOrders: PurchaseOrder[]) => 
        prevOrders.map((order: PurchaseOrder) => 
          order.id === orderId ? { ...order, status } : order
        )
      );
      toast({
        title: 'Estado actualizado',
        description: `La orden se ha marcado como ${status}`,
      });
    } catch (error) {
      console.error('Error al actualizar el estado de la orden:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado de la orden',
        variant: 'destructive',
      });
    }
  };

  // Cargar órdenes desde Supabase
  const loadPurchaseOrders = async () => {
    setIsLoadingOrders(true)
    setOrderError(null)
    try {
      const orders = await orderService.getAllOrders()
      
      // Transform Order[] to PurchaseOrder[]
      const transformedOrders: PurchaseOrder[] = orders.map(order => ({
        id: order.id,
        playerName: order.player_name,
        playerEmail: '', // Este campo no está en Order pero es requerido en PurchaseOrder
        playerPhone: order.player_phone,
        playerCedula: order.player_cedula,
        cartItems: order.cart_items?.map(item => ({
          id: item.id || '',
          numbers: item.numbers,
          price: item.price
        })) || [],
        totalAmount: order.total_amount,
        status: order.status,
        createdAt: order.created_at,
        paymentMethod: order.payment_method,
        transactionId: order.transaction_id,
        referenceNumber: order.reference_number,
        senderPhone: order.sender_phone,
        senderName: order.sender_name
      }))
      
      setPurchaseOrders(transformedOrders)
    } catch (error) {
      console.error('Error al cargar órdenes:', error)
      setOrderError('Error al cargar las órdenes. Intenta recargar la página.')
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las órdenes',
        variant: 'destructive',
      })
    } finally {
      setIsLoadingOrders(false)
    }
  }

  // ...

  // Cargar órdenes cuando cambia la pestaña activa
  const [activeTab, setActiveTab] = useState("orders")
  
  // Efecto para recargar órdenes cuando se cambia a la pestaña de órdenes
  useEffect(() => {
    if (activeTab === "orders") {
      loadPurchaseOrders()
    }
  }, [activeTab])

  // Función auxiliar para mostrar texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'paid': return 'Pagado'
      case 'verified': return 'Verificado'
      case 'rejected': return 'Rechazado'
      default: return status
    }
  }

  // Componente de estado de carga
  if (isLoadingOrders && purchaseOrders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración de Bingo</h1>
          <p className="text-gray-600">Gestiona jugadores, partidas y ganadores</p>
        </header>

        {/* Main Content */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <Tabs 
            defaultValue="orders" 
            className="space-y-6"
            value={activeTab}
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="orders">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Órdenes
              </TabsTrigger>
              <TabsTrigger value="cards">
                <Package className="w-4 h-4 mr-2" />
                Cartones
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
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      Órdenes de Compra ({purchaseOrders.length})
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="bg-white/10 hover:bg-white/20 border-white/20"
                      onClick={loadPurchaseOrders}
                      disabled={isLoadingOrders}
                    >
                      {isLoadingOrders ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Actualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {orderError && (
                    <div className="p-4 bg-red-50 border-b border-red-200">
                      <div className="flex items-center text-red-700">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <p>{orderError}</p>
                      </div>
                    </div>
                  )}
                  
                  {purchaseOrders.length === 0 && !isLoadingOrders && (
                    <div className="p-8 text-center text-gray-500">
                      <p>No hay órdenes registradas</p>
                    </div>
                  )}
                  
                  {purchaseOrders.length > 0 && (
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
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Nueva pestaña de Gestión de Cartones */}
            <TabsContent value="cards" className="space-y-6">
              <AdminCardManagement />
            </TabsContent>

            {/* Resto de pestañas existentes... */}
            <TabsContent value="players" className="space-y-6">
              {/* Contenido de jugadores existente */}
            </TabsContent>

            <TabsContent value="game" className="space-y-6">
              {/* Contenido de juego existente */}
            </TabsContent>

            <TabsContent value="winners" className="space-y-6">
              {/* Contenido de ganadores existente */}
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {/* Contenido de historial existente */}
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-6">
              <WhatsAppConfig />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  )
}
