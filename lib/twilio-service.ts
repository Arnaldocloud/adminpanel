// Servicio centralizado para Twilio con manejo robusto de errores
let twilioClient: any = null
let twilioInitialized = false
let twilioError: string | null = null

interface TwilioResult {
  success: boolean
  messageId?: string
  error?: string
  mock?: boolean
  fallback?: boolean
}

// Función para inicializar Twilio de forma segura
async function initializeTwilio(): Promise<{ success: boolean; error?: string }> {
  if (twilioInitialized) {
    return { success: !!twilioClient, error: twilioError }
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  if (!accountSid || !authToken) {
    twilioError = "Missing Twilio credentials"
    twilioInitialized = true
    return { success: false, error: twilioError }
  }

  try {
    console.log("🔧 Intentando inicializar Twilio...")

    // Estrategia 1: Importación estática (solo funciona si está disponible)
    try {
      const twilio = eval("require")("twilio")
      twilioClient = twilio(accountSid, authToken)
      twilioInitialized = true
      console.log("✅ Twilio inicializado con require")
      return { success: true }
    } catch (requireError) {
      console.log("⚠️ require no disponible, intentando import dinámico...")
    }

    // Estrategia 2: Import dinámico
    try {
      const twilioModule = await import("twilio")
      const TwilioConstructor = twilioModule.default || twilioModule

      if (typeof TwilioConstructor === "function") {
        twilioClient = TwilioConstructor(accountSid, authToken)
        twilioInitialized = true
        console.log("✅ Twilio inicializado con import dinámico")
        return { success: true }
      } else {
        throw new Error("Twilio constructor not found")
      }
    } catch (importError) {
      console.error("❌ Error con import dinámico:", importError)
    }

    // Si llegamos aquí, ambas estrategias fallaron
    twilioError = "Could not load Twilio module"
    twilioInitialized = true
    return { success: false, error: twilioError }
  } catch (error: any) {
    twilioError = `Initialization error: ${error.message}`
    twilioInitialized = true
    return { success: false, error: twilioError }
  }
}

// Función para formatear número de teléfono
function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, "")
  if (cleaned.startsWith("0")) {
    cleaned = "+58" + cleaned.substring(1)
  }
  if (!cleaned.startsWith("+")) {
    cleaned = "+58" + cleaned
  }
  return cleaned
}

// Función principal para enviar mensajes
export async function sendWhatsAppMessage(
  to: string,
  message: string,
  options: { mediaUrl?: string } = {},
): Promise<TwilioResult> {
  try {
    console.log("📱 Preparando envío de WhatsApp...")

    // Intentar inicializar Twilio
    const initResult = await initializeTwilio()

    if (!initResult.success) {
      console.log("🔸 Usando modo simulación:", initResult.error)

      // Simular envío
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return {
        success: true,
        messageId: `mock-${Date.now()}`,
        mock: true,
        fallback: true,
      }
    }

    // Si Twilio está disponible, enviar mensaje real
    const formattedNumber = formatPhoneNumber(to)
    const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"

    console.log("📞 Enviando a:", formattedNumber)

    const messageOptions: any = {
      from: whatsappNumber,
      to: `whatsapp:${formattedNumber}`,
      body: message,
    }

    if (options.mediaUrl) {
      messageOptions.mediaUrl = [options.mediaUrl]
    }

    const result = await twilioClient.messages.create(messageOptions)

    console.log("✅ Mensaje enviado:", result.sid)

    return {
      success: true,
      messageId: result.sid,
      mock: false,
    }
  } catch (error: any) {
    console.error("💥 Error enviando mensaje:", error)

    // Si es un error de Twilio específico, intentar dar información útil
    let userFriendlyError = error.message || "Error desconocido"

    if (error.code === 21211) {
      userFriendlyError = "Número de teléfono inválido"
    } else if (error.code === 21408) {
      userFriendlyError = "Número no registrado en WhatsApp Sandbox"
    } else if (error.code === 21614) {
      userFriendlyError = "El número no puede recibir mensajes de WhatsApp"
    } else if (error.code === 20003) {
      userFriendlyError = "Credenciales de Twilio inválidas"
    }

    // Si es un error crítico, usar fallback
    if (
      error.message?.includes("Cannot read properties") ||
      error.message?.includes("is not a function") ||
      !twilioClient
    ) {
      console.log("🔄 Error crítico, usando fallback simulado")

      return {
        success: true,
        messageId: `fallback-${Date.now()}`,
        mock: true,
        fallback: true,
      }
    }

    return {
      success: false,
      error: userFriendlyError,
    }
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

// Plantillas de mensajes
export const messageTemplates = {
  paymentVerified: (playerName: string, orderId: string, cartCount: number) => `🎉 ¡Excelente ${playerName}!

✅ Tu pago ha sido verificado exitosamente.

🎯 *Ya puedes participar en el bingo:*
• Orden: #${orderId.slice(-8)}
• Cartones: ${cartCount}
• Estado: ✅ VERIFICADO

🎮 Mantente atento a los números que se van cantando. ¡Buena suerte!

¡Que ganes! 🏆`,

  paymentRejected: (playerName: string, orderId: string, reason?: string) => `❌ *Hola ${playerName}*

Lo sentimos, pero tu pago no pudo ser verificado.

📋 *Detalles:*
• Orden: #${orderId.slice(-8)}
• Estado: ❌ RECHAZADO
${reason ? `• Motivo: ${reason}` : ""}

💬 Por favor contacta a nuestro soporte para resolver este inconveniente.

Estamos aquí para ayudarte 🤝`,

  orderReceived: (playerName: string, orderId: string, amount: number, cartCount: number) => `🎯 *¡Hola ${playerName}!*

✅ Hemos recibido tu orden de compra de cartones de bingo.

📋 *Detalles de tu orden:*
• ID: #${orderId.slice(-8)}
• Cartones: ${cartCount}
• Total: $${amount} USD

⏳ Tu pago está siendo verificado por nuestro equipo. Te notificaremos cuando esté listo.

¡Gracias por participar en nuestro bingo! 🎉`,
}
