import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Iniciando prueba de WhatsApp...")

    // Verificar variables de entorno
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

    console.log("🔑 Variables de entorno en producción:")
    console.log("- NODE_ENV:", process.env.NODE_ENV)
    console.log("- TWILIO_ACCOUNT_SID:", accountSid ? `${accountSid.substring(0, 10)}...` : "❌ NO DEFINIDA")
    console.log("- TWILIO_AUTH_TOKEN:", authToken ? `${authToken.substring(0, 10)}...` : "❌ NO DEFINIDA")
    console.log("- TWILIO_WHATSAPP_NUMBER:", whatsappNumber || "❌ NO DEFINIDA")

    const isMockMode = !accountSid || !authToken
    console.log("🔧 Modo detectado:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")

    const { phone, message } = await request.json()

    if (!phone || !message) {
      console.error("❌ Faltan parámetros: phone o message")
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 })
    }

    console.log("📱 Número recibido:", phone)
    console.log("💬 Mensaje:", message.substring(0, 50) + "...")

    let result

    if (isMockMode) {
      // Modo simulación
      console.log("🔸 [MOCK] Enviando mensaje WhatsApp simulado")
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const mockMessageId = "SM" + Math.random().toString(36).substring(2, 15)
      console.log("✅ [MOCK] Mensaje enviado con éxito:", mockMessageId)

      result = {
        success: true,
        messageId: mockMessageId,
        mock: true,
      }
    } else {
      // Modo producción - importar dinámicamente
      console.log("🚀 Modo producción - usando Twilio real")

      try {
        const { sendWhatsAppMessage } = await import("@/lib/twilio")
        result = await sendWhatsAppMessage({
          to: phone,
          message,
        })
        console.log("📤 Resultado de Twilio:", result)
      } catch (importError) {
        console.error("💥 Error importando Twilio:", importError)
        return NextResponse.json(
          {
            error: "Failed to import Twilio service",
            details: importError instanceof Error ? importError.message : "Unknown import error",
          },
          { status: 500 },
        )
      }
    }

    console.log("📤 Resultado final:", result)

    if (result.success) {
      console.log("✅ Mensaje enviado exitosamente:", result.messageId)
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: isMockMode,
        message: isMockMode
          ? "Test message simulated successfully (DEVELOPMENT MODE)"
          : "Test message sent successfully",
        environment: process.env.NODE_ENV,
        twilioConfigured: !isMockMode,
      })
    } else {
      console.error("❌ Error al enviar mensaje:", result.error)
      return NextResponse.json(
        {
          error: "Failed to send test message",
          details: result.error,
          twilioError: true,
          environment: process.env.NODE_ENV,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 Error crítico en test API:", error)
    console.error("Stack trace:", error.stack)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
        environment: process.env.NODE_ENV,
      },
      { status: 500 },
    )
  }
}

export async function HEAD(request: NextRequest) {
  const isMockMode = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN

  const response = new NextResponse(null, { status: 200 })
  response.headers.set("x-mock-mode", isMockMode.toString())
  response.headers.set("x-environment", process.env.NODE_ENV || "unknown")

  return response
}
