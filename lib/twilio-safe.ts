// Versión más segura de la librería Twilio
let twilioClient: any = null
let twilioInitialized = false
let twilioError: string | null = null

// Función para inicializar Twilio de forma segura
async function initializeTwilio() {
  if (twilioInitialized) {
    return { success: !!twilioClient, error: twilioError }
  }

  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
      twilioError = "Missing Twilio credentials"
      twilioInitialized = true
      return { success: false, error: twilioError }
    }

    console.log("🔧 Inicializando Twilio de forma segura...")

    // Importación más robusta
    let twilioModule
    try {
      twilioModule = await import("twilio")
    } catch (importError: any) {
      twilioError = `Failed to import Twilio: ${importError.message}`
      twilioInitialized = true
      return { success: false, error: twilioError }
    }

    // Verificar que el módulo se importó correctamente
    if (!twilioModule || typeof twilioModule.default !== "function") {
      twilioError = "Twilio module not properly imported"
      twilioInitialized = true
      return { success: false, error: twilioError }
    }

    // Inicializar cliente
    try {
      const Twilio = twilioModule.default
      twilioClient = new Twilio(accountSid, authToken)
      twilioInitialized = true
      console.log("✅ Twilio inicializado exitosamente")
      return { success: true, error: null }
    } catch (clientError: any) {
      twilioError = `Failed to initialize Twilio client: ${clientError.message}`
      twilioInitialized = true
      return { success: false, error: twilioError }
    }
  } catch (error: any) {
    twilioError = `Unexpected error: ${error.message}`
    twilioInitialized = true
    return { success: false, error: twilioError }
  }
}

export interface WhatsAppMessage {
  to: string
  message: string
  mediaUrl?: string
}

// Función segura para enviar mensaje de WhatsApp
export async function sendWhatsAppMessageSafe({ to, message, mediaUrl }: WhatsAppMessage) {
  try {
    console.log("📱 Preparando envío seguro de WhatsApp...")

    // Inicializar Twilio si no está inicializado
    const initResult = await initializeTwilio()
    if (!initResult.success) {
      console.error("❌ Error inicializando Twilio:", initResult.error)
      return {
        success: false,
        error: initResult.error,
        mock: true,
      }
    }

    if (!twilioClient) {
      return {
        success: false,
        error: "Twilio client not available",
        mock: true,
      }
    }

    // Formatear número de teléfono
    const formattedNumber = formatPhoneNumberSafe(to)
    console.log("📞 Número formateado:", formattedNumber)

    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"

    const messageOptions: any = {
      from: whatsappNumber,
      to: `whatsapp:${formattedNumber}`,
      body: message,
    }

    // Agregar media si se proporciona
    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl]
    }

    console.log("📤 Enviando mensaje...")

    const result = await twilioClient.messages.create(messageOptions)

    console.log("✅ Mensaje enviado exitosamente:", result.sid)

    return {
      success: true,
      messageId: result.sid,
      status: result.status,
      mock: false,
    }
  } catch (error: any) {
    console.error("💥 Error enviando mensaje:", error)

    // Proporcionar errores más específicos
    let userFriendlyError = error.message

    if (error.code === 21211) {
      userFriendlyError = "Número de teléfono inválido. Verifica el formato."
    } else if (error.code === 21408) {
      userFriendlyError = "No tienes permisos para enviar a este número. Agrega el número a tu Sandbox de Twilio."
    } else if (error.code === 21614) {
      userFriendlyError = "El número no puede recibir mensajes de WhatsApp."
    } else if (error.code === 20003) {
      userFriendlyError = "Credenciales de Twilio inválidas."
    }

    return {
      success: false,
      error: userFriendlyError,
      code: error.code,
      details: error.moreInfo,
      mock: false,
    }
  }
}

// Formatear número de teléfono de forma segura
function formatPhoneNumberSafe(phone: string): string {
  try {
    console.log("🔄 Formateando número:", phone)

    // Remover espacios, guiones y paréntesis
    let cleaned = phone.replace(/[\s\-()]/g, "")
    console.log("🧹 Número limpio:", cleaned)

    // Si empieza con 0, reemplazar por +58
    if (cleaned.startsWith("0")) {
      cleaned = "+58" + cleaned.substring(1)
      console.log("🇻🇪 Agregado código Venezuela:", cleaned)
    }

    // Si no tiene código de país, agregar +58
    if (!cleaned.startsWith("+")) {
      cleaned = "+58" + cleaned
      console.log("🌍 Agregado código de país:", cleaned)
    }

    console.log("✅ Número final:", cleaned)
    return cleaned
  } catch (error) {
    console.error("❌ Error formateando número:", error)
    return phone // Devolver el original si hay error
  }
}

// Función para verificar el estado de Twilio
export async function checkTwilioStatus() {
  const initResult = await initializeTwilio()
  return {
    initialized: twilioInitialized,
    available: !!twilioClient,
    error: twilioError,
    ...initResult,
  }
}

// Exportar funciones de notificación usando la versión segura
export async function notifyOrderReceivedSafe(
  playerName: string,
  playerPhone: string,
  orderId: string,
  amount: number,
  cartCount: number,
) {
  const message = `🎯 *¡Hola ${playerName}!*

✅ Hemos recibido tu orden de compra de cartones de bingo.

📋 *Detalles de tu orden:*
• ID: #${orderId.slice(-8)}
• Cartones: ${cartCount}
• Total: $${amount} USD

⏳ Tu pago está siendo verificado por nuestro equipo. Te notificaremos cuando esté listo.

¡Gracias por participar en nuestro bingo! 🎉`

  return await sendWhatsAppMessageSafe({
    to: playerPhone,
    message,
  })
}

export async function notifyPaymentVerifiedSafe(
  playerName: string,
  playerPhone: string,
  orderId: string,
  cartCount: number,
) {
  const message = `🎉 *¡Excelente ${playerName}!*

✅ Tu pago ha sido verificado exitosamente.

🎯 *Ya puedes participar en el bingo:*
• Orden: #${orderId.slice(-8)}
• Cartones: ${cartCount}
• Estado: ✅ VERIFICADO

🎮 Mantente atento a los números que se van cantando. ¡Buena suerte!

¡Que ganes! 🏆`

  return await sendWhatsAppMessageSafe({
    to: playerPhone,
    message,
  })
}

export async function notifyPaymentRejectedSafe(
  playerName: string,
  playerPhone: string,
  orderId: string,
  reason?: string,
) {
  const message = `❌ *Hola ${playerName}*

Lo sentimos, pero tu pago no pudo ser verificado.

📋 *Detalles:*
• Orden: #${orderId.slice(-8)}
• Estado: ❌ RECHAZADO
${reason ? `• Motivo: ${reason}` : ""}

💬 Por favor contacta a nuestro soporte para resolver este inconveniente.

Estamos aquí para ayudarte 🤝`

  return await sendWhatsAppMessageSafe({
    to: playerPhone,
    message,
  })
}
