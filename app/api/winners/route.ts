import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeTables } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    await initializeTables()

    const { gameId, playerId, cardId, winningNumbers } = await request.json()

    const result = await sql`
      INSERT INTO winners (game_id, player_id, card_id, winning_pattern, winning_numbers) 
      VALUES (${gameId}, ${playerId}, ${cardId}, 'full_card', ${JSON.stringify(winningNumbers)})
      RETURNING *
    `

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error("Error saving winner:", error)
    return NextResponse.json({ error: "Failed to save winner" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    await initializeTables()

    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("gameId")

    if (!gameId) {
      return NextResponse.json({ error: "Game ID required" }, { status: 400 })
    }

    const winners = await sql`
      SELECT w.*, p.name as player_name, p.email as player_email,
             bc.numbers as card_numbers
      FROM winners w
      JOIN players p ON w.player_id = p.id
      JOIN bingo_cards bc ON w.card_id = bc.id
      WHERE w.game_id = ${gameId}
      ORDER BY w.created_at ASC
    `

    return NextResponse.json(
      winners.rows.map((w) => ({
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
