-- Habilitar Row Level Security (RLS)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE called_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso público (ajustar según necesidades de seguridad)
-- En producción, deberías implementar autenticación y políticas más restrictivas

-- Políticas para games
CREATE POLICY "Allow all operations on games" ON games FOR ALL USING (true);

-- Políticas para players
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);

-- Políticas para bingo_cards
CREATE POLICY "Allow all operations on bingo_cards" ON bingo_cards FOR ALL USING (true);

-- Políticas para called_numbers
CREATE POLICY "Allow all operations on called_numbers" ON called_numbers FOR ALL USING (true);

-- Políticas para winners
CREATE POLICY "Allow all operations on winners" ON winners FOR ALL USING (true);

-- Políticas para purchase_orders
CREATE POLICY "Allow all operations on purchase_orders" ON purchase_orders FOR ALL USING (true);
