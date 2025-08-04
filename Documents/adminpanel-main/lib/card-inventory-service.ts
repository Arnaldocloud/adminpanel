import { supabase } from "./supabase"
import type { CardImage } from "./supabase-storage"

type Subscription = {
  unsubscribe: () => void;
};

// Servicio para gestionar el inventario de cartones
export const cardInventoryService = {
  // Obtener cartones disponibles con paginación
  async getAvailableCards(
    page = 1,
    limit = 20,
    filterReservedBy?: string | null
  ): Promise<{
    cards: CardImage[]
    total: number
    hasMore: boolean
  }> {
    // Intentar liberar reservas expiradas, pero continuar incluso si falla
    try {
      const { data, error } = await supabase
        .rpc('release_expired_reservations')
        .select('*');
      
      if (error) {
        console.warn('Error al liberar reservas expiradas:', error);
      } else if (data?.[0]?.status === 'error') {
        console.warn('Error en la función release_expired_reservations:', data[0].message);
      }
    } catch (error) {
      console.warn('Excepción al liberar reservas expiradas:', error);
    }

    const offset = (page - 1) * limit;

    let query = supabase
      .from("card_inventory")
      .select("*", { count: "exact" })
      .or(`is_available.eq.true,and(is_available.eq.false,reserved_by.eq.${filterReservedBy || 'null'})`)
      .is("sold_to", null)
      .order("card_number");

    if (page && limit) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    const cards: CardImage[] =
      data?.map((card) => ({
        cardNumber: card.card_number,
        imageUrl: card.image_url,
        filename: card.image_filename,
        numbers: card.numbers,
        isAvailable: card.is_available,
        reservedBy: card.reserved_by,
        reservedUntil: card.reserved_until,
      })) || [];

    return {
      cards,
      total: count || 0,
      hasMore: (count || 0) > offset + limit,
    };
  },

  // Reservar cartones temporalmente (5 minutos)
  async reserveCards(cardNumbers: number[], userCedula: string): Promise<{success: boolean; error?: string}> {
    try {
      const reserveUntil = new Date()
      reserveUntil.setMinutes(reserveUntil.getMinutes() + 5) // 5 minutos

      // Primero verificamos la disponibilidad para evitar condiciones de carrera
      const { data: availableCards, error: checkError } = await supabase
        .from("card_inventory")
        .select("card_number")
        .in("card_number", cardNumbers)
        .or(`is_available.eq.true,reserved_by.eq.${userCedula}`)
        .is("sold_to", null);

      if (checkError) throw checkError;
      
      // Verificamos si todos los cartones solicitados están disponibles
      const availableCardNumbers = new Set(availableCards?.map(c => c.card_number) || []);
      const unavailableCards = cardNumbers.filter(num => !availableCardNumbers.has(num));
      
      if (unavailableCards.length > 0) {
        return {
          success: false,
          error: `Algunos cartones ya no están disponibles: ${unavailableCards.join(', ')}`
        };
      }

      // Si todos están disponibles, procedemos con la reserva
      const { error: updateError } = await supabase
        .from("card_inventory")
        .update({
          is_available: false,
          reserved_by: userCedula,
          reserved_until: reserveUntil.toISOString(),
        })
        .in("card_number", cardNumbers)
        .or(`is_available.eq.true,reserved_by.eq.${userCedula}`)
        .is("sold_to", null);

      if (updateError) throw updateError;
      
      return { success: true };
    } catch (error) {
      console.error('Error reservando cartones:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al reservar cartones'
      };
    }
  },

  // Confirmar compra de cartones reservados
  async confirmPurchase(cardNumbers: number[], userCedula: string): Promise<{success: boolean; error?: string}> {
    try {
      const { error } = await supabase
        .from("card_inventory")
        .update({
          sold_to: userCedula,
          sold_at: new Date().toISOString(),
          is_available: false,
          reserved_by: null,
          reserved_until: null,
        })
        .in("card_number", cardNumbers)
        .eq("reserved_by", userCedula);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error confirmando compra:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al confirmar la compra'
      };
    }
  },

  // Suscribirse a cambios en los cartones
  subscribeToCards(
    callback: (cards: CardImage[]) => void,
    filter?: { reservedBy?: string; soldTo?: string | null }
  ): Subscription {
    let query = supabase
      .channel('card-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'card_inventory' 
        }, 
        (payload) => {
          // Actualizar la caché local o el estado según sea necesario
          this.getAvailableCards(1, 20, filter?.reservedBy)
            .then(({ cards }) => callback(cards))
            .catch(console.error);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(query);
      }
    };
  },

  // Liberar reservas de un usuario
  async releaseUserReservations(userCedula: string): Promise<{success: boolean; error?: string}> {
    try {
      const { error } = await supabase
        .from("card_inventory")
        .update({
          is_available: true,
          reserved_by: null,
          reserved_until: null,
        })
        .eq("reserved_by", userCedula);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error liberando reservas:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al liberar reservas'
      };
    }
  },

  // Obtener cartones reservados por un usuario
  async getUserReservedCards(userCedula: string): Promise<CardImage[]> {
    const { data, error } = await supabase
      .from("card_inventory")
      .select("*")
      .eq("reserved_by", userCedula)
      .is("sold_to", null)

    if (error) throw error

    return (
      data?.map((card) => ({
        cardNumber: card.card_number,
        imageUrl: card.image_url,
        filename: card.image_filename,
        numbers: card.numbers,
        isAvailable: card.is_available,
        reservedBy: card.reserved_by,
        reservedUntil: card.reserved_until,
      })) || []
    )
  },

  // Obtener cartones comprados por un usuario
  async getUserPurchasedCards(userCedula: string): Promise<CardImage[]> {
    const { data, error } = await supabase
      .from("card_inventory")
      .select("*")
      .eq("sold_to", userCedula)
      .order("sold_at", { ascending: false })

    if (error) throw error

    return (
      data?.map((card) => ({
        cardNumber: card.card_number,
        imageUrl: card.image_url,
        filename: card.image_filename,
        numbers: card.numbers,
        isAvailable: card.is_available,
        reservedBy: card.reserved_by,
        reservedUntil: card.reserved_until,
      })) || []
    )
  },

  // Agregar cartón al inventario (para admin)
  async addCardToInventory(cardData: {
    cardNumber: number
    numbers: number[]
    imageUrl: string
    filename: string
  }): Promise<void> {
    const { error } = await supabase.from("card_inventory").insert({
      card_number: cardData.cardNumber,
      numbers: cardData.numbers,
      image_url: cardData.imageUrl,
      image_filename: cardData.filename,
    })

    if (error) throw error
  },

  // Obtener estadísticas del inventario
  async getInventoryStats(): Promise<{
    total: number
    available: number
    reserved: number
    sold: number
  }> {
    const { data, error } = await supabase.from("card_inventory").select("is_available, reserved_by, sold_to")

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      available: 0,
      reserved: 0,
      sold: 0,
    }

    data?.forEach((card) => {
      if (card.sold_to) {
        stats.sold++
      } else if (card.reserved_by) {
        stats.reserved++
      } else if (card.is_available) {
        stats.available++
      }
    })

    return stats
  },
}