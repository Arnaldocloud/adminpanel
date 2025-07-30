"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"

interface QuickVerifyButtonProps {
  orderId: string
  playerName: string
  playerPhone: string
  cartCount: number
  onVerified: (orderId: string) => void
}

export default function QuickVerifyButton({
  orderId,
  playerName,
  playerPhone,
  cartCount,
  onVerified,
}: QuickVerifyButtonProps) {
  const [isVerifying, setIsVerifying] = useState(false)

  const quickVerify = async () => {
    setIsVerifying(true)

    try {
      // 1. Actualizar estado en localStorage
      const orders = JSON.parse(localStorage.getItem("bingoOrders") || "[]")
      const updatedOrders = orders.map((order: any) =>
        order.id === orderId ? { ...order, status: "verified" } : order,
      )
      localStorage.setItem("bingoOrders", JSON.stringify(updatedOrders))

      // 2. Enviar notificación WhatsApp inmediatamente
      const notificationResponse = await fetch("/api/notifications/payment-verified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName,
          playerPhone,
          orderId,
          cartCount,
        }),
      })

      const notificationResult = await notificationResponse.json()

      // 3. Actualizar UI
      onVerified(orderId)

      // 4. Mostrar resultado
      if (notificationResponse.ok && notificationResult.success) {
        alert(`✅ ¡Pago verificado y ${playerName} notificado por WhatsApp!`)
      } else {
        alert(`✅ Pago verificado. ⚠️ Problema con WhatsApp: ${notificationResult.error}`)
      }
    } catch (error) {
      console.error("Error en verificación rápida:", error)
      alert("❌ Error al verificar el pago. Intenta de nuevo.")
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <Button
      onClick={quickVerify}
      disabled={isVerifying}
      size="sm"
      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium"
    >
      {isVerifying ? (
        <>
          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          Verificando...
        </>
      ) : (
        <>
          <CheckCircle className="w-4 h-4 mr-1" />
          Verificar + Notificar
        </>
      )}
    </Button>
  )
}
