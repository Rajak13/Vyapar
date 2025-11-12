-- ============================================
-- Add trigger to restore stock when sale is deleted
-- ============================================
-- This ensures stock is properly restored when you delete a sale
-- ============================================

-- Step 1: Create function to restore stock on sale deletion
-- ============================================
CREATE OR REPLACE FUNCTION restore_stock_on_sale_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
BEGIN
  -- Loop through each item in the deleted sale
  FOR v_item IN SELECT * FROM jsonb_array_elements(OLD.items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Create a reverse inventory transaction (type 'in' to add stock back)
    INSERT INTO inventory_transactions (
      product_id,
      transaction_type,
      quantity,
      reference_id,
      reference_type,
      unit_cost,
      notes
    ) VALUES (
      v_product_id,
      'in',
      v_quantity,
      OLD.id,
      'sale_deletion',
      (v_item->>'unit_price')::NUMERIC,
      'Stock restored from deleted sale: ' || OLD.invoice_number
    );
    
    -- The trigger_update_product_stock will automatically update the stock
  END LOOP;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger on sales table
-- ============================================
DROP TRIGGER IF EXISTS trigger_restore_stock_on_sale_delete ON sales;

CREATE TRIGGER trigger_restore_stock_on_sale_delete
BEFORE DELETE ON sales
FOR EACH ROW
EXECUTE FUNCTION restore_stock_on_sale_delete();

-- Step 3: Verify the trigger was created
-- ============================================
SELECT 
  trigger_name, 
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_restore_stock_on_sale_delete'
  AND trigger_schema = 'public';

-- ============================================
-- How it works:
-- ============================================
-- When you delete a sale:
-- 1. This trigger fires BEFORE the sale is deleted
-- 2. It creates 'in' type inventory transactions for each item
-- 3. The existing trigger_update_product_stock updates the stock
-- 4. Stock is restored automatically!
--
-- Example:
-- - Product had 10 units
-- - Sale of 2 units → Stock becomes 8
-- - Delete sale → Stock restored to 10
-- ============================================
