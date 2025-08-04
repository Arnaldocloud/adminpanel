"use client"

import { useState, useEffect } from "react"
import { checkSupabaseConnection } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"

export default function SupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error" | "missing-env">("checking")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      setStatus("checking")

      const result = await checkSupabaseConnection()

      if (!result.connected) {
        if (result.error?.includes("environment variables")) {
          setStatus("missing-env")
          setMessage(result.message || "Missing Supabase environment variables")
        } else {
          setStatus("error")
          setError(result.error || "Unknown error")
          setMessage(result.message || "Failed to connect to Supabase")
        }
        return
      }

      setStatus("connected")
      setError(null)
      setMessage(result.message || "Successfully connected to Supabase")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Unknown error")
      setMessage("Error checking Supabase connection")
    }
  }

  if (status === "checking") {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertDescription className="text-blue-800">Verificando conexión con Supabase...</AlertDescription>
      </Alert>
    )
  }

  if (status === "missing-env") {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="space-y-2">
            <p>
              <strong>Configuración de Supabase incompleta:</strong>
            </p>
            <p className="text-sm">{message}</p>
            <p className="text-xs">
              Para conectar con Supabase, necesitas configurar las siguientes variables de entorno en Vercel:
            </p>
            <div className="bg-yellow-100 p-2 rounded text-xs font-mono">
              <p>NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co</p>
              <p>NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima</p>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (status === "error") {
    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p>
              <strong>Error de conexión con Supabase:</strong>
            </p>
            <p className="text-sm">{message}</p>
            <p className="text-xs">{error}</p>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-green-200 bg-green-50">
      <CheckCircle className="h-4 w-4" />
      <AlertDescription className="text-green-800 flex items-center gap-2">
        <span>Conectado a Supabase</span>
        <Badge className="bg-green-500 text-white">✓ Activo</Badge>
      </AlertDescription>
    </Alert>
  )
}
