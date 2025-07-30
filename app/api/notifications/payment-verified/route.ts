import { type NextRequest, NextResponse } from "next/server"
import { sendWhatsAppMessage, messageTemplates } from "@/lib/twilio-service"

export async function POST(request: NextRequest) {
  try {
    const { playerName, playerPhone, orderId, cartCount } = await request.json()

    if (!playerName || !playerPhone || !orderId || !cartCount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("📱 Enviando notificación de pago verificado...")

    const message = messageTemplates.paymentVerified(playerName, orderId, cartCount)
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
    console.error("💥 Error en payment-verified:", error)

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
