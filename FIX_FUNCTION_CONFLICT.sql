-- ============================================
-- QUICK FIX: Resolve function conflict error
-- ============================================
-- Error: "Could not choose the best candidate function"
-- This happens when multiple versions of the same function exist
-- ============================================

-- Step 1: Drop ALL versions of process_sale_robust
-- ============================================
DROP FUNCTION IF EXISTS process_sale_robust(UUID, TEXT, DATE, JSONB, DECIMAL, DECIMAL, DECIMAL, TEXT, UUID);
DROP FUNCTION IF EXISTS process_sale_robust(UUID, VARCHAR, DATE, JSONB, DECIMAL, DECIMAL, DECIMAL, payment_method, UUID);
DROP FUNCTION IF EXISTS process_sale_robust(UUID, TEXT, DATE, JSONB, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID);
DROP FUNCTION IF EXISTS process_sale_robust(UUID, VARCHAR, DATE, JSONB, NUMERIC, NUMERIC, NUMERIC, payment_method, UUID);

-- Also drop any other sale processing functions that might conflict
DROP FUNCTION IF EXISTS process_sale(UUID, TEXT, DATE, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS process_sale_simple(UUID, TEXT, DATE, JSONB, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS process_sale_fixed(UUID, TEXT, DATE, JSONB, NUMERIC, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS process_sale_working(UUID, TEXT, DATE, JSONB, NUMERIC, NUMERIC, NUMERIC, TEXT, UUID);

-- Step 2: Create ONE clean version (without manual stock update)
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
  -- Validate stock availability ONLY (don't update - let trigger handle it)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::UUID;
    v_quantity := (v_item->>'quantity')::INTEGER;
    
    -- Get and lock product for validation
    SELECT current_stock, name INTO v_current_stock, v_product_name
    FROM products 
    WHERE id = v_product_id AND business_id = p_business_id
    FOR UPDATE;
    
    -- Check if product exists
    IF v_current_stock IS NULL THEN
      RAISE EXCEPTION 'Product not found: %', v_product_id;
    END IF;
    
    -- Check stock availability
    IF v_current_stock < v_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Required: %', 
        v_product_name, v_current_stock, v_quantity;
    END IF;
    
    -- IMPORTANT: We do NOT update stock here!
    -- The trigger 'trigger_create_sale_inventory_transactions' will:
    -- 1. Create inventory_transactions when sale is inserted
    -- 2. Which triggers 'trigger_update_product_stock' to update the stock
  END LOOP;
  
  -- Insert sale (cast payment_method to the enum type)
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
  
  -- Insert payment
  INSERT INTO payments (
    sale_id, 
    amount, 
    payment_method, 
    payment_date
  ) VALUES (
    v_sale_id, 
    p_total_amount, 
    p_payment_method, 
    p_sale_date
  ) RETURNING id INTO v_payment_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'payment_id', v_payment_id,
    'invoice_number', p_invoice_number
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in process_sale_robust: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RAISE;
END;
$$;

-- Step 3: Verify only one version exists
-- ============================================
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name LIKE '%process_sale%'
  AND routine_schema = 'public'
ORDER BY routine_name;

-- You should see only ONE process_sale_robust function

-- Step 4: Verify triggers are in place
-- ============================================
SELECT 
  trigger_name, 
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('sales', 'inventory_transactions')
  AND trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Expected triggers:
-- 1. trigger_create_sale_inventory_transactions (AFTER INSERT on sales)
-- 2. trigger_update_product_stock (AFTER INSERT on inventory_transactions)

-- ============================================
-- DONE! Now test your POS system
-- ============================================
-- The error should be resolved and stock should only decrease once per sale
