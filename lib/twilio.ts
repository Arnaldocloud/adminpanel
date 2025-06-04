// Configuración de Twilio con manejo robusto de errores
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"

console.log("🔧 Inicializando Twilio...")
console.log("- Account SID:", accountSid ? `${accountSid.substring(0, 10)}...` : "❌ NO DEFINIDA")
console.log("- Auth Token:", authToken ? "✅ DEFINIDA" : "❌ NO DEFINIDA")
console.log("- WhatsApp Number:", whatsappNumber)

// Verificar si estamos en modo mock
const isMockMode = !accountSid || !authToken

// Variable para el cliente de Twilio
let client: any = null

// Función para inicializar Twilio de manera lazy
async function initializeTwilioClient() {
  if (client || isMockMode) {
    return client
  }

  try {
    // Importación dinámica de Twilio
    const twilioModule = await import("twilio")
    const twilioConstructor = twilioModule.default || twilioModule

    if (typeof twilioConstructor === "function") {
      client = twilioConstructor(accountSid, authToken)
      console.log("✅ Cliente de Twilio inicializado correctamente")
    } else {
      throw new Error("Twilio constructor not found")
    }

    return client
  } catch (error) {
    console.error("💥 Error al inicializar cliente de Twilio:", error)
    console.log("🔄 Continuando en modo simulación")
    return null
  }
}

export interface WhatsAppMessage {
  to: string
  message: string
  mediaUrl?: string
}

// Función para enviar mensaje de WhatsApp
export async function sendWhatsAppMessage({ to, message, mediaUrl }: WhatsAppMessage) {
  try {
    console.log("📱 Preparando envío de WhatsApp...")

    // Intentar inicializar cliente si no está en modo mock
    if (!isMockMode) {
      client = await initializeTwilioClient()
    }

    // Si no tenemos cliente o estamos en modo mock
    if (!client || isMockMode) {
      console.log("🔸 [MOCK] Enviando mensaje WhatsApp simulado")
      console.log("📱 Destinatario:", to)
      console.log("💬 Mensaje:", message.substring(0, 50) + (message.length > 50 ? "..." : ""))
      if (mediaUrl) console.log("🖼️ Media URL:", mediaUrl)

      // Simular un retraso de red
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generar un ID de mensaje simulado
      const mockMessageId = "SM" + Math.random().toString(36).substring(2, 15)
      console.log("✅ [MOCK] Mensaje enviado con éxito:", mockMessageId)

      return {
        success: true,
        messageId: mockMessageId,
        mock: true,
      }
    }

    // Formatear número de teléfono para WhatsApp
    const formattedNumber = formatPhoneNumber(to)
    console.log("📞 Número original:", to)
    console.log("📞 Número formateado:", formattedNumber)

    const messageOptions: any = {
      from: whatsappNumber,
      to: `whatsapp:${formattedNumber}`,
      body: message,
    }

    // Agregar media si se proporciona
    if (mediaUrl) {
      messageOptions.mediaUrl = [mediaUrl]
    }

    console.log("📤 Opciones del mensaje:", {
      from: messageOptions.from,
      to: messageOptions.to,
      bodyLength: message.length,
      hasMedia: !!mediaUrl,
    })

    const result = await client.messages.create(messageOptions)

    console.log("✅ WhatsApp message sent successfully:", result.sid)
    console.log("📊 Message status:", result.status)

    return { success: true, messageId: result.sid, status: result.status }
  } catch (error: any) {
    console.error("💥 Error sending WhatsApp message:", error)
    console.error("Error code:", error.code)
    console.error("Error message:", error.message)

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
      mock: isMockMode,
    }
  }
}

// Formatear número de teléfono venezolano
function formatPhoneNumber(phone: string): string {
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
}

