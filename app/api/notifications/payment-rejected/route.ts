import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { playerName, playerPhone, orderId, reason } = await request.json()

    if (!playerName || !playerPhone || !orderId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"
    const isMockMode = !accountSid || !authToken

    let result

    if (isMockMode) {
      result = { success: true, messageId: "mock-id", mock: true }
    } else {
      try {
        const twilio = require("twilio")
        const client = twilio(accountSid, authToken)

        let formattedPhone = playerPhone.replace(/[\s\-()]/g, "")
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+58" + formattedPhone.substring(1)
        }
        if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+58" + formattedPhone
        }

        const message = `❌ *Hola ${playerName}*

Lo sentimos, pero tu pago no pudo ser verificado.

📋 *Detalles:*
• Orden: #${orderId.slice(-8)}
• Estado: ❌ RECHAZADO
${reason ? `• Motivo: ${reason}` : ""}

💬 Por favor contacta a nuestro soporte para resolver este inconveniente.

Estamos aquí para ayudarte 🤝`

        const twilioResult = await client.messages.create({
          from: whatsappNumber,
          to: `whatsapp:${formattedPhone}`,
          body: message,
        })

        result = {
          success: true,
          messageId: twilioResult.sid,
          status: twilioResult.status,
        }
      } catch (twilioError) {
        result = {
          success: false,
          error: twilioError.message,
          code: twilioError.code,
        }
      }
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: result.mock || isMockMode,
      })
    } else {
      return NextResponse.json(
        { error: "Failed to send WhatsApp notification", details: result.error, code: result.code },
        { status: 500 },
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
