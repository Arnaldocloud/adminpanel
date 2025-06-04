import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { gameId, number } = await request.json()

    const result = db
      .prepare(`
      INSERT INTO called_numbers (game_id, number) 
      VALUES (?, ?)
    `)
      .run(gameId, number)

    // Actualizar contador en el juego
    db.prepare(`
      UPDATE games 
      SET total_numbers_called = (
        SELECT COUNT(*) FROM called_numbers WHERE game_id = ?
      )
      WHERE id = ?
    `).run(gameId, gameId)

    return NextResponse.json({ success: true, id: result.lastInsertRowid })
  } catch (error) {
    console.error("Error saving called number:", error)
    return NextResponse.json({ error: "Failed to save called number" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get("gameId")

    if (!gameId) {
      return NextResponse.json({ error: "Game ID required" }, { status: 400 })
    }

    const numbers = db
      .prepare(`
      SELECT number FROM called_numbers 
      WHERE game_id = ? 
      ORDER BY called_at ASC
    `)
      .all(gameId)

    return NextResponse.json(numbers.map((n) => n.number))
  } catch (error) {
    console.error("Error fetching called numbers:", error)
    return NextResponse.json({ error: "Failed to fetch called numbers" }, { status: 500 })
  }
}
