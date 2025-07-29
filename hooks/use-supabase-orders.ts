"use client"

import { useState, useEffect } from "react"
import { orderService } from "@/lib/database-functions"
import type { PurchaseOrder } from "@/lib/supabase"

export function useSupabaseOrders(cedula?: string) {
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar todas las órdenes (para admin)
  const loadAllOrders = async () => {
    try {
      setLoading(true)
      const data = await orderService.getAll()
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading orders")
    } finally {
      setLoading(false)
    }
  }

  // Cargar órdenes por cédula (para usuario)
  const loadOrdersByCedula = async (userCedula: string) => {
    try {
      setLoading(true)
      const data = await orderService.getByCedula(userCedula)
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading user orders")
    } finally {
      setLoading(false)
    }
  }

  // Crear nueva orden
  const createOrder = async (orderData: Omit<PurchaseOrder, "id" | "created_at" | "updated_at">) => {
    try {
      setLoading(true)
      const newOrder = await orderService.create(orderData)
      setOrders((prev) => [newOrder, ...prev])
      return newOrder
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating order")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Actualizar estado de orden
  const updateOrderStatus = async (orderId: string, status: PurchaseOrder["status"]) => {
    try {
      setLoading(true)
      const updatedOrder = await orderService.updateStatus(orderId, status)
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updatedOrder : order)))
      return updatedOrder
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating order status")
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Obtener orden por ID
  const getOrderById = async (orderId: string) => {
    try {
      const order = await orderService.getById(orderId)
      return order
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error getting order")
      throw err
    }
  }

  // Cargar órdenes automáticamente
  useEffect(() => {
    if (cedula) {
      loadOrdersByCedula(cedula)
    } else {
      loadAllOrders()
    }
  }, [cedula])

  // Recargar órdenes cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (cedula) {
        loadOrdersByCedula(cedula)
      } else {
        loadAllOrders()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [cedula])

  return {
    // Estado
    orders,
    loading,
    error,

    // Acciones
    loadAllOrders,
    loadOrdersByCedula,
    createOrder,
    updateOrderStatus,
    getOrderById,

    // Utilidades
    clearError: () => setError(null),
    refreshOrders: cedula ? () => loadOrdersByCedula(cedula) : loadAllOrders,
  }
}
