// app/api/notifications/status/route.ts
import { NextResponse } from 'next/server';
import { checkTwilioStatus } from '@/lib/twilio-safe';

export async function GET() {
  try {
    const status = await checkTwilioStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error al verificar el estado de Twilio:', error);
    return NextResponse.json(
      { 
        isConfigured: false, 
        message: 'Error al verificar el estado de Twilio' 
      },
      { status: 500 }
    );
  }
}