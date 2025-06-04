import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { gameId, name, email, cards } = await request.json()

    // Insertar jugador
    const playerResult = db
      .prepare(`
      INSERT INTO players (game_id, name, email, cards_count) 
      VALUES (?, ?, ?, ?)
    `)
      .run(gameId, name, email, cards.length)

    const playerId = playerResult.lastInsertRowid

    // Insertar cartones
    const insertCard = db.prepare(`
      INSERT INTO bingo_cards (id, player_id, numbers) 
      VALUES (?, ?, ?)
    `)

    for (const card of cards) {
      insertCard.run(card.id, playerId, JSON.stringify(card.numbers))
    }

    const player = db
      .prepare(`
      SELECT p.*, 
             GROUP_CONCAT(bc.id) as card_ids,
             GROUP_CONCAT(bc.numbers) as card_numbers
      FROM players p
      LEFT JOIN bingo_cards bc ON p.id = bc.player_id
      WHERE p.id = ?
      GROUP BY p.id
    `)
      .get(playerId)

    return NextResponse.json(player)
  } catch (error) {
    console.error("Error creating player:", error)
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("gameId")

    if (!gameId) {
      return NextResponse.json({ error: "Game ID required" }, { status: 400 })
    }

    const players = db
      .prepare(`
      SELECT p.*, 
             COUNT(bc.id) as actual_cards_count
      FROM players p
      LEFT JOIN bingo_cards bc ON p.id = bc.player_id
      WHERE p.game_id = ?
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `)
      .all(gameId)

    return NextResponse.json(players)
  } catch (error) {
    console.error("Error fetching players:", error)
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 })
  }
}
