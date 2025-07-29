import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET() {
  try {
    // Probar conexión básica
    const { data: games, error: gamesError } = await supabase.from("games").select("count").limit(1)

    if (gamesError) {
      throw gamesError
    }

    // Probar inserción y eliminación
    const testGame = {
      name: `Test Game ${Date.now()}`,
      status: "active" as const,
    }

    const { data: insertedGame, error: insertError } = await supabase.from("games").insert(testGame).select().single()

    if (insertError) {
      throw insertError
    }

    // Eliminar el juego de prueba
    const { error: deleteError } = await supabase.from("games").delete().eq("id", insertedGame.id)

    if (deleteError) {
      throw deleteError
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection test successful",
      timestamp: new Date().toISOString(),
      operations: {
        read: "OK",
        write: "OK",
        delete: "OK",
      },
    })
  } catch (error) {
    console.error("Supabase test error:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Supabase connection test failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
