import { type NextRequest, NextResponse } from "next/server"
// Importar la versión real o la simulada según el entorno
import * as twilioService from "@/lib/twilio"
import * as mockService from "@/lib/twilio-mock"

// Determinar qué servicio usar
const isMockMode = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN
const service = isMockMode ? mockService : twilioService

export async function POST(request: NextRequest) {
  try {
    const { playerName, playerPhone, orderId, cartCount } = await request.json()

    if (!playerName || !playerPhone || !orderId || !cartCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("🔧 Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")
    const result = await service.notifyPaymentVerified(playerName, playerPhone, orderId, cartCount)

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: isMockMode,
        message: "Payment verified notification sent successfully",
      })
    } else {
      return NextResponse.json(
        { error: "Failed to send WhatsApp notification", details: result.error },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in payment-verified notification:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
