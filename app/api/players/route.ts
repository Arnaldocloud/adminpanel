import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeTables } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    await initializeTables()

    const { gameId, name, email, cards } = await request.json()

    // Insertar jugador
    const playerResult = await sql`
      INSERT INTO players (game_id, name, email, cards_count) 
      VALUES (${gameId}, ${name}, ${email}, ${cards.length})
      RETURNING *
    `

    const playerId = playerResult.rows[0].id

    // Insertar cartones
    for (const card of cards) {
      await sql`
        INSERT INTO bingo_cards (id, player_id, numbers) 
        VALUES (${card.id}, ${playerId}, ${JSON.stringify(card.numbers)})
      `
    }

    const player = await sql`
      SELECT p.*, 
             STRING_AGG(bc.id, ',') as card_ids,
             STRING_AGG(bc.numbers, ',') as card_numbers
      FROM players p
      LEFT JOIN bingo_cards bc ON p.id = bc.player_id
      WHERE p.id = ${playerId}
      GROUP BY p.id
    `

    return NextResponse.json(player.rows[0])
  } catch (error) {
    console.error("Error creating player:", error)
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 })
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

    const players = await sql`
      SELECT p.*, 
             COUNT(bc.id) as actual_cards_count
      FROM players p
      LEFT JOIN bingo_cards bc ON p.id = bc.player_id
      WHERE p.game_id = ${gameId}
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `

    return NextResponse.json(players.rows)
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}
