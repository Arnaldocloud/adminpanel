import { type NextRequest, NextResponse } from "next/server"
// Importar la versión real o la simulada según el entorno
import * as twilioService from "@/lib/twilio"
import * as mockService from "@/lib/twilio-mock"

// Determinar qué servicio usar
const isMockMode = !process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN
const service = isMockMode ? mockService : twilioService

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 Iniciando prueba de WhatsApp...")
    console.log("🔧 Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")

    const { phone, message } = await request.json()

    if (!phone || !message) {
      console.error("❌ Faltan parámetros: phone o message")
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 })
    }

    console.log("📱 Número recibido:", phone)
    console.log("💬 Mensaje:", message.substring(0, 50) + "...")

    // Verificar variables de entorno si no estamos en modo simulación
    if (!isMockMode) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID
      const authToken = process.env.TWILIO_AUTH_TOKEN
      const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER

      console.log("🔑 Variables de entorno:")
      console.log("- TWILIO_ACCOUNT_SID:", accountSid ? `${accountSid.substring(0, 10)}...` : "❌ NO DEFINIDA")
      console.log("- TWILIO_AUTH_TOKEN:", authToken ? `${authToken.substring(0, 10)}...` : "❌ NO DEFINIDA")
      console.log("- TWILIO_WHATSAPP_NUMBER:", whatsappNumber || "❌ NO DEFINIDA")
    }

    console.log("🚀 Enviando mensaje...")
    const result = await service.sendWhatsAppMessage({
      to: phone,
      message,
    })

    console.log("📤 Resultado del envío:", result)

    if (result.success) {
      console.log("✅ Mensaje enviado exitosamente:", result.messageId)
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: isMockMode,
        message: isMockMode
          ? "Test message simulated successfully (DEVELOPMENT MODE)"
          : "Test message sent successfully",
      })
    } else {
      console.error("❌ Error al enviar mensaje:", result.error)
      return NextResponse.json(
        {
          error: "Failed to send test message",
          details: result.error,
          twilioError: true,
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
      },
      { status: 500 },
    )
  }
}
