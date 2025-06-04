"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Settings, Send, CheckCircle, XCircle, Save } from "lucide-react"

interface WhatsAppConfigProps {
  onConfigChange?: (config: any) => void
}

interface NotificationConfig {
  enabled: boolean
  orderReceived: boolean
  paymentVerified: boolean
  paymentRejected: boolean
  gameStarted: boolean
  numberCalled: boolean
  bingoWinner: boolean
  gameReset: boolean
}

export default function WhatsAppConfig({ onConfigChange }: WhatsAppConfigProps) {
  const [config, setConfig] = useState<NotificationConfig>({
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [isMockMode, setIsMockMode] = useState(false)

  // Cargar configuración guardada al inicializar
  useEffect(() => {
    const savedConfig = localStorage.getItem("whatsapp-notifications-config")
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig)
        setConfig(parsedConfig)
        onConfigChange?.(parsedConfig)
      } catch (error) {
        console.error("Error loading saved config:", error)
      }
    }
  }, [onConfigChange])

  // Verificar modo de producción
  useEffect(() => {
    const checkEnvVars = async () => {
      try {
        const response = await fetch("/api/notifications/test", {
          method: "HEAD",
        })
        const mockMode = response.headers.get("x-mock-mode") === "true"
        setIsMockMode(mockMode)
      } catch (error) {
        setIsMockMode(true)
      }
    }
    checkEnvVars()
  }, [])

  const handleConfigChange = (key: string, value: boolean) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onConfigChange?.(newConfig)
  }

  const saveConfiguration = () => {
    setSaveStatus("saving")
    try {
      localStorage.setItem("whatsapp-notifications-config", JSON.stringify(config))
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch (error) {
      console.error("Error saving configuration:", error)
      setSaveStatus("idle")
    }
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

      if (response.ok) {
        setTestStatus("success")
        setTimeout(() => setTestStatus("idle"), 3000)
      } else {
        setTestStatus("error")
        alert(`Error: ${result.details || result.error}`)
        setTimeout(() => setTestStatus("idle"), 5000)
      }
    } catch (error) {
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
      description: "Cada 3 números cantados",
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
            <Badge className={`ml-2 ${isMockMode ? "bg-yellow-500" : "bg-blue-500"}`}>
              {isMockMode ? "DESARROLLO" : "PRODUCCIÓN"}
            </Badge>
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

          <div className="flex gap-3">
            <Button
              onClick={saveConfiguration}
              disabled={saveStatus === "saving"}
              className={`${
                saveStatus === "saved" ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
              } text-white font-medium rounded-lg transition-all duration-200`}
            >
              {saveStatus === "saving" && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {saveStatus === "saved" && <CheckCircle className="w-4 h-4 mr-2" />}
              {saveStatus === "idle" && <Save className="w-4 h-4 mr-2" />}
              {saveStatus === "saving" ? "Guardando..." : saveStatus === "saved" ? "Guardado" : "Guardar Configuración"}
            </Button>
          </div>
        </CardContent>
      </Card>

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
                  ¡Mensaje Enviado!
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
                  Enviar Mensaje de Prueba
                </>
              )}
            </Button>

            {testStatus === "success" && (
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  ✅ Mensaje enviado exitosamente. Revisa tu WhatsApp.
                </AlertDescription>
              </Alert>
            )}

            {testStatus === "error" && (
              <Alert className="border-red-300 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  ❌ Error al enviar el mensaje. Verifica la configuración.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
