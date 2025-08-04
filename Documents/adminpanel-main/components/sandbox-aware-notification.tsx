"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, MessageCircle, AlertTriangle, Loader2 } from "lucide-react"

interface SandboxAwareNotificationProps {
  playerName: string
  playerPhone: string
  orderId: string
  cartCount: number
  onSuccess?: () => void
}

export default function SandboxAwareNotification({
  playerName,
  playerPhone,
  cartCount,
  onSuccess,
}: SandboxAwareNotificationProps) {
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<"success" | "error" | "warning" | null>(null)
  const [message, setMessage] = useState("")

  const sendNotification = async () => {
    setSending(true)
    setResult(null)

    try {
      // Verificar si el número está en la lista de registrados
      const registeredNumbers = JSON.parse(localStorage.getItem("twilioSandboxNumbers") || "[]")
      const isRegistered = registeredNumbers.includes(playerPhone)

      if (!isRegistered) {
        setResult("warning")
        setMessage(`El número ${playerPhone} no está registrado en el Sandbox. El mensaje podría fallar.`)
        setSending(false)
        return
      }

      // Enviar notificación
      const response = await fetch("/api/notifications/payment-verified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName,
          playerPhone,
          orderId: `order-${Date.now()}`,
          cartCount,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setResult("success")
        setMessage(`✅ Notificación enviada exitosamente a ${playerName}`)
        onSuccess?.()
      } else {
        setResult("error")
        setMessage(`❌ Error: ${data.error || "No se pudo enviar el mensaje"}`)
      }
    } catch (error) {
      setResult("error")
      setMessage("❌ Error de conexión al enviar la notificación")
    } finally {
      setSending(false)
      setTimeout(() => setResult(null), 5000)
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={sendNotification}
        disabled={sending}
        size="sm"
        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
      >
        {sending ? (
          <>
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <MessageCircle className="w-4 h-4 mr-1" />
            Notificar WhatsApp
          </>
        )}
      </Button>

      {result === "success" && (
        <Alert className="border-green-300 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-800 text-sm">{message}</AlertDescription>
        </Alert>
      )}

      {result === "warning" && (
        <Alert className="border-yellow-300 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-yellow-800 text-sm">
            {message}
            <br />
            <strong>Solución:</strong> Pide al usuario que envíe "join bingo-admin" al número de Twilio.
          </AlertDescription>
        </Alert>
      )}

      {result === "error" && (
        <Alert className="border-red-300 bg-red-50">
          <AlertDescription className="text-red-800 text-sm">{message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
