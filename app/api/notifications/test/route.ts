import { type NextRequest, NextResponse } from "next/server"

export async function HEAD(request: NextRequest) {
  // Verificar variables de entorno
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
    console.log("📱 Procesando mensaje de prueba...")

    const { phone, message } = await request.json()

    if (!phone || !message) {
      console.error("❌ Faltan campos requeridos")
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 })
    }

    console.log("📊 Datos recibidos:", { phone, messageLength: message.length })

    // Verificar variables de entorno
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER
    const isMockMode = !accountSid || !authToken

    console.log("🔧 Configuración:")
    console.log("- Account SID:", accountSid ? `${accountSid.substring(0, 6)}...` : "❌ NO DEFINIDA")
    console.log("- Auth Token:", authToken ? "✅ DEFINIDA" : "❌ NO DEFINIDA")
    console.log("- WhatsApp Number:", whatsappNumber || "❌ NO DEFINIDA")
    console.log("- Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")
    console.log("- Entorno:", process.env.NODE_ENV)
    console.log("- Región Vercel:", process.env.VERCEL_REGION)

    let result

    if (isMockMode) {
      console.log("🔸 [MOCK] Mensaje de prueba simulado")
      result = {
        success: true,
        messageId: "mock-test-" + Date.now(),
        mock: true,
        environment: process.env.NODE_ENV,
        twilioConfigured: false,
      }
    } else {
      try {
        console.log("📤 Enviando mensaje real por Twilio...")

        const { sendWhatsAppMessage } = await import("@/lib/twilio")
        result = await sendWhatsAppMessage({ to: phone, message })

        result.environment = process.env.NODE_ENV
        result.twilioConfigured = true

        console.log("📤 Resultado de Twilio:", result)
      } catch (importError: any) {
        console.error("💥 Error importando servicio Twilio:", importError)
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
      console.log("✅ Mensaje de prueba procesado exitosamente")
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: isMockMode,
        environment: process.env.NODE_ENV,
        twilioConfigured: !isMockMode,
        message: isMockMode ? "Test message simulated successfully" : "Test message sent successfully",
      })
    } else {
      console.error("❌ Error procesando mensaje:", result.error)
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
    console.error("💥 Error en test notification:", error)
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
