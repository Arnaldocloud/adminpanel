import { type NextRequest, NextResponse } from "next/server"
import db from "@/lib/database"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const gameId = params.id

    db.prepare(`
      UPDATE games 
      SET status = 'finished', finished_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(gameId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error finishing game:", error)
    return NextResponse.json({ error: "Failed to finish game" }, { status: 500 })
  }
}
