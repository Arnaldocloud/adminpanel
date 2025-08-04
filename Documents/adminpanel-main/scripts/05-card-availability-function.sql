-- Function to get available cards for reservation
CREATE OR REPLACE FUNCTION get_available_cards_for_reservation(
  p_card_ids UUID[],
  p_session_id TEXT
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
  FROM 
    card_inventory ci
  WHERE 
    ci.id = ANY(p_card_ids)
    AND (
      -- Card is available
      ci.is_available = TRUE
      -- Or card is reserved by this session and not expired
      OR (
        ci.is_available = FALSE 
        AND ci.reserved_by = p_session_id
        AND ci.reserved_until > NOW()
      )
      -- Or card reservation has expired
      OR (
        ci.is_available = FALSE 
        AND ci.reserved_until <= NOW()
      )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
