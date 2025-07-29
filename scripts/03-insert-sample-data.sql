-- Insertar datos de ejemplo para pruebas
INSERT INTO games (name, status) VALUES 
  ('Bingo de Prueba 1', 'active'),
  ('Bingo Finalizado', 'finished');

-- Obtener el ID del primer juego para los datos de ejemplo
DO $$
DECLARE
  game_uuid UUID;
  player_uuid UUID;
  card_uuid UUID;
BEGIN
  -- Obtener el ID del juego activo
  SELECT id INTO game_uuid FROM games WHERE name = 'Bingo de Prueba 1' LIMIT 1;
  
  -- Insertar jugador de ejemplo
  INSERT INTO players (game_id, name, phone, cedula, cards_count) 
  VALUES (game_uuid, 'Juan Pérez', '0414-1234567', 'V-12345678', 1)
  RETURNING id INTO player_uuid;
  
  -- Insertar cartón de ejemplo
  INSERT INTO bingo_cards (player_id, numbers) 
  VALUES (player_uuid, '[1,5,12,18,23,27,31,38,42,47,52,56,61,67,72,3,9,15,21,29,34,40,45,51]')
  RETURNING id INTO card_uuid;
  
  -- Insertar algunos números cantados
  INSERT INTO called_numbers (game_id, number) VALUES 
    (game_uuid, 1),
    (game_uuid, 5),
    (game_uuid, 12);
    
  -- Insertar orden de compra de ejemplo
  INSERT INTO purchase_orders (
    player_name, 
    player_phone, 
    player_cedula, 
    cart_items, 
    total_amount, 
    status, 
    payment_method
  ) VALUES (
    'María González',
    '0424-9876543',
    'V-87654321',
    '[{"id": "card-123", "numbers": [2,7,13,19,24,28,32,39,43,48,53,57,62,68,73,4,10,16,22,30,35,41,46,52], "price": 2}]',
    2.00,
    'pending',
    'pago-movil'
  );
END $$;
