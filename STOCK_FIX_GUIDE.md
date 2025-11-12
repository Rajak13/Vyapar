# Stock Double Deduction Fix Guide

## The Problem
Stock is being deducted **twice** when making a sale because:
1. The `process_sale_robust` function manually updates stock
2. A database trigger also updates stock automatically

## The Solution
Run the SQL fix to remove duplicate functions and let triggers handle stock updates properly.

## Step-by-Step Fix

### 1. Run the SQL Fix
Open your Supabase SQL Editor and run **FIX_FUNCTION_CONFLICT.sql**

This will:
- ✅ Remove all duplicate function versions
- ✅ Create one clean function that validates stock but doesn't update it
- ✅ Let the existing triggers handle stock updates properly

### 2. Test the Fix
1. Pick a product with known stock (e.g., 10 units)
2. Add 1 item to cart and complete the sale
3. Check the product stock - it should be 9 (not 8!)

### 3. Verify in Database
Run this query to check:
```sql
-- Check a specific product
SELECT 
  p.name,
  p.current_stock,
  COUNT(it.id) as transaction_count
FROM products p
LEFT JOIN inventory_transactions it ON it.product_id = p.id
WHERE p.id = 'your-product-id'
GROUP BY p.id, p.name, p.current_stock;
```

## How This Works Now

### Before (BROKEN):
```
Sale → Function updates stock (-1) → Trigger fires → Updates stock again (-1) = -2 total ❌
```

### After (FIXED):
```
Sale → Function validates only → Trigger fires → Updates stock (-1) = -1 total ✅
```

## Debugging Future Issues

### Check for duplicate functions:
```sql
SELECT routine_name, COUNT(*) 
FROM information_schema.routines 
WHERE routine_name LIKE '%process_sale%' 
GROUP BY routine_name 
HAVING COUNT(*) > 1;
```

### Check active triggers:
```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('sales', 'inventory_transactions');
```

### Monitor stock changes:
```sql
-- See all recent inventory transactions
SELECT 
  it.timestamp,
  p.name,
  it.transaction_type,
  it.quantity,
  it.reference_type,
  it.notes
FROM inventory_transactions it
JOIN products p ON p.id = it.product_id
ORDER BY it.timestamp DESC
LIMIT 20;
```

## Key Lessons for Future Debugging

1. **Look for duplicate operations** - Same action happening in multiple places
2. **Check both functions AND triggers** - They can both modify data
3. **Use transactions for testing** - Wrap tests in BEGIN/ROLLBACK to avoid messing up data
4. **Add logging** - Use RAISE NOTICE in functions to see what's happening
5. **Verify with queries** - Always check the database directly, not just the UI

## Common Patterns That Cause Issues

- ❌ Function updates stock + Trigger updates stock = Double update
- ❌ Multiple triggers on same table doing similar things
- ❌ Frontend code + Backend code both updating same field
- ❌ Cascading updates that loop back

## Best Practice

**Choose ONE mechanism for each operation:**
- Use **triggers** for automatic, consistent operations (like stock updates)
- Use **functions** for complex business logic and validation
- Don't mix both for the same operation!
