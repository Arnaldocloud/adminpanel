import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export interface Order {
  id: string
  player_name: string
  player_phone: string
  player_cedula: string
  status: 'pending' | 'paid' | 'verified' | 'rejected'
  payment_method: string
  transaction_id?: string
  reference_number?: string
  sender_phone?: string
  sender_name?: string
  created_at: string
  updated_at?: string
  total_amount: number
  cart_items: Array<{
    id?: string
    card_id: string
    card_number: number
    numbers: number[]
    price: number
    image_url?: string
  }>
}

export const orderService = {
  // Crear una nueva orden
  async createOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    try {
      console.log('Creando orden con datos:', JSON.stringify(orderData, null, 2));
      
      // 1. Primero verificamos la disponibilidad de los cartones
      if (orderData.cart_items && orderData.cart_items.length > 0) {
        const cardNumbers = orderData.cart_items.map(item => item.card_number);
        
        // Verificamos si los cartones existen y están disponibles
        const { data: cards, error: fetchError } = await supabase
          .from('card_inventory')
          .select('card_number, is_available, reserved_by, sold_to')
          .in('card_number', cardNumbers);
        
        if (fetchError) {
          console.error('Error verificando cartones:', fetchError);
          throw fetchError;
        }
        
        // Verificamos que todos los cartones estén disponibles o reservados por este usuario
        const unavailableCards = cards.filter(card => 
          !card.is_available && card.reserved_by !== orderData.player_cedula
        );
        
        if (unavailableCards.length > 0) {
          const errorMsg = `Algunos cartones ya no están disponibles: ${unavailableCards.map(c => c.card_number).join(', ')}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
      }
      
      // 2. Creamos la orden
      const orderPayload = {
        player_name: orderData.player_name,
        player_phone: orderData.player_phone,
        player_cedula: orderData.player_cedula,
        total_amount: orderData.total_amount,
        payment_method: orderData.payment_method,
        transaction_id: orderData.transaction_id || null,
        reference_number: orderData.reference_number || null,
        sender_phone: orderData.sender_phone || null,
        sender_name: orderData.sender_name || null,
        status: orderData.status || 'pending',
        cart_items: orderData.cart_items.map(item => ({
          card_id: item.card_id,
          card_number: item.card_number,
          numbers: item.numbers,
          price: item.price,
          image_url: item.image_url || null
        }))
      };

      console.log('Insertando orden en la base de datos...');
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert([orderPayload])
        .select('*')
        .single();

      if (orderError) {
        console.error('Error al crear la orden:', orderError);
        throw orderError;
      }

      console.log('Orden creada exitosamente:', order);
      
      // 3. Actualizamos el estado de los cartones a vendido
      if (orderData.cart_items?.length > 0) {
        const cardNumbers = orderData.cart_items.map(item => item.card_number);
        const now = new Date().toISOString();
        
        // Actualizamos el estado de los cartones a vendido
        const { error: updateError } = await supabase
          .from('card_inventory')
          .update({ 
            is_available: false,
            reserved_by: null,
            reserved_until: null,
            sold_to: orderData.player_cedula,
            sold_at: now
          })
          .in('card_number', cardNumbers);
        
        if (updateError) {
          console.error('Error actualizando estado de cartones:', updateError);
          throw updateError;
        }
      }

      return order as Order;
    } catch (error) {
      console.error('Error en createOrder:', error);
      throw error;
    }
  },

  // Obtener todas las órdenes (para panel de administración)
  async getAllOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener órdenes:', error);
      throw error;
    }
    
    return data.map(order => ({
      id: order.id,
      player_name: order.player_name,
      player_phone: order.player_phone,
      player_cedula: order.player_cedula,
      status: order.status || 'pending',
      payment_method: order.payment_method,
      transaction_id: order.transaction_id || undefined,
      reference_number: order.reference_number || undefined,
      sender_phone: order.sender_phone || undefined,
      sender_name: order.sender_name || undefined,
      created_at: order.created_at,
      updated_at: order.updated_at || undefined,
      total_amount: order.total_amount || 0,
      cart_items: Array.isArray(order.cart_items) 
        ? order.cart_items.map((item: any) => ({
            card_id: item.card_id,
            card_number: item.card_number,
            numbers: Array.isArray(item.numbers) ? item.numbers : 
                    (typeof item.numbers === 'string' ? JSON.parse(item.numbers) : []),
            price: Number(item.price) || 0,
            image_url: item.image_url
          }))
        : []
    }));
  },

  // Obtener órdenes por cédula
  async getOrdersByCedula(cedula: string): Promise<Order[]> {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('player_cedula', cedula)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener órdenes por cédula:', error);
      throw error;
    }
    
    return data.map(order => ({
      id: order.id,
      player_name: order.player_name,
      player_phone: order.player_phone,
      player_cedula: order.player_cedula,
      status: order.status || 'pending',
      payment_method: order.payment_method,
      transaction_id: order.transaction_id || undefined,
      reference_number: order.reference_number || undefined,
      sender_phone: order.sender_phone || undefined,
      sender_name: order.sender_name || undefined,
      created_at: order.created_at,
      updated_at: order.updated_at || undefined,
      total_amount: order.total_amount || 0,
      cart_items: Array.isArray(order.cart_items) 
        ? order.cart_items.map((item: any) => ({
            card_id: item.card_id,
            card_number: item.card_number,
            numbers: Array.isArray(item.numbers) ? item.numbers : 
                    (typeof item.numbers === 'string' ? JSON.parse(item.numbers) : []),
            price: Number(item.price) || 0,
            image_url: item.image_url
          }))
        : []
    }));
  },

  // Suscribirse a cambios en las órdenes
  subscribeToOrders(cedula: string, callback: (orders: Order[]) => void) {
    const subscription = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchase_orders',
          filter: `player_cedula=eq.${cedula}`
        },
        async () => {
          // Cuando hay un cambio, obtenemos todas las órdenes actualizadas
          try {
            const orders = await this.getOrdersByCedula(cedula);
            callback(orders);
          } catch (error) {
            console.error('Error en la suscripción a cambios:', error);
          }
        }
      )
      .subscribe()

    return {
      unsubscribe: () => {
        supabase.removeChannel(subscription)
      }
    }
  }
}
