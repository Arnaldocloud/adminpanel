import { type NextRequest, NextResponse } from "next/server"

export async function HEAD(request: NextRequest) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const isMockMode = !accountSid || !authToken

  const headers = new Headers()
  headers.set("x-mock-mode", isMockMode.toString())
  headers.set("x-environment", process.env.NODE_ENV || "unknown")
  headers.set("x-twilio-configured", (!isMockMode).toString())

  return new NextResponse(null, { status: 200, headers })
}

export async function POST(request: NextRequest) {
  try {
    const { phone, message } = await request.json()

    if (!phone || !message) {
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 })
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER
    const isMockMode = !accountSid || !authToken

    let result

    if (isMockMode) {
      result = {
        success: true,
        messageId: "mock-test-" + Date.now(),
        mock: true,
        environment: process.env.NODE_ENV,
        twilioConfigured: false,
      }
    } else {
      try {
        const { sendWhatsAppMessage } = await import("@/lib/twilio")
        result = await sendWhatsAppMessage({ to: phone, message })

        result.environment = process.env.NODE_ENV
        result.twilioConfigured = true
      } catch (importError: any) {
        return NextResponse.json(
          {
            error: "Failed to import Twilio service",
            details: importError.message,
            twilioError: true,
            environment: process.env.NODE_ENV,
          },
          { status: 500 },
        )
      }
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: isMockMode,
        environment: process.env.NODE_ENV,
        twilioConfigured: !isMockMode,
      })
    } else {
      return NextResponse.json(
        {
          error: "Failed to send test message",
          details: result.error,
          code: result.code,
          twilioError: true,
          environment: process.env.NODE_ENV,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
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
