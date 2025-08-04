import { type NextRequest, NextResponse } from "next/server"
import { sql, initializeTables } from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await initializeTables()

    const gameId = params.id

    await sql`
      UPDATE games 
      SET status = 'finished', finished_at = CURRENT_TIMESTAMP 
      WHERE id = ${gameId}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error finishing game:", error)
    return NextResponse.json({ error: "Failed to finish game" }, { status: 500 })
  }
}
