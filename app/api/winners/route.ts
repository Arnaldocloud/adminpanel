import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { gameId, playerId, cardId, winningNumbers } = await request.json()

    const result = db
      .prepare(`
      INSERT INTO winners (game_id, player_id, card_id, winning_pattern, winning_numbers) 
      VALUES (?, ?, ?, 'full_card', ?)
    `)
      .run(gameId, playerId, cardId, JSON.stringify(winningNumbers))

    return NextResponse.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error("Error saving winner:", error)
    return NextResponse.json({ error: "Failed to save winner" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("gameId")

    if (!gameId) {
      return NextResponse.json({ error: "Game ID required" }, { status: 400 })
    }

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

    return NextResponse.json(
      winners.map((w) => ({
        ...w,
        winning_numbers: JSON.parse(w.winning_numbers),
        card_numbers: JSON.parse(w.card_numbers),
      })),
    )
  } catch (error) {
    console.error("Error fetching winners:", error)
    return NextResponse.json({ error: "Failed to fetch winners" }, { status: 500 })
  }
}
