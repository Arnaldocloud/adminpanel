import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeTables } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    await initializeTables()

    const { gameId, number } = await request.json()

    const result = await sql`
      INSERT INTO called_numbers (game_id, number) 
      VALUES (${gameId}, ${number})
      RETURNING *
    `

    // Actualizar contador en el juego
    await sql`
      UPDATE games 
      SET total_numbers_called = (
        SELECT COUNT(*) FROM called_numbers WHERE game_id = ${gameId}
      )
      WHERE id = ${gameId}
    `

    return NextResponse.json({ success: true, id: result.rows[0].id })
  } catch (error) {
    console.error("Error saving called number:", error)
    return NextResponse.json({ error: "Failed to save called number" }, { status: 500 })
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

    const numbers = await sql`
      SELECT number FROM called_numbers 
      WHERE game_id = ${gameId}
      ORDER BY called_at ASC
    `

    return NextResponse.json(numbers.rows.map((n) => n.number))
  } catch (error) {
    console.error("Error fetching called numbers:", error)
    return NextResponse.json({ error: "Failed to fetch called numbers" }, { status: 500 })
  }
}