// Plantillas de mensajes
export const messageTemplates = {
  orderReceived: (playerName: string, orderId: string, amount: number, cartCount: number) =>
    `
🎯 *¡Hola ${playerName}!*

✅ Hemos recibido tu orden de compra de cartones de bingo.

📋 *Detalles de tu orden:*
• ID: #${orderId.slice(-8)}
• Cartones: ${cartCount}
• Total: $${amount} USD

⏳ Tu pago está siendo verificado por nuestro equipo. Te notificaremos cuando esté listo.

¡Gracias por participar en nuestro bingo! 🎉
  `.trim(),

  paymentVerified: (playerName: string, orderId: string, cartCount: number) =>
    `
🎉 *¡Excelente ${playerName}!*

✅ Tu pago ha sido verificado exitosamente.

🎯 *Ya puedes participar en el bingo:*
• Orden: #${orderId.slice(-8)}
• Cartones: ${cartCount}
• Estado: ✅ VERIFICADO

🎮 Mantente atento a los números que se van cantando. ¡Buena suerte!

¡Que ganes! 🏆
  `.trim(),

  paymentRejected: (playerName: string, orderId: string, reason?: string) =>
    `
❌ *Hola ${playerName}*

Lo sentimos, pero tu pago no pudo ser verificado.

📋 *Detalles:*
• Orden: #${orderId.slice(-8)}
• Estado: ❌ RECHAZADO
${reason ? `• Motivo: ${reason}` : ""}

💬 Por favor contacta a nuestro soporte para resolver este inconveniente.

Estamos aquí para ayudarte 🤝
  `.trim(),

  gameStarted: (playerName: string) =>
    `
🚀 *¡${playerName}, el juego ha comenzado!*

🎯 Ya estamos cantando números. Revisa tus cartones y marca los números que coincidan.

📱 Mantente atento a las actualizaciones del juego.

¡Que tengas suerte! 🍀
  `.trim(),

  numberCalled: (number: number, totalCalled: number) =>
    `
📢 *NÚMERO CANTADO: ${number}*

🎯 Números cantados hasta ahora: ${totalCalled}/75

¡Revisa tus cartones! 🎮
  `.trim(),

  bingoWinner: (playerName: string, cardId: string) =>
    `
🏆 *¡¡¡FELICITACIONES ${playerName.toUpperCase()}!!!*

🎉 ¡HAS GANADO EL BINGO! 🎉

🎯 *Detalles del premio:*
• Cartón ganador: ${cardId}
• ¡Eres el ganador oficial!

🎊 Contacta a los organizadores para reclamar tu premio.

¡INCREÍBLE! 🌟
  `.trim(),

  gameReset: () =>
    `
🔄 *NUEVO JUEGO INICIANDO*

🎯 Se ha reiniciado el juego de bingo. 

📋 Prepárate para la próxima ronda.

¡Buena suerte a todos! 🍀
  `.trim(),
}

// Funciones de notificación que manejan tanto modo mock como producción
export async function notifyOrderReceived(
  playerName: string,
  playerPhone: string,
  orderId: string,
  amount: number,
  cartCount: number,
) {
  const message = messageTemplates.orderReceived(playerName, orderId, amount, cartCount)
  return await sendWhatsAppMessage({
    to: playerPhone,
    message,
  })
}

export async function notifyPaymentVerified(
  playerName: string,
  playerPhone: string,
  orderId: string,
  cartCount: number,
) {
  const message = messageTemplates.paymentVerified(playerName, orderId, cartCount)
  return await sendWhatsAppMessage({
    to: playerPhone,
    message,
  })
}

export async function notifyPaymentRejected(playerName: string, playerPhone: string, orderId: string, reason?: string) {
  const message = messageTemplates.paymentRejected(playerName, orderId, reason)
  return await sendWhatsAppMessage({
    to: playerPhone,
    message,
  })
}

export async function notifyGameStarted(players: Array<{ name: string; phone: string }>) {
  const promises = players.map((player) =>
    sendWhatsAppMessage({
      to: player.phone,
      message: messageTemplates.gameStarted(player.name),
    }),
  )

  return await Promise.allSettled(promises)
}

export async function notifyNumberCalled(players: Array<{ phone: string }>, number: number, totalCalled: number) {
  // Enviar cada 3 números para no saturar pero mantener informados
  if (totalCalled % 3 !== 0 && totalCalled !== 1) return []

  const message = messageTemplates.numberCalled(number, totalCalled)
  const promises = players.map((player) =>
    sendWhatsAppMessage({
      to: player.phone,
      message,
    }),
  )

  return await Promise.allSettled(promises)
}

export async function notifyBingoWinner(playerName: string, playerPhone: string, cardId: string) {
  const message = messageTemplates.bingoWinner(playerName, cardId)
  return await sendWhatsAppMessage({
    to: playerPhone,
    message,
  })
}

export async function notifyGameReset(players: Array<{ phone: string }>) {
  const message = messageTemplates.gameReset()
  const promises = players.map((player) =>
    sendWhatsAppMessage({
      to: player.phone,
      message,
    }),
  )

  return await Promise.allSettled(promises)
}

// Exportar información del estado
export const getTwilioStatus = () => ({
  isMockMode,
  hasCredentials: !!accountSid && !!authToken,
  clientInitialized: !!client,
})
