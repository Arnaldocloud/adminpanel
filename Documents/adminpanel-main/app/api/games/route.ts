import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeTables } from "@/lib/database"

export async function GET() {
  try {
    // Inicializar tablas si es necesario
    await initializeTables()

    const games = await sql`
      SELECT 
        g.*,
        COUNT(DISTINCT p.id) as players_count,
        COUNT(DISTINCT bc.id) as total_cards,
        COUNT(DISTINCT w.id) as winners_count
      FROM games g
      LEFT JOIN players p ON g.id = p.game_id
      LEFT JOIN bingo_cards bc ON p.id = bc.player_id
      LEFT JOIN winners w ON g.id = w.game_id
      GROUP BY g.id
      ORDER BY g.created_at DESC
    `

    return NextResponse.json(games.rows)
  } catch (error) {
    console.error("Error fetching games:", error)
    return NextResponse.json({ error: "Failed to fetch games" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeTables()

    const { name } = await request.json()

    const result = await sql`
      INSERT INTO games (name, status) 
      VALUES (${name}, 'active')
      RETURNING *
    `

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Error creating game:", error)
    return NextResponse.json({ error: "Failed to create game" }, { status: 500 })
  }
}
