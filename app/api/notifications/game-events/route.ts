import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🎮 Procesando notificación de evento de juego...")

    const { type, players, number, totalCalled, winner } = await request.json()

    console.log("📊 Datos recibidos:", { type, playersCount: players?.length, number, totalCalled, winner })

    // Verificar variables de entorno
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const isMockMode = !accountSid || !authToken

    console.log("🔧 Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")
    console.log("🌍 Entorno:", process.env.NODE_ENV)

    let result

    if (isMockMode) {
      console.log(`🔸 [MOCK] Notificación de ${type} simulada`)
      result = [{ status: "fulfilled", value: { success: true, mock: true } }]
    } else {
      try {
        const twilioService = await import("@/lib/twilio")

        switch (type) {
          case "game-started":
            if (!players || !Array.isArray(players)) {
              return NextResponse.json({ error: "Players array required" }, { status: 400 })
            }
            console.log(`🚀 Enviando notificación de inicio a ${players.length} jugadores`)
            result = await twilioService.notifyGameStarted(players)
            break

          case "number-called":
            if (!players || !number || totalCalled === undefined) {
              return NextResponse.json({ error: "Players, number, and totalCalled required" }, { status: 400 })
            }
            console.log(`📢 Enviando notificación de número ${number} a ${players.length} jugadores`)
            result = await twilioService.notifyNumberCalled(players, number, totalCalled)
            break

          case "bingo-winner":
            if (!winner || !winner.name || !winner.phone || !winner.cardId) {
              return NextResponse.json({ error: "Winner details required" }, { status: 400 })
            }
            console.log(`🏆 Enviando notificación de ganador: ${winner.name}`)
            result = await twilioService.notifyBingoWinner(winner.name, winner.phone, winner.cardId)
            break

          case "game-reset":
            if (!players || !Array.isArray(players)) {
              return NextResponse.json({ error: "Players array required" }, { status: 400 })
            }
            console.log(`🔄 Enviando notificación de reinicio a ${players.length} jugadores`)
            result = await twilioService.notifyGameReset(players)
            break

          default:
            return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
        }

        console.log("📤 Resultado de notificaciones:", result)
      } catch (importError) {
        console.error("💥 Error importando servicio Twilio:", importError)
        return NextResponse.json(
          {
            error: "Failed to import Twilio service",
            details: importError instanceof Error ? importError.message : "Unknown import error",
          },
          { status: 500 },
        )
      }
    }

    console.log("✅ Notificaciones procesadas exitosamente")
    return NextResponse.json({
      success: true,
      result,
      mock: isMockMode,
      message: `${type} notifications processed`,
      environment: process.env.NODE_ENV,
    })
  } catch (error: any) {
    console.error("💥 Error en game events notification:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        environment: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}
