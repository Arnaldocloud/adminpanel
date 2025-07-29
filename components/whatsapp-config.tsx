"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { CheckCircle, MessageCircle, Send, Settings, XCircle } from "lucide-react"

/**
 * Props ­– emit the current config upward if needed
 */
interface WhatsAppConfigProps {
  onConfigChange?: (cfg: Record<string, boolean>) => void
}

/**
 * Initial toggle state
 */
const defaultConfig = {
  enabled: true,
  orderReceived: true,
  paymentVerified: true,
  paymentRejected: true,
  gameStarted: false,
  numberCalled: false,
  bingoWinner: true,
  gameReset: false,
} as const

type ConfigKey = keyof typeof defaultConfig

/**
 * Helper — maps every toggle to a friendly label & emoji
 */
const notificationMeta: Record<ConfigKey, { label: string; description: string; icon: string }> = {
  enabled: {
    label: "Notificaciones",
    description: "Master switch",
    icon: "💬",
  },
  orderReceived: {
    label: "Orden recibida",
    description: "Cuando un usuario envía una orden",
    icon: "📋",
  },
  paymentVerified: {
    label: "Pago verificado",
    description: "Pago aprobado por el admin",
    icon: "✅",
  },
  paymentRejected: {
    label: "Pago rechazado",
    description: "Pago marcado como inválido",
    icon: "❌",
  },
  gameStarted: {
    label: "Juego iniciado",
    description: "Comienzo del bingo",
    icon: "🚀",
  },
  numberCalled: {
    label: "Número cantado",
    description: "Cada 3 números anuncia un resumen",
    icon: "📢",
  },
  bingoWinner: {
    label: "Ganador",
    description: "Se notifica el bingo",
    icon: "🏆",
  },
  gameReset: {
    label: "Juego reiniciado",
    description: "Nuevo juego comienza",
    icon: "🔄",
  },
}

export default function WhatsAppConfig({ onConfigChange }: WhatsAppConfigProps) {
  /* ------------------------------------------------------------------ */
  /*  State                                                             */
  /* ------------------------------------------------------------------ */
  const [config, setConfig] = useState<Record<ConfigKey, boolean>>(defaultConfig)
  const [testPhone, setTestPhone] = useState("")
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [isMockMode, setIsMockMode] = useState<boolean>(false)
  const [envInfo, setEnvInfo] = useState<{ environment: string } | null>(null)

  /* ------------------------------------------------------------------ */
  /*  Effects – detect env / mock mode                                  */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/notifications/test", { method: "HEAD" })
        setIsMockMode(res.headers.get("x-mock-mode") === "true")
        setEnvInfo({ environment: res.headers.get("x-environment") || "unknown" })
      } catch {
        setIsMockMode(true)
        setEnvInfo({ environment: "unknown" })
      }
    }
    check()
  }, [])

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                           */
  /* ------------------------------------------------------------------ */
  function updateConfig(key: ConfigKey, value: boolean) {
    if (key === "enabled") {
      // master switch: turn all off/on except itself
      const newCfg = Object.fromEntries(
        (Object.keys(config) as ConfigKey[]).map((k) => [k, k === "enabled" ? value : value && config[k]]),
      ) as Record<ConfigKey, boolean>
      setConfig(newCfg)
      onConfigChange?.(newCfg)
      return
    }

    const next = { ...config, [key]: value }
    setConfig(next)
    onConfigChange?.(next)
  }

  async function sendTest() {
    if (!testPhone) {
      alert("Ingresa un número de teléfono primero")
      return
    }
    setTestStatus("sending")
    try {
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: testPhone,
          message: "🧪 Mensaje de prueba del panel de bingo. Si lees esto, todo funciona.",
        }),
      })
      if (res.ok) {
        setTestStatus("success")
      } else {
        setTestStatus("error")
      }
    } catch {
      setTestStatus("error")
    } finally {
      setTimeout(() => setTestStatus("idle"), 3500)
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */
  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-green-50 to-teal-50">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Configuración de WhatsApp
            {isMockMode && <Badge className="ml-2 bg-yellow-500">MODO SIMULACIÓN</Badge>}
            {envInfo && <Badge className="ml-2 bg-blue-500">{envInfo.environment.toUpperCase()}</Badge>}
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
              <Switch checked={config.enabled} onCheckedChange={(checked) => updateConfig("enabled", checked)} />
              <Badge className={config.enabled ? "bg-green-500" : "bg-gray-500"}>
                {config.enabled ? "Activado" : "Desactivado"}
              </Badge>
            </div>
          </div>

          {isMockMode ? (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertDescription className="text-yellow-800">
                ⚠️ Estás en modo simulación. No se enviarán mensajes reales porque las credenciales de Twilio no están
                configuradas.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-green-300 bg-green-50">
              <AlertDescription className="text-green-800">
                ✅ Twilio configurado. Los mensajes se enviarán a los usuarios.
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

      {/* Toggles */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Tipos de notificación
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(notificationMeta) as ConfigKey[]).map((key) => {
            if (key === "enabled") return null // omit master switch here
            const meta = notificationMeta[key]
            return (
              <div
                key={key}
                className={`flex items-start justify-between p-4 border-2 rounded-xl ${
                  config[key] && config.enabled ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50"
                }`}
              >
                <div>
                  <p className="font-bold">
                    {meta.icon} {meta.label}
                  </p>
                  <p className="text-sm text-gray-600">{meta.description}</p>
                </div>

                <Switch
                  checked={config[key] && config.enabled}
                  onCheckedChange={(v) => updateConfig(key, v)}
                  disabled={!config.enabled}
                />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Test message */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Prueba de mensaje
            {isMockMode && <Badge className="ml-2 bg-yellow-500">SIMULADO</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="phone" className="font-medium text-gray-700">
              Número de teléfono
            </Label>
            <Input
              id="phone"
              placeholder="+584141234567"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="border-2 border-purple-200 focus:border-purple-500"
            />
            <p className="text-sm text-gray-500 mt-1">Ingresa tu número para probar las notificaciones</p>
          </div>
          <Button
            onClick={sendTest}
            disabled={testStatus === "sending" || !config.enabled}
            className={`w-full flex gap-2 justify-center items-center ${
              testStatus === "error"
                ? "bg-red-600 hover:bg-red-700"
                : testStatus === "success"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            }`}
          >
            {testStatus === "sending" && <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />}
            {testStatus === "idle" && <Send className="h-4 w-4" />}
            {testStatus === "success" && <CheckCircle className="h-4 w-4" />}
            {testStatus === "error" && <XCircle className="h-4 w-4" />}
            {testStatus === "idle" && (isMockMode ? "Simular mensaje" : "Enviar mensaje")}
            {testStatus === "sending" && "Enviando..."}
            {testStatus === "success" && (isMockMode ? "¡Simulación Exitosa!" : "¡Mensaje Enviado!")}
            {testStatus === "error" && "Error al Enviar"}
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
                ❌ Error al enviar el mensaje. Verifica el número de teléfono y la configuración.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Configuration info */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-t-lg">
          <CardTitle>📋 Configuración Requerida</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Variables de Entorno Necesarias:</h4>
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                <p>TWILIO_ACCOUNT_SID=tu_account_sid</p>
                <p>TWILIO_AUTH_TOKEN=tu_auth_token</p>
                <p>TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-gray-800 mb-2">Instrucciones:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Crea una cuenta en Twilio.com</li>
                <li>Configura WhatsApp Sandbox en la consola de Twilio</li>
                <li>Agrega las variables de entorno en Vercel</li>
                <li>Redeploya la aplicación</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
