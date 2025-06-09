/*
  # Fix missing total column in vendas table

  1. Changes
    - Ensure the total column exists in the vendas table
    - Set appropriate default value and constraints
    - Update existing records to calculate total from quantidade * preco_unitario

  2. Safety
    - Uses conditional logic to only add column if it doesn't exist
    - Preserves existing data
    - Updates existing records with calculated totals
*/

-- Add total column to vendas table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vendas' AND column_name = 'total'
  ) THEN
    ALTER TABLE vendas ADD COLUMN total decimal(10,2) DEFAULT 0.00 NOT NULL;
    
    -- Update existing records to calculate total
    UPDATE vendas SET total = quantidade * preco_unitario WHERE total = 0.00 OR total IS NULL;
  END IF;
END $$;

-- Ensure the column has the correct constraints
ALTER TABLE vendas ALTER COLUMN total SET NOT NULL;
ALTER TABLE vendas ALTER COLUMN total SET DEFAULT 0.00;