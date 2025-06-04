"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, Settings, Send, CheckCircle, XCircle, AlertTriangle, Info, Bug, RefreshCw } from "lucide-react"

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
  const [environmentInfo, setEnvironmentInfo] = useState<any>(null)
  const [isCheckingEnv, setIsCheckingEnv] = useState(true)
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [showDiagnostics, setShowDiagnostics] = useState(false)

  // Verificar si estamos en modo simulación
  useEffect(() => {
    const checkEnvVars = async () => {
      try {
        console.log("🔍 Verificando configuración de entorno...")

        const response = await fetch("/api/notifications/test", {
          method: "HEAD",
        })

        const mockMode = response.headers.get("x-mock-mode") === "true"
        const environment = response.headers.get("x-environment") || "unknown"

        console.log("📊 Información de entorno:", { mockMode, environment })

        setIsMockMode(mockMode)
        setEnvironmentInfo({ environment, mockMode })
      } catch (error) {
        console.error("Error checking environment:", error)
        setIsMockMode(true)
        setEnvironmentInfo({ environment: "unknown", mockMode: true, error: true })
      } finally {
        setIsCheckingEnv(false)
      }
    }

    checkEnvVars()
  }, [])

  const runDiagnostics = async () => {
    try {
      console.log("🔍 Ejecutando diagnósticos completos...")

      const response = await fetch("/api/notifications/debug", {
        method: "GET",
      })

      const result = await response.json()
      setDiagnostics(result)
      setShowDiagnostics(true)

      console.log("📊 Diagnósticos completos:", result)
    } catch (error) {
      console.error("Error running diagnostics:", error)
      setDiagnostics({ error: "Failed to run diagnostics" })
    }
  }

  const runProductionTest = async () => {
    if (!testPhone) {
      alert("Por favor ingresa un número de teléfono")
      return
    }

    setTestStatus("sending")

    try {
      console.log("🧪 Ejecutando prueba completa de producción...")

      const response = await fetch("/api/notifications/debug", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: testPhone,
          testType: "production",
        }),
      })

      const result = await response.json()
      console.log("🧪 Resultado de prueba:", result)

      if (response.ok && result.success) {
        setTestStatus("success")
        setDiagnostics(result)
        setTimeout(() => setTestStatus("idle"), 5000)
      } else {
        setTestStatus("error")
        setDiagnostics(result)

        let errorMessage = "Error en la prueba de producción:\n\n"

        if (result.steps) {
          result.steps.forEach((step: any, index: number) => {
            errorMessage += `${step.step}. ${step.name}: ${step.success ? "✅" : "❌"}\n`
            if (!step.success && step.error) {
              errorMessage += `   Error: ${step.error}\n`
            }
          })
        } else {
          errorMessage += result.error || "Error desconocido"
        }

        alert(errorMessage)
        setTimeout(() => setTestStatus("idle"), 5000)
      }
    } catch (error) {
      console.error("💥 Error en prueba de producción:", error)
      setTestStatus("error")
      alert("Error de conexión durante la prueba")
      setTimeout(() => setTestStatus("idle"), 3000)
    }
  }

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
      console.log("📤 Enviando mensaje de prueba...")

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
        setEnvironmentInfo((prev) => ({ ...prev, ...result }))
        setTimeout(() => setTestStatus("idle"), 3000)
      } else {
        console.error("❌ Error del servidor:", result)
        setTestStatus("error")

        let errorMessage = "Error desconocido"

        if (result.twilioError) {
          errorMessage = `Error de Twilio: ${result.details}`
        } else if (result.details) {
          errorMessage = `Error: ${result.details}`
        } else {
          errorMessage = `Error del servidor: ${result.error}`
        }

        if (result.environment) {
          errorMessage += `\n\nEntorno: ${result.environment}`
        }

        alert(errorMessage)
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
            {environmentInfo?.environment && (
              <Badge className="ml-2 bg-blue-500">{environmentInfo.environment.toUpperCase()}</Badge>
            )}
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

          {/* Información de entorno */}
          {environmentInfo && (
            <Alert className="border-blue-300 bg-blue-50 mb-4">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-blue-800">
                <strong>Estado del sistema:</strong>
                <br />• Entorno: {environmentInfo.environment || "desconocido"}
                <br />• Modo: {isMockMode ? "Simulación" : "Producción"}
                <br />• Twilio configurado: {environmentInfo.twilioConfigured ? "Sí" : "No"}
                {environmentInfo.error && (
                  <>
                    <br />• ⚠️ Error detectado en la verificación
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de diagnóstico */}
          <div className="flex gap-3 mb-4">
            <Button
              onClick={runDiagnostics}
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
            >
              <Bug className="w-4 h-4 mr-2" />
              Ejecutar Diagnósticos
            </Button>

            {environmentInfo?.environment === "production" && (
              <Button
                onClick={runProductionTest}
                disabled={testStatus === "sending"}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Prueba Completa de Producción
              </Button>
            )}
          </div>

          {isMockMode && (
            <Alert className="border-yellow-300 bg-yellow-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-yellow-800">
                ⚠️ <strong>Modo Simulación Activo:</strong> Las notificaciones se simularán localmente pero no se
                enviarán mensajes reales.
                {environmentInfo?.environment === "production" && (
                  <span className="font-bold text-red-600">
                    <br />🚨 ATENCIÓN: Estás en producción pero las variables de Twilio no están configuradas.
                  </span>
                )}
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

      {/* Mostrar diagnósticos si están disponibles */}
      {showDiagnostics && diagnostics && (
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-600 to-slate-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Diagnósticos del Sistema
              <Button
                onClick={() => setShowDiagnostics(false)}
                variant="outline"
                size="sm"
                className="ml-auto text-white border-white hover:bg-white hover:text-gray-600"
              >
                Cerrar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Información del Entorno:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Entorno:</strong> {diagnostics.environment}
                  </div>
                  <div>
                    <strong>Región Vercel:</strong> {diagnostics.vercel?.region}
                  </div>
                  <div>
                    <strong>URL:</strong> {diagnostics.vercel?.url}
                  </div>
                  <div>
                    <strong>Timestamp:</strong> {new Date(diagnostics.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-bold mb-2">Configuración de Twilio:</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Account SID:</strong>{" "}
                    {diagnostics.twilio?.accountSidConfigured ? "✅ Configurado" : "❌ No configurado"}
                  </div>
                  <div>
                    <strong>Auth Token:</strong>{" "}
                    {diagnostics.twilio?.authTokenConfigured ? "✅ Configurado" : "❌ No configurado"}
                  </div>
                  <div>
                    <strong>WhatsApp Number:</strong> {diagnostics.twilio?.whatsappNumber}
                  </div>
                  <div>
                    <strong>Modo Mock:</strong> {diagnostics.twilio?.isMockMode ? "❌ Sí" : "✅ No"}
                  </div>
                </div>
              </div>

              {diagnostics.twilioTest && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Prueba de Conexión Twilio:</h4>
                  {diagnostics.twilioTest.success ? (
                    <div className="text-green-600">
                      <p>✅ Conexión exitosa</p>
                      <p>
                        <strong>Estado de cuenta:</strong> {diagnostics.twilioTest.accountStatus}
                      </p>
                      <p>
                        <strong>Tipo de cuenta:</strong> {diagnostics.twilioTest.accountType}
                      </p>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <p>❌ Error de conexión</p>
                      <p>
                        <strong>Error:</strong> {diagnostics.twilioTest.error}
                      </p>
                      <p>
                        <strong>Código:</strong> {diagnostics.twilioTest.code}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {diagnostics.steps && (
                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">Pasos de la Prueba:</h4>
                  {diagnostics.steps.map((step: any, index: number) => (
                    <div key={index} className={`p-2 mb-2 rounded ${step.success ? "bg-green-100" : "bg-red-100"}`}>
                      <div className="flex items-center gap-2">
                        <span>{step.success ? "✅" : "❌"}</span>
                        <strong>
                          {step.step}. {step.name}
                        </strong>
                      </div>
                      {step.error && <p className="text-red-600 text-sm mt-1">Error: {step.error}</p>}
                      {step.messageId && <p className="text-green-600 text-sm mt-1">Message ID: {step.messageId}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

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

            <div className="flex gap-3">
              <Button
                onClick={sendTestMessage}
                disabled={testStatus === "sending" || !config.enabled}
                className={`flex-1 font-bold rounded-lg transition-all duration-200 ${
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
                    {isMockMode ? "Simular Mensaje" : "Enviar Mensaje"}
                  </>
                )}
              </Button>

              {environmentInfo?.environment === "production" && (
                <Button
                  onClick={runProductionTest}
                  disabled={testStatus === "sending" || !testPhone}
                  variant="outline"
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Bug className="w-4 h-4 mr-2" />
                  Prueba Completa
                </Button>
              )}
            </div>

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
                  ❌ Error al enviar el mensaje. Usa el botón "Ejecutar Diagnósticos" para más información.
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
            <h4 className="font-bold text-gray-800">Variables de Entorno Necesarias en Vercel:</h4>
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
              <p>TWILIO_ACCOUNT_SID=tu_account_sid</p>
              <p>TWILIO_AUTH_TOKEN=tu_auth_token</p>
              <p>TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886</p>
            </div>

            <Alert className="border-blue-300 bg-blue-50">
              <AlertDescription className="text-blue-800">
                💡 <strong>Para configurar en Vercel:</strong>
                <br />
                1. Ve a tu proyecto en Vercel Dashboard
                <br />
                2. Settings → Environment Variables
                <br />
                3. Agrega las 3 variables de Twilio
                <br />
                4. Redeploy tu aplicación
                <br />
                5. Usa "Ejecutar Diagnósticos" para verificar
              </AlertDescription>
            </Alert>

            {environmentInfo?.environment === "production" && isMockMode && (
              <Alert className="border-red-300 bg-red-50">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  🚨 <strong>Problema en Producción:</strong> Las variables de entorno de Twilio no están configuradas
                  en Vercel. Las notificaciones no funcionarán hasta que las configures.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
