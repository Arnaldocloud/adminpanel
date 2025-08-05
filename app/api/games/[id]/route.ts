import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeTables } from "@/lib/database"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initializeTables()

    const gameId = params.id

    // Obtener información del juego
    const gameResult = await sql`SELECT * FROM games WHERE id = ${gameId}`

    if (gameResult.rows.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 })
    }

    const game = gameResult.rows[0]

    // Obtener jugadores y sus cartones
    const players = await sql`
      SELECT p.*, 
             STRING_AGG(bc.id, ',') as card_ids,
             STRING_AGG(bc.numbers, ',') as card_numbers
      FROM players p
      LEFT JOIN bingo_cards bc ON p.id = bc.player_id
      WHERE p.game_id = ${gameId}
      GROUP BY p.id
    `

    // Obtener números cantados
    const calledNumbers = await sql`
      SELECT number FROM called_numbers 
      WHERE game_id = ${gameId}
      ORDER BY called_at ASC
    `

    // Obtener ganadores
    const winners = await sql`
      SELECT w.*, p.name as player_name, p.email as player_email,
             bc.numbers as card_numbers
      FROM winners w
      JOIN players p ON w.player_id = p.id
      JOIN bingo_cards bc ON w.card_id = bc.id
      WHERE w.game_id = ${gameId}
      ORDER BY w.created_at ASC
    `

    const gameDetail = {
      game,
      players: players.rows.map((p) => ({
        ...p,
        cards: p.card_ids
          ? p.card_ids.split(",").map((id: string, index: number) => ({
              id,
              numbers: JSON.parse(p.card_numbers.split(",")[index]),
            }))
          : [],
      })),
      calledNumbers: calledNumbers.rows.map((n) => n.number),
      winners: winners.rows.map((w) => ({
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
