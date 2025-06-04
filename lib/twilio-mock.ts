// Versión simulada de Twilio para desarrollo local
export interface WhatsAppMessage {
  to: string
  message: string
  mediaUrl?: string
}

// Función simulada para enviar mensaje de WhatsApp
export async function sendWhatsAppMessage({ to, message, mediaUrl }: WhatsAppMessage) {
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

// Versiones simuladas de las funciones de notificación
export const notifyOrderReceived = async (
  playerName: string,
  playerPhone: string,
  orderId: string,
  amount: number,
  cartCount: number,
) => {
  console.log("🔸 [MOCK] Notificación de orden recibida:", { playerName, orderId, amount, cartCount })
  return { success: true, messageId: "mock-id", mock: true }
}

export const notifyPaymentVerified = async (
  playerName: string,
  playerPhone: string,
  orderId: string,
  cartCount: number,
) => {
  console.log("🔸 [MOCK] Notificación de pago verificado:", { playerName, orderId, cartCount })
  return { success: true, messageId: "mock-id", mock: true }
}

export const notifyPaymentRejected = async (
  playerName: string,
  playerPhone: string,
  orderId: string,
  reason?: string,
) => {
  console.log("🔸 [MOCK] Notificación de pago rechazado:", { playerName, orderId, reason })
  return { success: true, messageId: "mock-id", mock: true }
}

export const notifyGameStarted = async (players: Array<{ name: string; phone: string }>) => {
  console.log("🔸 [MOCK] Notificación de juego iniciado:", { playerCount: players.length })
  return players.map(() => ({ status: "fulfilled", value: { success: true, mock: true } }))
}

export const notifyNumberCalled = async (players: Array<{ phone: string }>, number: number, totalCalled: number) => {
  console.log("🔸 [MOCK] Notificación de número cantado:", { number, totalCalled, playerCount: players.length })
  return players.map(() => ({ status: "fulfilled", value: { success: true, mock: true } }))
}

export const notifyBingoWinner = async (playerName: string, playerPhone: string, cardId: string) => {
  console.log("🔸 [MOCK] Notificación de ganador:", { playerName, cardId })
  return { success: true, messageId: "mock-id", mock: true }
}

export const notifyGameReset = async (players: Array<{ phone: string }>) => {
  console.log("🔸 [MOCK] Notificación de juego reiniciado:", { playerCount: players.length })
  return players.map(() => ({ status: "fulfilled", value: { success: true, mock: true } }))
}

// Exportar las plantillas de mensajes para mantener compatibilidad
export const messageTemplates = {
  orderReceived: () => "Mock: Orden recibida",
  paymentVerified: () => "Mock: Pago verificado",
  paymentRejected: () => "Mock: Pago rechazado",
  gameStarted: () => "Mock: Juego iniciado",
  numberCalled: () => "Mock: Número cantado",
  bingoWinner: () => "Mock: Ganador de bingo",
  gameReset: () => "Mock: Juego reiniciado",
}
