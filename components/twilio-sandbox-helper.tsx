"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, MessageCircle, AlertTriangle, Users, Info } from "lucide-react"

export default function TwilioSandboxHelper() {
  const [sandboxNumber, setSandboxNumber] = useState("+1 415 523 8886") // Número por defecto
  const [joinCode, setJoinCode] = useState("join <código>")
  const [registeredNumbers, setRegisteredNumbers] = useState<string[]>([])
  const [testPhone, setTestPhone] = useState("")

  // Cargar números registrados del localStorage
  useEffect(() => {
    const saved = localStorage.getItem("twilioSandboxNumbers")
    if (saved) {
      setRegisteredNumbers(JSON.parse(saved))
    }
  }, [])

  const addRegisteredNumber = () => {
    if (testPhone && !registeredNumbers.includes(testPhone)) {
      const updated = [...registeredNumbers, testPhone]
      setRegisteredNumbers(updated)
      localStorage.setItem("twilioSandboxNumbers", JSON.stringify(updated))
      setTestPhone("")
    }
  }

  const removeRegisteredNumber = (phone: string) => {
    const updated = registeredNumbers.filter((p) => p !== phone)
    setRegisteredNumbers(updated)
    localStorage.setItem("twilioSandboxNumbers", JSON.stringify(updated))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("¡Copiado al portapapeles!")
  }

  return (
    <div className="space-y-6">
      {/* Información del Sandbox */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Configuración WhatsApp Sandbox (Gratis)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <Alert className="border-yellow-300 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-yellow-800">
              <strong>Limitaciones de la capa gratuita:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Solo puedes enviar mensajes a números registrados en el Sandbox</li>
                <li>Los usuarios deben enviar un código específico para registrarse</li>
                <li>Límite de mensajes por mes (generalmente 1000)</li>
                <li>Solo funciona con el número de Sandbox de Twilio</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-bold text-gray-800">📱 Número del Sandbox:</h4>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-blue-200">
                <span className="font-mono text-lg">{sandboxNumber}</span>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(sandboxNumber)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-gray-800">🔑 Código de Registro:</h4>
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-green-200">
                <span className="font-mono text-lg">join bingo-admin</span>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard("join bingo-admin")}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <Alert className="border-blue-300 bg-blue-50">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              <strong>Instrucciones para los usuarios:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>
                  Agregar el número <strong>{sandboxNumber}</strong> a WhatsApp
                </li>
                <li>
                  Enviar el mensaje: <strong>"join bingo-admin"</strong>
                </li>
                <li>Esperar confirmación de Twilio</li>
                <li>¡Ya pueden recibir notificaciones del bingo!</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Gestión de números registrados */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Números Registrados en Sandbox ({registeredNumbers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="newPhone" className="text-gray-700 font-medium">
                Agregar número registrado:
              </Label>
              <Input
                id="newPhone"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+58414-1234567"
                className="border-2 border-green-200 focus:border-green-500"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={addRegisteredNumber} className="bg-green-600 hover:bg-green-700">
                Agregar
              </Button>
            </div>
          </div>

          {registeredNumbers.length > 0 ? (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Números que pueden recibir mensajes:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {registeredNumbers.map((phone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span className="font-mono text-sm">{phone}</span>
                    <div className="flex gap-2">
                      <Badge className="bg-green-500 text-white">✓ Activo</Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeRegisteredNumber(phone)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Alert className="border-gray-300 bg-gray-50">
              <AlertDescription className="text-gray-700">
                No hay números registrados aún. Agrega los números que han completado el proceso de registro en el
                Sandbox.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Instrucciones para compartir */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
          <CardTitle>📋 Instrucciones para Compartir con Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-bold mb-3">📱 Cómo recibir notificaciones del Bingo por WhatsApp:</h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Paso 1:</strong> Agrega este número a tus contactos: <strong>{sandboxNumber}</strong>
              </p>
              <p>
                <strong>Paso 2:</strong> Envía el mensaje: <strong>"join bingo-admin"</strong>
              </p>
              <p>
                <strong>Paso 3:</strong> Espera la confirmación de Twilio
              </p>
              <p>
                <strong>Paso 4:</strong> ¡Listo! Recibirás notificaciones automáticas sobre tu compra y el juego
              </p>
            </div>
            <Button
              onClick={() =>
                copyToClipboard(`📱 Para recibir notificaciones del Bingo:
1. Agrega: ${sandboxNumber}
2. Envía: "join bingo-admin"
3. Espera confirmación
4. ¡Listo para jugar!`)
              }
              className="mt-3 bg-purple-600 hover:bg-purple-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Instrucciones
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
