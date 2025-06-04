import { type NextRequest, NextResponse } from "next/server"
// Importar la versión real o la simulada según el entorno
import * as twilioService from "@/lib/twilio"
import * as mockService from "@/lib/twilio-mock"

// Determinar qué servicio usar
const isMockMode = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN
const service = isMockMode ? mockService : twilioService

export async function POST(request: NextRequest) {
  try {
    const { type, players, number, totalCalled, winner } = await request.json()
    console.log("🔧 Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")

    let result

    switch (type) {
      case "game-started":
        if (!players || !Array.isArray(players)) {
          return NextResponse.json({ error: "Players array required" }, { status: 400 })
        }
        result = await service.notifyGameStarted(players)
        break

      case "number-called":
        if (!players || !number || totalCalled === undefined) {
          return NextResponse.json({ error: "Players, number, and totalCalled required" }, { status: 400 })
        }
        result = await service.notifyNumberCalled(players, number, totalCalled)
        break

      case "bingo-winner":
        if (!winner || !winner.name || !winner.phone || !winner.cardId) {
          return NextResponse.json({ error: "Winner details required" }, { status: 400 })
        }
        result = await service.notifyBingoWinner(winner.name, winner.phone, winner.cardId)
        break

      case "game-reset":
        if (!players || !Array.isArray(players)) {
          return NextResponse.json({ error: "Players array required" }, { status: 400 })
        }
        result = await service.notifyGameReset(players)
        break

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      result,
      mock: isMockMode,
      message: `${type} notifications processed`,
    })
  } catch (error) {
    console.error("Error in game events notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
