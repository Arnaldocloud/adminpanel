-- Script para corregir la función reserve_cards_for_guest
-- Este script debe ejecutarse en la base de datos Supabase

-- Primero, eliminamos la función existente si existe
DROP FUNCTION IF EXISTS reserve_cards_for_guest(UUID[], TEXT, INTEGER);

-- Luego, creamos la nueva versión corregida de la función
CREATE OR REPLACE FUNCTION reserve_cards_for_guest(
  p_card_ids UUID[],
  p_guest_id TEXT,
  p_expires_in_minutes INTEGER DEFAULT 5
) 
RETURNS JSONB AS $$
DECLARE
  v_reservation_expiry TIMESTAMP;
  v_success BOOLEAN := TRUE;
  v_error_message TEXT;
  v_results JSONB := '[]'::JSONB;
  v_card_id UUID;
  v_updated_count INTEGER;
BEGIN
  -- Calcular la fecha de expiración
  v_reservation_expiry := NOW() + (p_expires_in_minutes * INTERVAL '1 minute');
  
  -- Iniciar una transacción
  BEGIN
    -- Para cada ID de tarjeta, intentar reservarla
    FOREACH v_card_id IN ARRAY p_card_ids LOOP
      -- Intentar actualizar el registro en card_inventory
      -- Especificamos la tabla para evitar ambigüedad
      UPDATE card_inventory
      SET 
        is_available = FALSE,
        reserved_until = v_reservation_expiry,
        reserved_by = p_guest_id,
        updated_at = NOW()
      WHERE card_inventory.id = v_card_id  -- Especificamos la tabla
      AND (is_available = TRUE OR reserved_until < NOW())
      RETURNING 1 INTO v_updated_count;
      
      -- Verificar si la actualización fue exitosa
      IF v_updated_count > 0 THEN
        -- Crear un registro de reserva
        INSERT INTO card_reservations (card_id, session_id, expires_at, status)
        VALUES (v_card_id, p_guest_id, v_reservation_expiry, 'reserved');
        
        -- Agregar a los resultados
        v_results := v_results || jsonb_build_object(
          'card_id', v_card_id,
          'status', 'reserved',
          'reserved_until', v_reservation_expiry
        );
      ELSE
        v_success := FALSE;
        v_error_message := 'No se pudo reservar una o más tarjetas';
        v_results := v_results || jsonb_build_object(
          'card_id', v_card_id,
          'status', 'failed',
          'error', 'No disponible o ya reservada'
        );
      END IF;
    END LOOP;
    
    -- Si todo salió bien, confirmar la transacción
    IF v_success THEN
      RETURN jsonb_build_object(
        'success', TRUE,
        'reserved_until', v_reservation_expiry,
        'reservations', v_results
      );
    ELSE
      -- Si hubo algún error, hacer rollback
      RAISE EXCEPTION '%', COALESCE(v_error_message, 'Error al reservar las tarjetas');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- En caso de error, hacer rollback y devolver el error
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', SQLERRM,
      'reservations', v_results
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentario para documentar la función
COMMENT ON FUNCTION reserve_cards_for_guest IS 'Reserva múltiples cartones para un invitado. Devuelve un JSON con el resultado de la operación.';
