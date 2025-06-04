import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("❌ Procesando notificación de pago rechazado...")

    const { playerName, playerPhone, orderId, reason } = await request.json()

    if (!playerName || !playerPhone || !orderId) {
      console.error("❌ Faltan campos requeridos")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("📊 Datos recibidos:", { playerName, playerPhone, orderId, reason })

    // Verificar variables de entorno
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"
    const isMockMode = !accountSid || !authToken

    console.log("🔧 Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")
    console.log("🌍 Entorno:", process.env.NODE_ENV)
    console.log("📱 WhatsApp Number:", whatsappNumber)
    console.log("📞 Teléfono del jugador:", playerPhone)

    let result

    if (isMockMode) {
      console.log("🔸 [MOCK] Notificación de pago rechazado simulada")
      result = { success: true, messageId: "mock-id", mock: true }
    } else {
      try {
        // Importar Twilio directamente para evitar problemas de importación dinámica
        const twilio = require("twilio")
        const client = twilio(accountSid, authToken)

        // Formatear número de teléfono
        let formattedPhone = playerPhone.replace(/[\s\-()]/g, "")
        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+58" + formattedPhone.substring(1)
        }
        if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+58" + formattedPhone
        }

        console.log("📞 Número formateado:", formattedPhone)

        // Crear mensaje directamente
        const message = `
❌ *Hola ${playerName}*

Lo sentimos, pero tu pago no pudo ser verificado.

📋 *Detalles:*
• Orden: #${orderId.slice(-8)}
• Estado: ❌ RECHAZADO
${reason ? `• Motivo: ${reason}` : ""}

💬 Por favor contacta a nuestro soporte para resolver este inconveniente.

Estamos aquí para ayudarte 🤝
        `.trim()

        console.log("📤 Enviando mensaje WhatsApp...")
        console.log("📤 De:", whatsappNumber)
        console.log("📤 Para:", `whatsapp:${formattedPhone}`)

        const twilioResult = await client.messages.create({
          from: whatsappNumber,
          to: `whatsapp:${formattedPhone}`,
          body: message,
        })

        console.log("✅ Mensaje enviado:", twilioResult.sid)

        result = {
          success: true,
          messageId: twilioResult.sid,
          status: twilioResult.status,
        }
      } catch (twilioError) {
        console.error("💥 Error enviando WhatsApp:", twilioError)

        // Proporcionar información detallada del error
        result = {
          success: false,
          error: twilioError.message,
          code: twilioError.code,
          moreInfo: twilioError.moreInfo,
          status: twilioError.status,
        }
      }
    }

    if (result.success) {
      console.log("✅ Notificación procesada exitosamente")
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: result.mock || isMockMode,
        message: "WhatsApp notification processed successfully",
      })
    } else {
      console.error("❌ Error procesando notificación:", result.error)
      return NextResponse.json(
        { error: "Failed to send WhatsApp notification", details: result.error, code: result.code },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 Error en payment-rejected notification:", error)
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
