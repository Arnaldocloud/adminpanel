import { NextResponse } from "next/server"
import { isSupabaseConfigured, checkSupabaseConnection } from "@/lib/supabase"

export async function GET() {
  try {
    // Verificar si Supabase está configurado antes de intentar conectar
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        {
          success: false,
          message: "Supabase not configured",
          error: "Missing environment variables",
          timestamp: new Date().toISOString(),
          configured: false,
        },
        { status: 400 },
      )
    }

    // Verificar la conexión
    const connectionResult = await checkSupabaseConnection()

    if (!connectionResult.connected) {
      return NextResponse.json(
        {
          success: false,
          message: "Supabase connection test failed",
          error: connectionResult.error,
          timestamp: new Date().toISOString(),
          configured: true,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Supabase connection test successful",
      timestamp: new Date().toISOString(),
      configured: true,
      operations: {
        read: "OK",
        connection: "OK",
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
        configured: isSupabaseConfigured(),
      },
      { status: 500 },
    )
  }
}
