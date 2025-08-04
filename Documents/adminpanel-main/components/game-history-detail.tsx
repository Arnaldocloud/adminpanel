"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface GameHistoryDetailProps {
  gameId: number
}

export default function GameHistoryDetail({ gameId }: GameHistoryDetailProps) {
  const [gameDetail, setGameDetail] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGameDetail = async () => {
      try {
        const response = await fetch(`/api/games/${gameId}`)
        if (response.ok) {
          const detail = await response.json()
          setGameDetail(detail)
        }
      } catch (error) {
        console.error("Error loading game detail:", error)
      } finally {
        setLoading(false)
      }
    }

    loadGameDetail()
  }, [gameId])

  if (loading) {
    return <div className="text-center py-4">Cargando...</div>
  }

  if (!gameDetail) {
    return <div className="text-center py-4">No se pudo cargar el detalle del juego</div>
  }

  return (
    <div className="space-y-6 max-h-96 overflow-y-auto">
      {/* Información del Juego */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Juego</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p>
              <strong>Estado:</strong>{" "}
              <Badge variant={gameDetail.game.status === "finished" ? "secondary" : "default"}>
                {gameDetail.game.status}
              </Badge>
            </p>
            <p>
              <strong>Inicio:</strong> {new Date(gameDetail.game.created_at).toLocaleString()}
            </p>
            {gameDetail.game.finished_at && (
              <p>
                <strong>Finalizado:</strong> {new Date(gameDetail.game.finished_at).toLocaleString()}
              </p>
            )}
          </div>
          <div>
            <p>
              <strong>Jugadores:</strong> {gameDetail.players.length}
            </p>
            <p>
              <strong>Cartones:</strong> {gameDetail.players.reduce((sum: number, p: any) => sum + p.cards.length, 0)}
            </p>
            <p>
              <strong>Números cantados:</strong> {gameDetail.calledNumbers.length}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Números Cantados */}
      <Card>
        <CardHeader>
          <CardTitle>Números Cantados ({gameDetail.calledNumbers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {gameDetail.calledNumbers.map((num: number, index: number) => (
              <div key={index} className="p-2 text-center text-sm border rounded bg-blue-100 border-blue-300 font-bold">
                {num}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ganadores */}
      {gameDetail.winners.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ganadores ({gameDetail.winners.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {gameDetail.winners.map((winner: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 bg-green-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">🏆 Ganador #{index + 1}</h4>
                    <p>
                      <strong>Nombre:</strong> {winner.player_name}
                    </p>
                    <p>
                      <strong>Email:</strong> {winner.player_email}
                    </p>
                    <p>
                      <strong>Cartón:</strong> {winner.card_id}
                    </p>
                    <p>
                      <strong>Fecha:</strong> {new Date(winner.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Cartón Ganador:</h4>
                    <div className="grid grid-cols-5 gap-1 text-xs">
                      {winner.card_numbers.map((num: number, i: number) => (
                        <div key={i} className="p-1 text-center border rounded bg-green-100 border-green-300 font-bold">
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista de Jugadores */}
      <Card>
        <CardHeader>
          <CardTitle>Jugadores Participantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {gameDetail.players.map((player: any) => (
              <div key={player.id} className="flex justify-between items-center p-2 border rounded">
                <div>
                  <span className="font-medium">{player.name}</span>
                  <span className="text-gray-500 ml-2">({player.email})</span>
                </div>
                <Badge variant="outline">{player.cards.length} cartones</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
