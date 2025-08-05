"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Upload, FileImage, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { uploadMultipleCardImages } from "@/lib/supabase-storage"
import { cardInventoryService } from "@/lib/card-inventory-service"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function CardUploadAdmin() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    success: number
    errors: Array<{ cardNumber: number; error: string }>
  } | null>(null)
  const supabase = createClientComponentClient()

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setProgress(0)
    setResults(null)

    try {
      // Subir imágenes al storage
      const uploadResults = await uploadMultipleCardImages(files)

      // Agregar cartones al inventario
      let successCount = 0
      const errors: Array<{ cardNumber: number; error: string }> = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const cardNumber = i + 1

        try {
          // Generar números aleatorios para el cartón (esto deberías reemplazarlo con los números reales)
          const numbers = generateRandomCardNumbers()
          const filename = `carton-${cardNumber.toString().padStart(4, "0")}.jpg`

          // Obtener URL de la imagen
          const {
            data: { publicUrl },
          } = supabase.storage.from("bingo-cards").getPublicUrl(filename)

          await cardInventoryService.addCardToInventory({
            cardNumber,
            numbers,
            imageUrl: publicUrl,
            filename,
          })

          successCount++
        } catch (error) {
          errors.push({
            cardNumber,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }

        setProgress(((i + 1) / files.length) * 100)
      }

      setResults({
        success: successCount,
        errors,
      })
    } catch (error) {
      console.error("Error uploading cards:", error)
      alert("Error al subir cartones")
    } finally {
      setUploading(false)
    }
  }

  // Función temporal para generar números aleatorios
  // Reemplaza esto con la lógica real para extraer números de las imágenes
  const generateRandomCardNumbers = (): number[] => {
    const numbers: number[] = []
    while (numbers.length < 24) {
      const num = Math.floor(Math.random() * 75) + 1
      if (!numbers.includes(num)) {
        numbers.push(num)
      }
    }
    return numbers.sort((a, b) => a - b)
  }

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Cartones de Bingo
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Alert className="border-blue-300 bg-blue-50">
          <FileImage className="h-4 w-4" />
          <AlertDescription className="text-blue-800">
            <strong>Instrucciones:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Selecciona hasta 2000 imágenes JPG de cartones</li>
              <li>Cada imagen debe ser de aproximadamente 75KB</li>
              <li>Los archivos se subirán en orden (carton-0001.jpg, carton-0002.jpg, etc.)</li>
              <li>El proceso puede tomar varios minutos</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cardImages" className="text-lg font-medium">
              Seleccionar Imágenes de Cartones
            </Label>
            <Input
              id="cardImages"
              type="file"
              multiple
              accept="image/jpeg,image/jpg"
              onChange={handleFileUpload}
              disabled={uploading}
              className="mt-2"
            />
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Subiendo cartones... {Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  <strong>Subida completada:</strong>
                  <ul className="mt-2">
                    <li>✅ {results.success} cartones subidos exitosamente</li>
                    {results.errors.length > 0 && <li>❌ {results.errors.length} errores</li>}
                  </ul>
                </AlertDescription>
              </Alert>

              {results.errors.length > 0 && (
                <Alert className="border-red-300 bg-red-50">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    <strong>Errores encontrados:</strong>
                    <div className="mt-2 max-h-32 overflow-y-auto">
                      {results.errors.map((error, index) => (
                        <div key={index} className="text-sm">
                          Cartón {error.cardNumber}: {error.error}
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Configuración de Supabase Storage:</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>1. Crea un bucket llamado &quot;bingo-cards&quot; en Supabase Storage</p>
            <p>2. Configura el bucket como p&uacute;blico</p>
            <p>3. Ajusta las pol&iacute;ticas RLS si es necesario</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
