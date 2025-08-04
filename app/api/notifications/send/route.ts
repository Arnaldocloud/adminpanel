// app/api/notifications/send/route.ts
import { NextResponse } from 'next/server';
import { sendWhatsAppMessageSafe } from '@/lib/twilio-safe';

export async function POST(request: Request) {
  try {
    const { to, body } = await request.json();
    
    if (!to || !body) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessageSafe({
      to,
      body,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    return NextResponse.json(
      { error: 'Error al enviar la notificación' },
      { status: 500 }
    );
  }
}