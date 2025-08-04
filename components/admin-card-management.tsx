"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  FileImage,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  Package,
  Eye,
  Trash2,
  RefreshCw,
} from "lucide-react"
import { cardInventoryService } from "@/lib/card-inventory-service"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function AdminCardManagement() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    reserved: 0,
    sold: 0,
  })
  const [bulkCardData, setBulkCardData] = useState("")
  const [uploadResults, setUploadResults] = useState<{
    success: number
    errors: Array<{ cardNumber: number; error: string }>
  } | null>(null)

  const supabase = createClientComponentClient()

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const inventoryStats = await cardInventoryService.getInventoryStats()
      setStats(inventoryStats)
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  // Subir imágenes individuales
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setProgress(0)
    setUploadResults(null)

    const results = {
      success: 0,
      errors: [] as Array<{ cardNumber: number; error: string }>,
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const cardNumber = i + 1

        try {
          // Generar nombre de archivo
          const filename = `carton-${cardNumber.toString().padStart(4, "0")}.jpg`

          // Subir imagen a Supabase Storage
          const { data, error } = await supabase.storage.from("bingo-cards").upload(filename, file, {
            cacheControl: "3600",
            upsert: true,
          })

          if (error) throw error

          // Obtener URL pública
          const {
            data: { publicUrl },
          } = supabase.storage.from("bingo-cards").getPublicUrl(filename)

          // Por ahora, generar números aleatorios
          // TODO: Reemplazar con extracción real de números de la imagen
          const numbers = generateRandomCardNumbers()

          // Agregar al inventario
          await cardInventoryService.addCardToInventory({
            cardNumber,
            numbers,
            imageUrl: publicUrl,
            filename,
          })

          results.success++
        } catch (error) {
          results.errors.push({
            cardNumber,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }

        setProgress(((i + 1) / files.length) * 100)
      }

      setUploadResults(results)
      await loadStats()
    } catch (error) {
      console.error("Error uploading cards:", error)
      alert("Error al subir cartones")
    } finally {
      setUploading(false)
    }
  }

  // Procesar datos masivos de cartones
  const processBulkCardData = async () => {
    if (!bulkCardData.trim()) {
      alert("Por favor ingresa los datos de los cartones")
      return
    }

    setUploading(true)
    setProgress(0)
    setUploadResults(null)

    const lines = bulkCardData.trim().split("\n")
    const results = {
      success: 0,
      errors: [] as Array<{ cardNumber: number; error: string }>,
    }

    try {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        try {
          // Formato esperado: cardNumber,num1,num2,num3,...,num24
          const parts = line.split(",").map((p) => p.trim())
          const cardNumber = Number.parseInt(parts[0])
          const numbers = parts.slice(1).map((n) => Number.parseInt(n))

          if (isNaN(cardNumber) || numbers.length !== 24) {
            throw new Error("Formato inválido. Se esperan 24 números.")
          }

          // Verificar que todos los números sean válidos
          if (numbers.some((n) => isNaN(n) || n < 1 || n > 75)) {
            throw new Error("Números inválidos. Deben estar entre 1 y 75.")
          }

          // Generar URL de imagen (asumiendo que ya existe)
          const filename = `carton-${cardNumber.toString().padStart(4, "0")}.jpg`
          const {
            data: { publicUrl },
          } = supabase.storage.from("bingo-cards").getPublicUrl(filename)

          // Agregar al inventario
          await cardInventoryService.addCardToInventory({
            cardNumber,
            numbers,
            imageUrl: publicUrl,
            filename,
          })

          results.success++
        } catch (error) {
          results.errors.push({
            cardNumber: i + 1,
            error: error instanceof Error ? error.message : "Unknown error",
          })
        }

        setProgress(((i + 1) / lines.length) * 100)
      }

      setUploadResults(results)
      setBulkCardData("")
      await loadStats()
    } catch (error) {
      console.error("Error processing bulk data:", error)
      alert("Error al procesar datos masivos")
    } finally {
      setUploading(false)
    }
  }

  // Liberar todas las reservas expiradas
  const releaseExpiredReservations = async () => {
    try {
      await supabase.rpc("release_expired_reservations")
      await loadStats()
      alert("Reservas expiradas liberadas exitosamente")
    } catch (error) {
      console.error("Error releasing reservations:", error)
      alert("Error al liberar reservas")
    }
  }

  // Generar números aleatorios (temporal)
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

  useEffect(() => {
    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Total Cartones</CardTitle>
            <Package className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-blue-100 text-xs">En el inventario</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Disponibles</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.available}</div>
            <p className="text-green-100 text-xs">Listos para venta</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-500 to-orange-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-100">Reservados</CardTitle>
            <Loader2 className="h-4 w-4 text-yellow-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.reserved}</div>
            <p className="text-yellow-100 text-xs">En proceso de compra</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Vendidos</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sold}</div>
            <p className="text-purple-100 text-xs">Cartones vendidos</p>
          </CardContent>
        </Card>
      </div>

      {/* Gestión de Cartones */}
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gestión de Cartones
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={loadStats} className="bg-white/20 hover:bg-white/30">
                <RefreshCw className="h-4 w-4 mr-1" />
                Actualizar
              </Button>
              <Button size="sm" onClick={releaseExpiredReservations} className="bg-white/20 hover:bg-white/30">
                <Trash2 className="h-4 w-4 mr-1" />
                Liberar Reservas
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Subir Imágenes</TabsTrigger>
              <TabsTrigger value="bulk">Datos Masivos</TabsTrigger>
              <TabsTrigger value="manage">Gestionar</TabsTrigger>
            </TabsList>

            {/* Subir Imágenes */}
            <TabsContent value="upload" className="p-6 space-y-6">
              <Alert className="border-blue-300 bg-blue-50">
                <FileImage className="h-4 w-4" />
                <AlertDescription className="text-blue-800">
                  <strong>Instrucciones para subir imágenes:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Selecciona hasta 2000 imágenes JPG de cartones</li>
                    <li>Cada imagen debe ser de aproximadamente 75KB</li>
                    <li>Los archivos se procesarán en orden (carton-0001.jpg, carton-0002.jpg, etc.)</li>
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
              </div>
            </TabsContent>

            {/* Datos Masivos */}
            <TabsContent value="bulk" className="p-6 space-y-6">
              <Alert className="border-green-300 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800">
                  <strong>Formato para datos masivos:</strong>
                  <div className="mt-2 bg-green-100 p-2 rounded font-mono text-sm">
                    cardNumber,num1,num2,num3,...,num24
                    <br />
                    1,5,12,18,23,27,31,38,42,47,52,56,61,67,72,3,9,15,21,29,34,40,45,51
                    <br />
                    2,1,8,14,19,25,33,39,44,49,54,58,63,69,74,7,11,16,22,28,35,41,46,50
                  </div>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="bulkData" className="text-lg font-medium">
                    Datos de Cartones (CSV)
                  </Label>
                  <Textarea
                    id="bulkData"
                    value={bulkCardData}
                    onChange={(e) => setBulkCardData(e.target.value)}
                    placeholder="Pega aquí los datos de los cartones en formato CSV..."
                    rows={10}
                    className="mt-2 font-mono text-sm"
                  />
                </div>

                <Button
                  onClick={processBulkCardData}
                  disabled={uploading || !bulkCardData.trim()}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Procesando... {Math.round(progress)}%
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Procesar Datos Masivos
                    </>
                  )}
                </Button>

                {uploading && <Progress value={progress} className="w-full" />}
              </div>
            </TabsContent>

            {/* Gestionar */}
            <TabsContent value="manage" className="p-6">
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Gestión Avanzada</h3>
                <p className="text-gray-600 mb-4">Funciones adicionales para gestionar el inventario de cartones</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Inventario
                  </Button>
                  <Button variant="outline">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Reportes
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Resultados de Subida */}
      {uploadResults && (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResults.success > 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Resultados de la Subida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                <strong>Subida completada:</strong>
                <ul className="mt-2">
                  <li>✅ {uploadResults.success} cartones procesados exitosamente</li>
                  {uploadResults.errors.length > 0 && <li>❌ {uploadResults.errors.length} errores encontrados</li>}
                </ul>
              </AlertDescription>
            </Alert>

            {uploadResults.errors.length > 0 && (
              <Alert className="border-red-300 bg-red-50">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">
                  <strong>Errores encontrados:</strong>
                  <div className="mt-2 max-h-32 overflow-y-auto">
                    {uploadResults.errors.slice(0, 10).map((error, index) => (
                      <div key={index} className="text-sm">
                        Cartón {error.cardNumber}: {error.error}
                      </div>
                    ))}
                    {uploadResults.errors.length > 10 && (
                      <div className="text-sm font-medium">... y {uploadResults.errors.length - 10} errores más</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
