"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, CheckCircle, XCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface QuickNotificationButtonProps {
  playerName: string
  playerPhone: string
  orderId: string
  size?: "sm" | "default" | "lg"
}

export default function QuickNotificationButton({
  playerName,
  playerPhone,
  orderId,
  size = "sm",
}: QuickNotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customMessage, setCustomMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [lastResult, setLastResult] = useState<"success" | "error" | null>(null)

  // Mensajes predefinidos para notificación rápida
  const quickMessages = {
    verified: `🎉 ¡Excelente ${playerName}!

✅ Tu pago ha sido verificado exitosamente.

🎯 Ya puedes participar en el bingo con tus cartones.

¡Que tengas suerte! 🍀`,

    reminder: `👋 Hola ${playerName}

📋 Te recordamos que tu orden #${orderId.slice(-8)} está pendiente de verificación.

💳 Si ya realizaste el pago, por favor espera mientras verificamos la transacción.

¡Gracias por tu paciencia! 🙏`,

    instructions: `📱 Hola ${playerName}

ℹ️ Para completar tu compra de cartones de bingo:

1️⃣ Realiza el pago según el método seleccionado
2️⃣ Envía el comprobante o referencia
3️⃣ Espera la verificación (máximo 30 minutos)

¿Necesitas ayuda? ¡Contáctanos! 🤝`,
  }

  const sendQuickMessage = async (messageType: keyof typeof quickMessages) => {
    setSending(true)
    setLastResult(null)

    try {
      // Verificar si el número está registrado en sandbox (solo mostrar advertencia)
      const registeredNumbers = JSON.parse(localStorage.getItem("twilioSandboxNumbers") || "[]")
      const isRegistered = registeredNumbers.includes(playerPhone)

      if (!isRegistered && registeredNumbers.length > 0) {
        const shouldContinue = confirm(
          `⚠️ El número ${playerPhone} no está en la lista de números registrados en el Sandbox.\n\n¿Continuar enviando el mensaje?`,
        )
        if (!shouldContinue) {
          setSending(false)
          return
        }
      }

      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: playerPhone,
          message: quickMessages[messageType],
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLastResult("success")

        // Si el envío fue exitoso y no estaba registrado, agregarlo
        if (!isRegistered) {
          const updated = [...registeredNumbers, playerPhone]
          localStorage.setItem("twilioSandboxNumbers", JSON.stringify(updated))
        }

        setTimeout(() => setLastResult(null), 3000)
      } else {
        setLastResult("error")
        console.error("Error:", result.error)
        alert(`Error al enviar mensaje: ${result.error || "Error desconocido"}`)
      }
    } catch (error) {
      setLastResult("error")
      console.error("Error enviando mensaje:", error)
      alert("Error de conexión al enviar el mensaje")
    } finally {
      setSending(false)
    }
  }

  const sendCustomMessage = async () => {
    if (!customMessage.trim()) return

    setSending(true)
    setLastResult(null)

    try {
      // Verificar registro en sandbox
      const registeredNumbers = JSON.parse(localStorage.getItem("twilioSandboxNumbers") || "[]")
      const isRegistered = registeredNumbers.includes(playerPhone)

      if (!isRegistered && registeredNumbers.length > 0) {
        const shouldContinue = confirm(
          `⚠️ El número ${playerPhone} no está registrado en el Sandbox.\n\n¿Continuar enviando el mensaje?`,
        )
        if (!shouldContinue) {
          setSending(false)
          return
        }
      }

      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: playerPhone,
          message: customMessage,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setLastResult("success")
        setCustomMessage("")

        // Si el envío fue exitoso y no estaba registrado, agregarlo
        if (!isRegistered) {
          const updated = [...registeredNumbers, playerPhone]
          localStorage.setItem("twilioSandboxNumbers", JSON.stringify(updated))
        }

        setTimeout(() => {
          setLastResult(null)
          setIsOpen(false)
        }, 2000)
      } else {
        setLastResult("error")
        console.error("Error:", result.error)
        alert(`Error al enviar mensaje: ${result.error || "Error desconocido"}`)
      }
    } catch (error) {
      setLastResult("error")
      console.error("Error enviando mensaje:", error)
      alert("Error de conexión al enviar el mensaje")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={`border-green-300 text-green-600 hover:bg-green-50 bg-transparent ${
            lastResult === "success" ? "border-green-500 bg-green-50" : ""
          } ${lastResult === "error" ? "border-red-500 bg-red-50" : ""}`}
        >
          {lastResult === "success" && <CheckCircle className="w-4 h-4 mr-1 text-green-600" />}
          {lastResult === "error" && <XCircle className="w-4 h-4 mr-1 text-red-600" />}
          {!lastResult && <MessageCircle className="w-4 h-4 mr-1" />}
          {lastResult === "success" ? "Enviado" : lastResult === "error" ? "Error" : "WhatsApp"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Notificar a {playerName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p>
              <strong>Teléfono:</strong> {playerPhone}
            </p>
            <p>
              <strong>Orden:</strong> #{orderId.slice(-8)}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Mensajes Rápidos:</h4>

            <Button
              onClick={() => sendQuickMessage("verified")}
              disabled={sending}
              className="w-full justify-start bg-green-600 hover:bg-green-700 text-white"
            >
              {sending ? "Enviando..." : "✅ Pago Verificado"}
            </Button>

            <Button
              onClick={() => sendQuickMessage("reminder")}
              disabled={sending}
              variant="outline"
              className="w-full justify-start border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              {sending ? "Enviando..." : "⏰ Recordatorio de Pago"}
            </Button>

            <Button
              onClick={() => sendQuickMessage("instructions")}
              disabled={sending}
              variant="outline"
              className="w-full justify-start border-purple-300 text-purple-600 hover:bg-purple-50"
            >
              {sending ? "Enviando..." : "📋 Instrucciones de Pago"}
            </Button>
          </div>

          <div className="space-y-3">
            <Label htmlFor="customMessage" className="font-medium text-gray-800">
              Mensaje Personalizado:
            </Label>
            <Textarea
              id="customMessage"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Escribe un mensaje personalizado..."
              rows={3}
              className="border-2 border-gray-200 focus:border-green-500"
            />
            <Button
              onClick={sendCustomMessage}
              disabled={sending || !customMessage.trim()}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {sending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                  Enviando...
                </div>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensaje
                </>
              )}
            </Button>
          </div>

          {lastResult === "success" && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                ¡Mensaje enviado exitosamente!
              </p>
            </div>
          )}

          {lastResult === "error" && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Error al enviar el mensaje. Verifica la configuración.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
