-- ============================================
-- FIX: Stock being deducted twice on sales
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Drop ALL existing versions of the function to avoid conflicts
-- ============================================
DROP FUNCTION IF EXISTS process_sale_robust(UUID, TEXT, DATE, JSONB, DECIMAL, DECIMAL, DECIMAL, TEXT, UUID);
DROP FUNCTION IF EXISTS process_sale_robust(UUID, VARCHAR, DATE, JSONB, DECIMAL, DECIMAL, DECIMAL, payment_method, UUID);
DROP FUNCTION IF EXISTS process_sale_robust(UUID, TEXT, DATE, JSONB, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID);
DROP FUNCTION IF EXISTS process_sale_robust(UUID, VARCHAR, DATE, JSONB, NUMERIC, NUMERIC, NUMERIC, payment_method, UUID);

-- Step 2: Create ONE clean version that handles stock correctly
-- This version validates stock but lets triggers handle the actual update
-- ============================================

CREATE FUNCTION process_sale_robust(
  p_business_id UUID,
  p_invoice_number TEXT,
  p_sale_date DATE,
  p_items JSONB,
  p_subtotal NUMERIC(10,2),
  p_discount NUMERIC(10,2),
  p_total_amount NUMERIC(10,2),
  p_payment_method TEXT,
  p_customer_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id UUID;
  v_payment_id UUID;
  v_item JSONB;
  v_product_id UUID;
  v_quantity INTEGER;
  v_current_stock INTEGER;
  v_product_name TEXT;
BEGIN
  -- Validate stock availability (but don't update yet - let trigger handle it)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Get and lock product for validation
    SELECT current_stock, name INTO v_current_stock, v_product_name
    FROM products 
    WHERE id = v_product_id AND business_id = p_business_id
    FOR UPDATE;
    
    -- Check stock availability
    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Required: %', 
        v_product_name, v_current_stock, v_quantity;
    END IF;
    
    -- NOTE: We're NOT updating stock here anymore!
    -- The trigger will handle stock updates via inventory_transactions
  END LOOP;
  
  -- Insert sale with customer_id (cast payment_method to enum type)
  INSERT INTO sales (
    business_id, 
    customer_id, 
    invoice_number, 
    sale_date, 
    items,
    subtotal, 
    discount, 
    tax, 
    total_amount,
    payment_method,
    payment_status
  ) VALUES (
    p_business_id, 
    p_customer_id, 
    p_invoice_number, 
    p_sale_date, 
    p_items,
    p_subtotal, 
    p_discount, 
    0, 
    p_total_amount,
    p_payment_method::payment_method,
    'paid'
  ) RETURNING id INTO v_sale_id;
  
  -- Insert payment (cast payment_method to enum type)
  INSERT INTO payments (
    sale_id, 
    amount, 
    payment_method, 
    payment_date
  ) VALUES (
    v_sale_id, 
    p_total_amount, 
    p_payment_method::payment_method, 
    p_sale_date
  ) RETURNING id INTO v_payment_id;
  
  -- The trigger 'trigger_create_sale_inventory_transactions' will now:
  -- 1. Create inventory_transactions records for each item
  -- 2. Which triggers 'trigger_update_product_stock' to update stock
  
  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'payment_id', v_payment_id,
    'invoice_number', p_invoice_number
  );
END;
$$;

-- ============================================
-- Step 3: Verify triggers are working correctly
-- ============================================

-- Check that these triggers exist and are enabled:
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table IN ('sales', 'inventory_transactions')
  AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- If trigger_create_sale_inventory_transactions doesn't exist, create it:
-- (This trigger creates inventory transactions when a sale is inserted)

-- CREATE OR REPLACE FUNCTION create_sale_inventory_transactions()
-- RETURNS TRIGGER AS $$
-- DECLARE
--   v_item JSONB;
-- BEGIN
--   -- Create inventory transaction for each item in the sale
--   FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
--   LOOP
--     INSERT INTO inventory_transactions (
--       product_id,
--       transaction_type,
--       quantity,
--       reference_id,
--       reference_type,
--       unit_cost,
--       notes
--     ) VALUES (
--       (v_item->>'product_id')::UUID,
--       'out',
--       (v_item->>'quantity')::INTEGER,
--       NEW.id,
--       'sale',
--       (v_item->>'unit_price')::NUMERIC,
--       'Sale: ' || NEW.invoice_number
--     );
--   END LOOP;
--   
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER trigger_create_sale_inventory_transactions
-- AFTER INSERT ON sales
-- FOR EACH ROW
-- EXECUTE FUNCTION create_sale_inventory_transactions();

-- ============================================
-- Step 4: Test the fix
-- ============================================

-- After running the fix, test with a product:
-- 1. Note the current stock of a product
-- 2. Make a sale through POS
-- 3. Verify stock decreased by the correct amount (not double)
-- 4. Check inventory_transactions table for the audit trail

-- Query to check stock and recent transactions:
-- SELECT 
--   p.name,
--   p.current_stock,
--   (SELECT COUNT(*) FROM inventory_transactions WHERE product_id = p.id AND transaction_type = 'out') as total_sales
-- FROM products p
-- WHERE p.id = 'your-product-id';

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- If stock is still being deducted twice, check if there are multiple triggers:
-- SELECT trigger_name, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
-- AND (action_statement LIKE '%stock%' OR action_statement LIKE '%inventory%');

-- If you see duplicate triggers, drop them:
-- DROP TRIGGER IF EXISTS duplicate_trigger_name ON table_name;
