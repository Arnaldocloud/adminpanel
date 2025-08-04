'use client';

import { useState, useEffect } from 'react';
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Check, X, Clock } from 'lucide-react';

interface PurchaseOrder {
  id: string;
  player_name: string;
  player_phone: string;
  player_cedula: string;
  total_amount: number;
  status: 'pending' | 'paid' | 'verified' | 'rejected';
  payment_method: string;
  created_at: string;
  reference_number?: string;
  transaction_id?: string;
  sender_phone?: string;
  sender_name?: string;
  cart_items: Array<{
    id: string;
    numbers: number[];
    price: number;
  }>;
}

export function PurchaseOrdersTable() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/admin/orders');
      if (!response.ok) {
        throw new Error('Error al cargar las órdenes');
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: 'verified' | 'rejected') => {
    try {
      setUpdating(orderId);
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el estado');
      }

      // Actualizar el estado local
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pendiente</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800">Pagado</Badge>;
      case 'verified':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Verificado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800">Rechazado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando órdenes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Órdenes de Compra</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            setRefreshing(true);
            fetchOrders();
          }}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Jugador</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Cartones</TableHead>
              <TableHead>Método de Pago</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No hay órdenes para mostrar
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.slice(0, 6)}...</TableCell>
                  <TableCell>{order.player_name}</TableCell>
                  <TableCell>{order.player_cedula}</TableCell>
                  <TableCell>{order.player_phone}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {order.cart_items.map((item) => (
                        <Badge key={item.id} variant="secondary" className="mb-1">
                          {item.numbers.join(', ')}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.payment_method === 'pago_movil' 
                      ? 'Pago Móvil' 
                      : order.payment_method === 'bank_transfer' 
                        ? 'Transferencia Bancaria' 
                        : 'Tarjeta de Crédito'}
                  </TableCell>
                  <TableCell>{order.reference_number || order.transaction_id || 'N/A'}</TableCell>
                  <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {order.status !== 'verified' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-green-600 border-green-300 hover:bg-green-50"
                          onClick={() => handleUpdateStatus(order.id, 'verified')}
                          disabled={updating === order.id}
                        >
                          {updating === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      {order.status !== 'rejected' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => handleUpdateStatus(order.id, 'rejected')}
                          disabled={updating === order.id}
                        >
                          {updating === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
