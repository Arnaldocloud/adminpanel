import { type NextRequest, NextResponse } from "next/server"
import { sendWhatsAppMessage, checkTwilioStatus } from "@/lib/twilio-service"

export async function HEAD(request: NextRequest) {
  const status = await checkTwilioStatus()

  const headers = new Headers()
  headers.set("x-mock-mode", (!status.available).toString())
  headers.set("x-environment", process.env.NODE_ENV || "unknown")
  headers.set("x-twilio-configured", status.available.toString())

  return new NextResponse(null, { status: 200, headers })
}

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 })
    }

    console.log("📱 API Test - Enviando mensaje a:", phone)

    const result = await sendWhatsAppMessage(phone, message)

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: result.mock || false,
        fallback: result.fallback || false,
        environment: process.env.NODE_ENV,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          environment: process.env.NODE_ENV,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 Error en API test:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message,
        environment: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}
