import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/lib/database.types';

// Definir tipos para los datos de los cartones
interface CardItem {
  card_id: string;
  price: number;
  cards: {
    id: string;
    card_number: number;
    is_available: boolean;
  } | null;
}

// Definir tipo para las órdenes
interface PurchaseOrder {
  id: string;
  card_purchases?: CardItem[];
  // Agregar otras propiedades según sea necesario
  [key: string]: any;
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Obtener todas las órdenes de compra con información de los cartones (sin autenticación)
    const { data: orders, error: ordersError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        card_purchases (
          card_id,
          price,
          cards (
            id,
            card_number,
            is_available
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return NextResponse.json(
        { error: 'Error al cargar las órdenes', details: ordersError.message },
        { status: 500 }
      );
    }

    // Formatear la respuesta para que coincida con lo que espera el frontend
    const formattedOrders = (orders as PurchaseOrder[]).map(order => ({
      ...order,
      cart_items: order.card_purchases?.map((item: CardItem) => ({
        id: item.card_id,
        numbers: item.cards ? [item.cards.card_number] : [],
        price: item.price,
        is_available: item.cards?.is_available ?? false,
        card_number: item.cards?.card_number
      })) || []
    }));

    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error('Error in GET /api/admin/orders:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}