"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, PlusCircle, Flag, History, Hash, XCircle, Gamepad2 } from "lucide-react"
import { getActiveGames, createNewGame, finishGame, callNumber } from "@/lib/database"
import { toast } from "sonner"
import type { Game, CalledNumber } from "@/lib/types"
import { GameHistoryDetail } from "./game-history-detail"
import { QuickNotificationButton } from "./quick-notification-button"
import { Badge } from "@/components/ui/badge"

export function GameManagement() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newGameName, setNewGameName] = useState("")
  const [newGameDescription, setNewGameDescription] = useState("")
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null)
  const [numberToCall, setNumberToCall] = useState<number | string>("")
  const [calledNumbers, setCalledNumbers] = useState<CalledNumber[]>([])
  const [callingNumber, setCallingNumber] = useState(false)

  const loadGames = async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedGames = await getActiveGames()
      setGames(fetchedGames)
    } catch (err: any) {
      setError(err.message || "Failed to fetch games")
    } finally {
      setLoading(false)
    }
  }

  const loadCalledNumbers = async (gameId: string) => {
    setCallingNumber(true)
    try {
      const response = await fetch(`/api/called-numbers?gameId=${gameId}`)
      const data = await response.json()
      if (response.ok) {
        setCalledNumbers(data)
      } else {
        toast.error(data.error || "Error al cargar números llamados.")
      }
    } catch (error: any) {
      toast.error(`Error de red: ${error.message}`)
    } finally {
      setCallingNumber(false)
    }
  }

  useEffect(() => {
    loadGames()
  }, [])

  useEffect(() => {
    if (selectedGameId) {
      loadCalledNumbers(selectedGameId)
    } else {
      setCalledNumbers([])
    }
  }, [selectedGameId])

  const handleCreateGame = async () => {
    if (!newGameName) {
      toast.error("El nombre del juego es requerido.")
      return
    }
    setLoading(true)
    try {
      const { success, data, error } = await createNewGame(newGameName, newGameDescription)
      if (success && data) {
        toast.success(`Juego "${data.name}" creado exitosamente.`)
        setNewGameName("")
        setNewGameDescription("")
        loadGames()
      } else {
        toast.error(error || "Error al crear el juego.")
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleFinishGame = async (gameId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres finalizar este juego?")) {
      return
    }
    setLoading(true)
    try {
      const { success, data, error } = await finishGame(gameId)
      if (success && data) {
        toast.success(`Juego "${data.name}" finalizado.`)
        loadGames()
      } else {
        toast.error(error || "Error al finalizar el juego.")
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCallNumber = async () => {
    if (!selectedGameId || numberToCall === "" || isNaN(Number(numberToCall))) {
      toast.error("Selecciona un juego y un número válido para llamar.")
      return
    }
    setCallingNumber(true)
    try {
      const num = Number(numberToCall)
      if (num < 1 || num > 75) {
        toast.error("El número debe estar entre 1 y 75.")
        return
      }
      if (calledNumbers.some((cn) => cn.number === num)) {
        toast.warning(`El número ${num} ya ha sido llamado en este juego.`)
        return
      }

      const { success, data, error } = await callNumber(selectedGameId, num)
      if (success && data) {
        toast.success(`Número ${data.number} llamado para el juego.`)
        setNumberToCall("")
        loadCalledNumbers(selectedGameId) // Reload called numbers for the current game
        // Optionally send a game event notification
        await fetch("/api/notifications/game-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId: selectedGameId, eventType: "number_called", messageContent: data.number }),
        })
      } else {
        toast.error(error || "Error al llamar el número.")
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setCallingNumber(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Cargando juegos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <XCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Error al cargar los juegos: {error}</p>
        <Button onClick={loadGames} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <Gamepad2 className="h-5 w-5" /> Gestión de Juegos
          </CardTitle>
          <CardDescription className="text-blue-100">Crea, gestiona y finaliza tus juegos de bingo.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Crear Nuevo Juego
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Juego</DialogTitle>
                <DialogDescription>Ingresa los detalles para un nuevo juego de bingo.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gameName" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="gameName"
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                    className="col-span-3"
                    placeholder="Ej. Bingo de Verano 2024"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="gameDescription" className="text-right">
                    Descripción
                  </Label>
                  <Input
                    id="gameDescription"
                    value={newGameDescription}
                    onChange={(e) => setNewGameDescription(e.target.value)}
                    className="col-span-3"
                    placeholder="Un juego divertido para toda la familia"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGame} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Crear Juego
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <h3 className="text-xl font-semibold">Juegos Activos</h3>
          {games.length === 0 ? (
            <p className="text-muted-foreground">No hay juegos activos en este momento. ¡Crea uno!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {games.map((game) => (
                  <TableRow key={game.id}>
                    <TableCell className="font-medium">{game.name}</TableCell>
                    <TableCell className="capitalize">{game.status}</TableCell>
                    <TableCell>{new Date(game.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedGameId(game.id)}>
                            <History className="mr-2 h-4 w-4" /> Ver Historial
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Historial del Juego: {game.name}</DialogTitle>
                            <DialogDescription>
                              Revisa los números llamados y los ganadores de este juego.
                            </DialogDescription>
                          </DialogHeader>
                          <GameHistoryDetail gameId={game.id} />
                        </DialogContent>
                      </Dialog>
                      <Button onClick={() => handleFinishGame(game.id)} variant="destructive" size="sm">
                        <Flag className="mr-2 h-4 w-4" /> Finalizar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {selectedGameId && (
            <Card className="mt-6 border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" /> Llamar Número para Juego Actual
                </CardTitle>
                <CardDescription className="text-orange-100">
                  Juego seleccionado: {games.find((g) => g.id === selectedGameId)?.name || "N/A"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="Número (1-75)"
                    value={numberToCall}
                    onChange={(e) => setNumberToCall(e.target.value)}
                    min={1}
                    max={75}
                    className="flex-grow"
                  />
                  <Button onClick={handleCallNumber} disabled={callingNumber}>
                    {callingNumber ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Llamar
                  </Button>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Números Llamados Recientemente:</h4>
                  {calledNumbers.length === 0 ? (
                    <p className="text-muted-foreground">Ningún número ha sido llamado aún.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {calledNumbers.map((cn) => (
                        <Badge key={cn.id} variant="secondary" className="text-md">
                          {cn.number}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Notificaciones Rápidas del Juego:</h4>
                  <div className="flex flex-wrap gap-2">
                    <QuickNotificationButton
                      playerId="all" // Placeholder for all players in a game
                      messageType="game_event"
                      gameId={selectedGameId}
                      onSent={() => toast.info("Notificación de inicio de juego enviada.")}
                    />
                    {/* Add more specific game event notifications here */}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
