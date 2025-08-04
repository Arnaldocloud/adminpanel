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
import { Loader2, PlusCircle, User, Edit, Trash2, XCircle } from "lucide-react"
import { getAllPlayers, registerPlayer, updatePlayer } from "@/lib/database" // Assuming updatePlayer exists
import { toast } from "sonner"
import type { Player } from "@/lib/types"
import { QuickNotificationButton } from "./quick-notification-button"

export function PlayerManagement() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newPlayerName, setNewPlayerName] = useState("")
  const [newPlayerPhone, setNewPlayerPhone] = useState("")
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)

  const loadPlayers = async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedPlayers = await getAllPlayers()
      setPlayers(fetchedPlayers)
    } catch (err: any) {
      setError(err.message || "Failed to fetch players")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlayers()
  }, [])

  const handleRegisterPlayer = async () => {
    if (!newPlayerName || !newPlayerPhone) {
      toast.error("Nombre y número de teléfono son requeridos.")
      return
    }
    setLoading(true)
    try {
      const { success, data, error } = await registerPlayer(newPlayerName, newPlayerPhone)
      if (success && data) {
        toast.success(`Jugador "${data.name}" registrado exitosamente.`)
        setNewPlayerName("")
        setNewPlayerPhone("")
        loadPlayers()
      } else {
        toast.error(error || "Error al registrar el jugador.")
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return
    setLoading(true)
    try {
      const { success, data, error } = await updatePlayer(editingPlayer.id, {
        name: editingPlayer.name,
        phone_number: editingPlayer.phone_number,
      })
      if (success && data) {
        toast.success(`Jugador "${data.name}" actualizado exitosamente.`)
        setEditingPlayer(null)
        loadPlayers()
      } else {
        toast.error(error || "Error al actualizar el jugador.")
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Placeholder for delete player function (not implemented in lib/database.ts yet)
  const handleDeletePlayer = async (playerId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este jugador?")) {
      return
    }
    toast.info("Funcionalidad de eliminar jugador no implementada aún.")
    // Implement actual deletion logic using admin client if needed
    // try {
    //   const supabase = getSupabaseAdminClient();
    //   const { error } = await supabase.from('players').delete().eq('id', playerId);
    //   if (error) throw error;
    //   toast.success("Jugador eliminado exitosamente.");
    //   loadPlayers();
    // } catch (err: any) {
    //   toast.error(`Error al eliminar jugador: ${err.message}`);
    // }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-lg">Cargando jugadores...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <XCircle className="h-8 w-8 mx-auto mb-2" />
        <p>Error al cargar los jugadores: {error}</p>
        <Button onClick={loadPlayers} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Gestión de Jugadores
          </CardTitle>
          <CardDescription className="text-green-100">
            Registra y administra a los participantes de tus juegos de bingo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Nuevo Jugador
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Registrar Nuevo Jugador</DialogTitle>
                <DialogDescription>Ingresa los detalles del nuevo jugador.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="playerName" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="playerName"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    className="col-span-3"
                    placeholder="Nombre del jugador"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="playerPhone" className="text-right">
                    Teléfono (WhatsApp)
                  </Label>
                  <Input
                    id="playerPhone"
                    type="tel"
                    value={newPlayerPhone}
                    onChange={(e) => setNewPlayerPhone(e.target.value)}
                    className="col-span-3"
                    placeholder="+1234567890"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleRegisterPlayer} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Registrar Jugador
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <h3 className="text-xl font-semibold">Lista de Jugadores</h3>
          {players.length === 0 ? (
            <p className="text-muted-foreground">No hay jugadores registrados aún. ¡Registra uno!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {players.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{player.phone_number}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingPlayer(player)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Editar Jugador</DialogTitle>
                            <DialogDescription>Modifica los detalles del jugador.</DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="editPlayerName" className="text-right">
                                Nombre
                              </Label>
                              <Input
                                id="editPlayerName"
                                value={editingPlayer?.name || ""}
                                onChange={(e) =>
                                  setEditingPlayer((prev) => (prev ? { ...prev, name: e.target.value } : null))
                                }
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="editPlayerPhone" className="text-right">
                                Teléfono
                              </Label>
                              <Input
                                id="editPlayerPhone"
                                type="tel"
                                value={editingPlayer?.phone_number || ""}
                                onChange={(e) =>
                                  setEditingPlayer((prev) => (prev ? { ...prev, phone_number: e.target.value } : null))
                                }
                                className="col-span-3"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleUpdatePlayer} disabled={loading}>
                              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                              Guardar Cambios
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <Button onClick={() => handleDeletePlayer(player.id)} variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                      </Button>
                      <QuickNotificationButton
                        playerId={player.id}
                        messageType="game_event"
                        onSent={() => toast.info(`Notificación de evento de juego enviada a ${player.name}`)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
