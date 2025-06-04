import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    console.log("📋 === INICIANDO NOTIFICACIÓN DE ORDEN RECIBIDA ===")

    const body = await request.json()
    console.log("📊 Body completo recibido:", JSON.stringify(body, null, 2))

    const { playerName, playerPhone, orderId, amount, cartCount } = body

    // Validación detallada
    const missingFields = []
    if (!playerName) missingFields.push("playerName")
    if (!playerPhone) missingFields.push("playerPhone")
    if (!orderId) missingFields.push("orderId")
    if (!amount) missingFields.push("amount")
    if (!cartCount) missingFields.push("cartCount")

    if (missingFields.length > 0) {
      console.error("❌ Campos faltantes:", missingFields)
      return NextResponse.json(
        {
          error: "Missing required fields",
          missingFields,
          received: body,
        },
        { status: 400 },
      )
    }

    console.log("✅ Todos los campos están presentes")
    console.log("📊 Datos validados:", { playerName, playerPhone, orderId, amount, cartCount })

    // Verificar variables de entorno
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"
    const isMockMode = !accountSid || !authToken

    console.log("🔧 Configuración:")
    console.log("- Account SID:", accountSid ? `${accountSid.substring(0, 6)}...` : "❌ NO DEFINIDA")
    console.log("- Auth Token:", authToken ? "✅ DEFINIDA" : "❌ NO DEFINIDA")
    console.log("- WhatsApp Number:", whatsappNumber)
    console.log("- Modo:", isMockMode ? "SIMULACIÓN" : "PRODUCCIÓN")
    console.log("- Entorno:", process.env.NODE_ENV)

    let result

    if (isMockMode) {
      console.log("🔸 [MOCK] Ejecutando en modo simulación")
      result = {
        success: true,
        messageId: `mock-order-${Date.now()}`,
        mock: true,
        timestamp: new Date().toISOString(),
      }
      console.log("🔸 [MOCK] Resultado simulado:", result)
    } else {
      try {
        console.log("📦 Importando Twilio...")

        // Usar require en lugar de import dinámico
        const twilio = require("twilio")
        console.log("✅ Twilio importado correctamente")

        console.log("🔧 Inicializando cliente Twilio...")
        const client = twilio(accountSid, authToken)
        console.log("✅ Cliente Twilio inicializado")

        // Formatear número de teléfono con logs detallados
        console.log("📞 Número original:", playerPhone)
        let formattedPhone = playerPhone.replace(/[\s\-()]/g, "")
        console.log("📞 Después de limpiar:", formattedPhone)

        if (formattedPhone.startsWith("0")) {
          formattedPhone = "+58" + formattedPhone.substring(1)
          console.log("📞 Agregado código Venezuela:", formattedPhone)
        }
        if (!formattedPhone.startsWith("+")) {
          formattedPhone = "+58" + formattedPhone
          console.log("📞 Agregado código internacional:", formattedPhone)
        }

        console.log("📞 Número final formateado:", formattedPhone)

        // Crear mensaje
        const message = `🎯 *¡Hola ${playerName}!*

✅ Hemos recibido tu orden de compra de cartones de bingo.

📋 *Detalles de tu orden:*
• ID: #${orderId.slice(-8)}
• Cartones: ${cartCount}
• Total: $${amount} USD

⏳ Tu pago está siendo verificado por nuestro equipo. Te notificaremos cuando esté listo.

¡Gracias por participar en nuestro bingo! 🎉`

        console.log("📝 Mensaje creado:")
        console.log("📝 Longitud:", message.length)
        console.log("📝 Primeros 100 caracteres:", message.substring(0, 100))

        console.log("📤 Preparando envío...")
        console.log("📤 De:", whatsappNumber)
        console.log("📤 Para:", `whatsapp:${formattedPhone}`)

        const messageOptions = {
          from: whatsappNumber,
          to: `whatsapp:${formattedPhone}`,
          body: message,
        }

        console.log("📤 Opciones del mensaje:", JSON.stringify(messageOptions, null, 2))

        console.log("🚀 Enviando mensaje...")
        const twilioResult = await client.messages.create(messageOptions)

        console.log("✅ Mensaje enviado exitosamente!")
        console.log("📋 SID:", twilioResult.sid)
        console.log("📋 Status:", twilioResult.status)
        console.log("📋 Resultado completo:", JSON.stringify(twilioResult, null, 2))

        result = {
          success: true,
          messageId: twilioResult.sid,
          status: twilioResult.status,
          to: `whatsapp:${formattedPhone}`,
          from: whatsappNumber,
          timestamp: new Date().toISOString(),
        }
      } catch (twilioError) {
        console.error("💥 ERROR DETALLADO DE TWILIO:")
        console.error("- Mensaje:", twilioError.message)
        console.error("- Código:", twilioError.code)
        console.error("- Status:", twilioError.status)
        console.error("- Más info:", twilioError.moreInfo)
        console.error("- Stack:", twilioError.stack)

        result = {
          success: false,
          error: twilioError.message,
          code: twilioError.code,
          moreInfo: twilioError.moreInfo,
          status: twilioError.status,
          timestamp: new Date().toISOString(),
        }
      }
    }

    console.log("📋 === RESULTADO FINAL ===")
    console.log(JSON.stringify(result, null, 2))

    if (result.success) {
      console.log("✅ NOTIFICACIÓN PROCESADA EXITOSAMENTE")
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        mock: result.mock || isMockMode,
        message: "WhatsApp notification processed successfully",
        timestamp: result.timestamp,
        details: result,
      })
    } else {
      console.error("❌ ERROR PROCESANDO NOTIFICACIÓN")
      return NextResponse.json(
        {
          error: "Failed to send WhatsApp notification",
          details: result.error,
          code: result.code,
          moreInfo: result.moreInfo,
          timestamp: result.timestamp,
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("💥 ERROR CRÍTICO EN NOTIFICACIÓN:")
    console.error("- Mensaje:", error.message)
    console.error("- Stack:", error.stack)
    console.error("- Nombre:", error.name)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        name: error.name,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
