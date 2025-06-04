"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Settings, Send, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface WhatsAppConfigProps {
  onConfigChange?: (config: any) => void
}

export default function WhatsAppConfig({ onConfigChange }: WhatsAppConfigProps) {
  const [config, setConfig] = useState({
    enabled: true,
    orderReceived: true,
    paymentVerified: true,
    paymentRejected: true,
    gameStarted: false,
    numberCalled: false,
    bingoWinner: true,
    gameReset: false,
  })

  const [testPhone, setTestPhone] = useState("")
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [isMockMode, setIsMockMode] = useState(false)
  const [isCheckingEnv, setIsCheckingEnv] = useState(true)

  // Verificar si estamos en modo simulación
  useEffect(() => {
    const checkEnvVars = async () => {
      try {
        const response = await fetch("/api/notifications/test", {
          method: "HEAD",
        })

        const mockMode = response.headers.get("x-mock-mode") === "true"
        setIsMockMode(mockMode)
      } catch (error) {
        console.error("Error checking environment:", error)
        setIsMockMode(true) // Asumir modo simulación si hay error
      } finally {
        setIsCheckingEnv(false)
      }
    }

    checkEnvVars()
  }, [])

  const handleConfigChange = (key: string, value: boolean) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onConfigChange?.(newConfig)
  }

  const sendTestMessage = async () => {
    if (!testPhone) {
      alert("Por favor ingresa un número de teléfono")
      return
    }

    setTestStatus("sending")

    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: testPhone,
          message:
            "🎯 ¡Hola! Este es un mensaje de prueba del sistema de bingo. Si recibes este mensaje, las notificaciones están funcionando correctamente. ¡Gracias! 🎉",
        }),
      })

      const result = await response.json()
      console.log("📤 Respuesta del servidor:", result)

      if (response.ok) {
        setTestStatus("success")
        setTimeout(() => setTestStatus("idle"), 3000)
      } else {
        console.error("❌ Error del servidor:", result)
        setTestStatus("error")

        // Mostrar error específico al usuario
        if (result.twilioError) {
          alert(`Error de Twilio: ${result.details}`)
        } else if (result.details) {
          alert(`Error: ${result.details}`)
        } else {
          alert(`Error del servidor: ${result.error}`)
        }

        setTimeout(() => setTestStatus("idle"), 5000)
      }
    } catch (error) {
      console.error("💥 Error de red:", error)
      setTestStatus("error")
      alert("Error de conexión. Verifica tu conexión a internet.")
      setTimeout(() => setTestStatus("idle"), 3000)
    }
  }

  const notificationTypes = [
    {
      key: "orderReceived",
      label: "Orden Recibida",
      description: "Cuando un usuario envía una orden de compra",
      icon: "📋",
    },
    {
      key: "paymentVerified",
      label: "Pago Verificado",
      description: "Cuando se aprueba un pago",
      icon: "✅",
    },
    {
      key: "paymentRejected",
      label: "Pago Rechazado",
      description: "Cuando se rechaza un pago",
      icon: "❌",
    },
    {
      key: "gameStarted",
      label: "Juego Iniciado",
      description: "Cuando comienza una nueva partida",
      icon: "🚀",
    },
    {
      key: "numberCalled",
      label: "Número Cantado",
      description: "Cada 3 números cantados (para no saturar)",
      icon: "📢",
    },
    {
      key: "bingoWinner",
      label: "Ganador de Bingo",
      description: "Cuando alguien gana el bingo",
      icon: "🏆",
    },
    {
      key: "gameReset",
      label: "Juego Reiniciado",
      description: "Cuando se reinicia el juego",
      icon: "🔄",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Configuración de WhatsApp
            {isMockMode && <Badge className="ml-2 bg-yellow-500">MODO SIMULACIÓN</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-800">Notificaciones por WhatsApp</h3>
              <p className="text-gray-600 text-sm">
                Configura qué notificaciones enviar automáticamente a los usuarios
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={config.enabled} onCheckedChange={(checked) => handleConfigChange("enabled", checked)} />
              <Badge className={config.enabled ? "bg-green-500" : "bg-gray-500"}>
                {config.enabled ? "Activado" : "Desactivado"}
              </Badge>
            </div>
          </div>

          {isMockMode && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                ⚠️ <strong>Modo Simulación Activo:</strong> Las notificaciones se simularán localmente pero no se
                enviarán mensajes reales. Este modo se activa cuando las variables de entorno de Twilio no están
                configuradas en desarrollo.
              </AlertDescription>
            </Alert>
          )}

          {!config.enabled && (
            <Alert className="border-yellow-300 bg-yellow-50 mt-4">
              <AlertDescription className="text-yellow-800">
                ⚠️ Las notificaciones de WhatsApp están desactivadas. Los usuarios no recibirán mensajes automáticos.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Resto del componente igual... */}
      {/* Configuración de Tipos de Notificación */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tipos de Notificación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationTypes.map((type) => (
              <div
                key={type.key}
                className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                  config[type.key as keyof typeof config] && config.enabled
                    ? "border-green-300 bg-green-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{type.icon}</span>
                      <h4 className="font-bold text-gray-800">{type.label}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{type.description}</p>
                  </div>
                  <Switch
                    checked={config[type.key as keyof typeof config] && config.enabled}
                    onCheckedChange={(checked) => handleConfigChange(type.key, checked)}
                    disabled={!config.enabled}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prueba de Mensaje */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Prueba de Mensaje
            {isMockMode && <Badge className="ml-2 bg-yellow-500">SIMULADO</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="testPhone" className="text-gray-700 font-medium">
                Número de Teléfono de Prueba
              </Label>
              <Input
                id="testPhone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="0414-1234567 o +584141234567"
                className="border-2 border-purple-200 focus:border-purple-500 rounded-lg"
              />
              <p className="text-sm text-gray-500 mt-1">Ingresa tu número para probar las notificaciones</p>
            </div>

            <Button
              onClick={sendTestMessage}
              disabled={testStatus === "sending" || !config.enabled}
              className={`w-full font-bold rounded-lg transition-all duration-200 ${
                testStatus === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : testStatus === "error"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              }`}
            >
              {testStatus === "sending" && (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              )}
              {testStatus === "success" && (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isMockMode ? "¡Simulación Exitosa!" : "¡Mensaje Enviado!"}
                </>
              )}
              {testStatus === "error" && (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Error al Enviar
                </>
              )}
              {testStatus === "idle" && (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {isMockMode ? "Simular Mensaje de Prueba" : "Enviar Mensaje de Prueba"}
                </>
              )}
            </Button>

            {testStatus === "success" && (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  {isMockMode
                    ? "✅ Simulación exitosa. En producción, este mensaje se enviaría por WhatsApp."
                    : "✅ Mensaje enviado exitosamente. Revisa tu WhatsApp."}
                </AlertDescription>
              </Alert>
            )}

            {testStatus === "error" && (
              <Alert className="border-red-300 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  ❌ Error al enviar el mensaje. Verifica la configuración de Twilio.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información de Configuración */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-t-lg">
          <CardTitle>📋 Configuración Requerida</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            <h4 className="font-bold text-gray-800">Variables de Entorno Necesarias:</h4>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              <p>TWILIO_ACCOUNT_SID=tu_account_sid</p>
              <p>TWILIO_AUTH_TOKEN=tu_auth_token</p>
              <p>TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886</p>
            </div>
            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-800">
                💡 <strong>Nota:</strong> Necesitas una cuenta de Twilio y configurar WhatsApp Business API para usar
                esta funcionalidad.
              </AlertDescription>
            </Alert>

            {isMockMode && (
              <Alert className="border-yellow-300 bg-yellow-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  ⚠️ <strong>Modo Desarrollo:</strong> Para probar con mensajes reales en desarrollo, crea un archivo{" "}
                  <code>.env.local</code> en la raíz del proyecto con las variables de entorno de Twilio.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
