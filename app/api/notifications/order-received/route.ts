import { type NextRequest, NextResponse } from "next/server"
import { sendWhatsAppMessage, messageTemplates } from "@/lib/twilio-service"

export async function POST(request: NextRequest) {
  try {
    const { playerName, playerPhone, orderId, amount, cartCount } = await request.json()

    if (!playerName || !playerPhone || !orderId || !amount || !cartCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("📱 Enviando notificación de orden recibida...")

    const message = messageTemplates.orderReceived(playerName, orderId, amount, cartCount)
    const result = await sendWhatsAppMessage(playerPhone, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: result.mock || false,
        fallback: result.fallback || false,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 Error en order-received:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
