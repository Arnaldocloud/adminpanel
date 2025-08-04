"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, ShoppingCart, XCircle, Eye } from "lucide-react"
import { getAllOrders, updatePurchaseOrderStatus } from "@/lib/database"
import { toast } from "sonner"
import type { PurchaseOrder, Player } from "@/lib/types"
import { QuickVerifyButton } from "./quick-verify-button"
import { QuickNotificationButton } from "./quick-notification-button"
import Image from "next/image"

interface OrderWithPlayer extends PurchaseOrder {
  players: Player | null // Assuming 'players' is the related table name in Supabase join
}

export function OrderManagement() {
  const [orders, setOrders] = useState<OrderWithPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedOrders = (await getAllOrders()) as OrderWithPlayer[]
      setOrders(fetchedOrders)
    } catch (err: any) {
      setError(err.message || "Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleUpdateStatus = async (orderId: string, status: PurchaseOrder["status"]) => {
    setLoading(true)
    try {
      const { success, data, error } = await updatePurchaseOrderStatus(orderId, status)
      if (success && data) {
        toast.success(`Estado de la orden ${data.id.substring(0, 8)}... actualizado a ${data.status}.`)
        loadOrders() // Reload orders to reflect changes
      } else {
        toast.error(error || "Error al actualizar el estado de la orden.")
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Cargando órdenes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <XCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Error al cargar las órdenes: {error}</p>
        <Button onClick={loadOrders} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" /> Gestión de Órdenes
          </CardTitle>
          <CardDescription className="text-pink-100">
            Revisa y gestiona las órdenes de compra de cartones.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {orders.length === 0 ? (
            <p className="text-muted-foreground">No hay órdenes de compra registradas aún.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Orden</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Cartones</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                    <TableCell>{order.players?.name || "N/A"}</TableCell>
                    <TableCell>${order.amount}</TableCell>
                    <TableCell>{order.card_ids?.length || 0}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          order.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : order.status === "verified"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {order.payment_proof_url && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="mr-2 h-4 w-4" /> Ver Comprobante
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                              <DialogTitle>Comprobante de Pago</DialogTitle>
                              <DialogDescription>
                                Comprobante de pago para la orden #{order.id.substring(0, 8)}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="relative w-full h-[400px]">
                              <Image
                                src={order.payment_proof_url || "/placeholder.svg"}
                                alt="Comprobante de Pago"
                                layout="fill"
                                objectFit="contain"
                                className="rounded-md"
                              />
                            </div>
                            <DialogFooter>
                              <Button onClick={() => window.open(order.payment_proof_url!, "_blank")}>
                                Abrir en Nueva Pestaña
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      {order.status === "pending" && (
                        <>
                          <QuickVerifyButton orderId={order.id} onVerified={loadOrders} />
                          <Button
                            onClick={() => handleUpdateStatus(order.id, "rejected")}
                            variant="destructive"
                            size="sm"
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Rechazar
                          </Button>
                        </>
                      )}
                      {order.players?.id && (
                        <>
                          <QuickNotificationButton
                            playerId={order.players.id}
                            messageType="order_received"
                            onSent={() => toast.info(`Notificación de orden recibida enviada a ${order.players?.name}`)}
                          />
                          {order.status === "verified" && (
                            <QuickNotificationButton
                              playerId={order.players.id}
                              messageType="payment_verified"
                              onSent={() =>
                                toast.info(`Notificación de pago verificado enviada a ${order.players?.name}`)
                              }
                            />
                          )}
                          {order.status === "rejected" && (
                            <QuickNotificationButton
                              playerId={order.players.id}
                              messageType="payment_rejected"
                              onSent={() =>
                                toast.info(`Notificación de pago rechazado enviada a ${order.players?.name}`)
                              }
                            />
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
