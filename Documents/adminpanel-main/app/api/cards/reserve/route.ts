import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

export async function POST(request: Request) {
  try {
    // Obtener el body de la solicitud
    const body = await request.json();
    const { cardIds, guestId } = body;
    
    console.log('API /api/cards/reserve called with body:', { cardIds, guestId });

    if (!guestId) {
      return new Response(JSON.stringify({ 
        error: 'Guest ID is required'
      }), { status: 400 });
    }

    // Configurar el cliente de Supabase sin manejo de cookies
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          // No necesitamos manejar cookies explícitamente
          get: () => '',
          set: () => {},
          remove: () => {},
        },
      }
    );

    console.log(`Calling RPC 'reserve_cards_for_guest' for guestId: ${guestId} with cardIds:`, cardIds);
    const { data, error } = await supabase.rpc('reserve_cards_for_guest', {
      p_card_ids: cardIds,
      p_guest_id: guestId,
      p_expires_in_minutes: 30
    });

    if (error) {
      console.error('Database RPC error:', error);
      console.error('Error details:', {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      return new Response(JSON.stringify({ 
        error: error.message, 
        details: error.details,
        code: error.code,
        hint: error.hint
      }), { status: 500 });
    }

    console.log('RPC reserve_cards_for_guest successful:', data);
    return new Response(JSON.stringify({ 
      success: true,
      data 
    }), { status: 200 });

  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    console.error('Caught exception in reserve cards route:', e);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: errorMessage
    }), { status: 500 });
  }
}