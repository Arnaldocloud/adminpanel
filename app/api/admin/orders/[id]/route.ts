import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID de la orden' },
        { status: 400 }
      );
    }

    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado no válido' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verificar si el usuario está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Actualizar el estado de la orden
    const { data: order, error: updateError } = await supabase
      .from('purchase_orders')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
        verified_by: session.user.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Error al actualizar el estado de la orden' },
        { status: 500 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error in PATCH /api/admin/orders/[id]:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
