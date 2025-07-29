"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function SupabaseStatus() {
  const [status, setStatus] = useState<"checking" | "connected" | "error">("checking")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      setStatus("checking")

      // Intentar una consulta simple para verificar la conexión
      const { data, error } = await supabase.from("games").select("count").limit(1)

      if (error) {
        throw error
      }

      setStatus("connected")
      setError(null)
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "Error de conexión desconocido")
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

  if (status === "error") {
    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="text-red-800">
          <div className="space-y-2">
            <p>
              <strong>Error de conexión con Supabase:</strong>
            </p>
            <p className="text-sm">{error}</p>
            <p className="text-xs">
              Verifica que las variables de entorno NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY estén
              configuradas correctamente.
            </p>
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
