-- Create card_inventory table to store all available bingo cards
CREATE TABLE IF NOT EXISTS card_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_number INTEGER NOT NULL UNIQUE,
  image_url TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  reserved_until TIMESTAMP WITH TIME ZONE,
  reserved_by TEXT,
  sold_at TIMESTAMP WITH TIME ZONE,
  sold_to TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create card_reservations table to track temporary reservations
CREATE TABLE IF NOT EXISTS card_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_id UUID REFERENCES card_inventory(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  reserved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'purchased', 'expired', 'released')),
  UNIQUE(card_id, session_id)
);

-- Create card_purchases table to track purchases
CREATE TABLE IF NOT EXISTS card_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_order_id UUID REFERENCES purchase_orders(id) ON DELETE CASCADE,
  card_id UUID REFERENCES card_inventory(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  price DECIMAL(10,2) NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_card_inventory_available ON card_inventory(is_available) WHERE is_available = TRUE;
CREATE INDEX IF NOT EXISTS idx_card_inventory_reserved ON card_inventory(reserved_until) WHERE reserved_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_card_reservations_expires ON card_reservations(expires_at) WHERE status = 'reserved';
CREATE INDEX IF NOT EXISTS idx_card_reservations_session ON card_reservations(session_id, status);

-- Function to check and release expired reservations
CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS TRIGGER AS $$
BEGIN
  -- Release cards where reservation has expired
  UPDATE card_inventory
  SET 
    is_available = TRUE,
    reserved_until = NULL,
    reserved_by = NULL,
    updated_at = NOW()
  WHERE reserved_until < NOW()
  AND is_available = FALSE;
  
  -- Update reservation status to expired
  UPDATE card_reservations
  SET status = 'expired',
      expires_at = NOW()
  WHERE expires_at < NOW()
  AND status = 'reserved';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger that runs the release function before insert or update on card_inventory
-- Note: No se puede usar BEFORE SELECT en triggers de PostgreSQL
CREATE OR REPLACE TRIGGER trigger_release_expired_reservations
BEFORE INSERT OR UPDATE ON card_inventory
FOR EACH ROW
EXECUTE FUNCTION release_expired_reservations();

-- Crear una función separada para manejar la limpieza de reservas expiradas
-- que puede ser llamada periódicamente o desde la aplicación
CREATE OR REPLACE FUNCTION check_and_release_expired_reservations()
RETURNS void AS $$
BEGIN
  -- Actualizar tarjetas con reservas expiradas
  UPDATE card_inventory
  SET 
    is_available = TRUE,
    reserved_until = NULL,
    reserved_by = NULL,
    updated_at = NOW()
  WHERE reserved_until < NOW()
  AND is_available = FALSE;
  
  -- Actualizar el estado de las reservas a expiradas
  UPDATE card_reservations
  SET status = 'expired',
      expires_at = NOW()
  WHERE expires_at < NOW()
  AND status = 'reserved';
END;
$$ LANGUAGE plpgsql;

-- Function to reserve a card
CREATE OR REPLACE FUNCTION reserve_card(
  p_card_id UUID,
  p_session_id TEXT,
  p_reservation_minutes INTEGER DEFAULT 5
) 
RETURNS BOOLEAN AS $$
DECLARE
  v_reserved_until TIMESTAMP WITH TIME ZONE;
  v_is_available BOOLEAN;
  v_reservation_id UUID;
BEGIN
  -- Set reservation expiration time
  v_reserved_until := NOW() + (p_reservation_minutes * INTERVAL '1 minute');
  
  -- Try to reserve the card
  UPDATE card_inventory
  SET 
    is_available = FALSE,
    reserved_until = v_reserved_until,
    reserved_by = p_session_id,
    updated_at = NOW()
  WHERE id = p_card_id
  AND (is_available = TRUE OR 
       (reserved_until < NOW() AND is_available = FALSE));
  
  -- Check if the update was successful
  GET DIAGNOSTICS v_is_available = ROW_COUNT;
  
  -- If card was reserved, create a reservation record
  IF v_is_available > 0 THEN
    INSERT INTO card_reservations (card_id, session_id, expires_at)
    VALUES (p_card_id, p_session_id, v_reserved_until)
    RETURNING id INTO v_reservation_id;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm a purchase
CREATE OR REPLACE FUNCTION confirm_purchase(
  p_purchase_order_id UUID,
  p_card_ids UUID[],
  p_prices DECIMAL(10,2)[],
  p_session_id TEXT
) 
RETURNS BOOLEAN AS $$
DECLARE
  i INTEGER;
  v_card_id UUID;
  v_price DECIMAL(10,2);
  v_reservation_valid BOOLEAN;
BEGIN
  -- Start a transaction
  BEGIN
    -- Check if all cards are still reserved by this session
    SELECT COUNT(*) = array_length(p_card_ids, 1) INTO v_reservation_valid
    FROM card_inventory
    WHERE id = ANY(p_card_ids)
    AND reserved_by = p_session_id
    AND is_available = FALSE
    AND reserved_until > NOW();
    
    IF NOT v_reservation_valid THEN
      RETURN FALSE;
    END IF;
    
    -- Update purchase order status to 'paid' first
    UPDATE purchase_orders
    SET status = 'paid',
        updated_at = NOW()
    WHERE id = p_purchase_order_id
    AND status = 'pending';
    
    -- Mark cards as sold
    FOR i IN 1..array_length(p_card_ids, 1) LOOP
      v_card_id := p_card_ids[i];
      v_price := p_prices[i];
      
      -- Update card status
      UPDATE card_inventory
      SET 
        is_available = FALSE,
        reserved_until = NULL,
        reserved_by = NULL,
        sold_at = NOW(),
        sold_to = p_session_id,
        updated_at = NOW()
      WHERE id = v_card_id;
      
      -- Record the purchase
      INSERT INTO card_purchases (purchase_order_id, card_id, price)
      VALUES (p_purchase_order_id, v_card_id, v_price)
      ON CONFLICT (card_id) DO NOTHING;
      
      -- Update reservation status
      UPDATE card_reservations
      SET status = 'purchased',
          expires_at = NOW()
      WHERE card_id = v_card_id
      AND session_id = p_session_id
      AND status = 'reserved';
    END LOOP;
    
    RETURN TRUE;
  EXCEPTION WHEN OTHERS THEN
    -- Log the error
    RAISE NOTICE 'Error in confirm_purchase: %', SQLERRM;
    RETURN FALSE;
  END;
END;
$$ LANGUAGE plpgsql;

-- Function to get available cards with pagination
CREATE OR REPLACE FUNCTION get_available_cards(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_search_text TEXT DEFAULT NULL
) 
RETURNS TABLE (
  id UUID,
  card_number INTEGER,
  image_url TEXT,
  is_available BOOLEAN,
  reserved_until TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id,
    ci.card_number,
    ci.image_url,
    ci.is_available,
    ci.reserved_until
  FROM card_inventory ci
  WHERE ci.is_available = TRUE
  AND (p_search_text IS NULL OR ci.card_number::TEXT = p_search_text)
  ORDER BY ci.card_number
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;
