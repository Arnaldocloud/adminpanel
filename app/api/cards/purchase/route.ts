import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

type PurchaseRequest = {
  cardIds: string[];
  sessionId: string;
  paymentMethod: string;
  paymentDetails: {
    transactionId?: string;
    referenceNumber?: string;
    senderPhone?: string;
    senderName?: string;
    // Add other payment details as needed
  };
  customerInfo: {
    name: string;
    phone: string;
    cedula: string;
  };
};

export async function POST(request: Request) {
  try {
    const { 
      cardIds, 
      sessionId, 
      paymentMethod, 
      paymentDetails, 
      customerInfo 
    }: PurchaseRequest = await request.json();

    // Input validation
    if (!cardIds || !Array.isArray(cardIds) || cardIds.length === 0) {
      return NextResponse.json(
        { error: 'No card IDs provided' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Validate customer info
    if (!customerInfo?.name || !customerInfo.phone || !customerInfo.cedula) {
      return NextResponse.json(
        { error: 'Customer information is incomplete' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    // Get card details to calculate total price
    const { data: cards, error: cardsError } = await supabase
      .from('card_inventory')
      .select('id, card_number, price')
      .in('id', cardIds);

    if (cardsError || !cards || cards.length !== cardIds.length) {
      console.error('Error fetching card details:', cardsError);
      return NextResponse.json(
        { error: 'Failed to verify card details' },
        { status: 400 }
      );
    }

    // Calculate total price (assuming each card has a price field)
    const totalAmount = cards.reduce((sum, card) => sum + (card.price || 0), 0);
    const cardNumbers = cards.map(card => card.card_number);

    // Create purchase order
    const { data: purchaseOrder, error: orderError } = await supabase
      .from('purchase_orders')
      .insert({
        player_name: customerInfo.name,
        player_phone: customerInfo.phone,
        player_cedula: customerInfo.cedula,
        cart_items: cardNumbers.map((num, index) => ({
          id: cardIds[index],
          card_number: num,
          price: cards[index].price
        })),
        total_amount: totalAmount,
        status: 'pending',
        payment_method: paymentMethod,
        transaction_id: paymentDetails.transactionId,
        reference_number: paymentDetails.referenceNumber,
        sender_phone: paymentDetails.senderPhone,
        sender_name: paymentDetails.senderName,
      })
      .select()
      .single();

    if (orderError || !purchaseOrder) {
      console.error('Error creating purchase order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create purchase order' },
        { status: 500 }
      );
    }

    // Confirm the purchase in the database
    const { data: purchaseResult, error: purchaseError } = await supabase
      .rpc('confirm_purchase', {
        p_purchase_order_id: purchaseOrder.id,
        p_card_ids: cardIds,
        p_prices: cards.map(card => card.price || 0),
        p_session_id: sessionId
      });

    if (purchaseError || !purchaseResult) {
      console.error('Error confirming purchase:', purchaseError);
      
      // Obtener más información sobre el estado de las reservas
      const { data: reservations, error: reservationError } = await supabase
        .from('card_inventory')
        .select('id, card_number, reserved_by, reserved_until, is_available')
        .in('id', cardIds);
      
      console.log('Estado de las reservas:', {
        cardIds,
        sessionId,
        reservations,
        reservationError
      });
      
      // Actualizar el estado de la orden a 'rejected' con información de depuración
      const debugInfo = {
        error: purchaseError?.message,
        cardIds,
        sessionId,
        reservationStatus: reservations?.map(r => ({
          id: r.id,
          card_number: r.card_number,
          is_reserved: !r.is_available,
          reserved_by: r.reserved_by,
          reserved_until: r.reserved_until,
          is_available: r.is_available
        }))
      };
      
      await supabase
        .from('purchase_orders')
        .update({ 
          status: 'rejected',
          debug_info: JSON.stringify(debugInfo)
        })
        .eq('id', purchaseOrder.id);
      
      return NextResponse.json({
        success: false,
        error: 'Failed to confirm purchase',
        orderId: purchaseOrder.id,
        details: purchaseError?.message,
        debug: debugInfo
      }, { status: 500 });
    }

    // Get the updated purchase order with card details
    const { data: updatedOrder, error: orderFetchError } = await supabase
      .from('purchase_orders')
      .select(`
        *,
        card_purchases:card_purchases(
          id,
          card_id,
          purchased_at,
          price
        )
      `)
      .eq('id', purchaseOrder.id)
      .single();

    if (orderFetchError) {
      console.error('Error fetching updated order:', orderFetchError);
      // Still return success since the purchase was confirmed, just without the full details
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase completed successfully',
      order: updatedOrder || purchaseOrder,
      purchasedCards: cards.map(card => ({
        id: card.id,
        card_number: card.card_number,
        price: card.price
      }))
    });

  } catch (error) {
    console.error('Unexpected error in POST /api/cards/purchase:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
