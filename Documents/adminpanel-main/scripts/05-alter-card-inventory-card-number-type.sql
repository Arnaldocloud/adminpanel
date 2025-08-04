-- scripts/05-alter-card-inventory-card-number-type.sql

-- This script alters the 'card_number' column in 'card_inventory' table
-- from INTEGER to TEXT. This is useful if card numbers can contain
-- alphanumeric characters or leading zeros that an INTEGER type would strip.

-- Step 1: Directly alter the column type to TEXT
ALTER TABLE public.card_inventory
ALTER COLUMN card_number TYPE TEXT;

-- Optional: Re-add any other constraints or indexes that were on the old column
-- For example, if you had a NOT NULL constraint:
ALTER TABLE public.card_inventory
ALTER COLUMN card_number SET NOT NULL;

-- Optional: If you need to ensure that the values existent are unique after the change
-- ALTER TABLE public.card_inventory
-- ADD CONSTRAINT unique_card_number UNIQUE (card_number);
-- (Only if there is no already UNIQUE constraint in card_number)

-- Note: If the table is large, these operations can take time and lock the table.
-- Consider downtime or using a more advanced migration strategy for production.
