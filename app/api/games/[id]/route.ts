import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id

    // Obtener información del juego
    const game = db.prepare("SELECT * FROM games WHERE id = ?").get(gameId)

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    // Obtener jugadores y sus cartones
    const players = db
      .prepare(`
      SELECT p.*, 
             GROUP_CONCAT(bc.id) as card_ids,
             GROUP_CONCAT(bc.numbers) as card_numbers
      FROM players p
      LEFT JOIN bingo_cards bc ON p.id = bc.player_id
      WHERE p.game_id = ?
      GROUP BY p.id
    `)
      .all(gameId)

    // Obtener números cantados
    const calledNumbers = db
      .prepare(`
      SELECT number FROM called_numbers 
      WHERE game_id = ? 
      ORDER BY called_at ASC
    `)
      .all(gameId)

    // Obtener ganadores
    const winners = db
      .prepare(`
      SELECT w.*, p.name as player_name, p.email as player_email,
             bc.numbers as card_numbers
      FROM winners w
      JOIN players p ON w.player_id = p.id
      JOIN bingo_cards bc ON w.card_id = bc.id
      WHERE w.game_id = ?
      ORDER BY w.created_at ASC
    `)
      .all(gameId)

    const gameDetail = {
      game,
      players: players.map((p) => ({
        ...p,
        cards: p.card_ids
          ? p.card_ids.split(",").map((id, index) => ({
              id,
              numbers: JSON.parse(p.card_numbers.split(",")[index]),
            }))
          : [],
      })),
      calledNumbers: calledNumbers.map((n) => n.number),
      winners: winners.map((w) => ({
        ...w,
        winning_numbers: JSON.parse(w.winning_numbers),
        card_numbers: JSON.parse(w.card_numbers),
      })),
    }

    return NextResponse.json(gameDetail)
  } catch (error) {
    console.error("Error fetching game detail:", error)
    return NextResponse.json({ error: "Failed to fetch game detail" }, { status: 500 })
  }
}
