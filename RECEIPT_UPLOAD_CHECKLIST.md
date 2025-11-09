# Receipt Upload Error - Quick Fix Checklist

## The Error You're Seeing

```
Failed to upload receipts. Please ensure the storage bucket is configured correctly.
```

## Most Likely Cause

**Your "receipts" bucket exists BUT is not configured for public access or doesn't have RLS policies.**

## Quick Fix (Choose One)

### Option 1: Make Bucket Public (Recommended - Takes 30 seconds)

1. Open Supabase Dashboard: https://app.supabase.com
2. Go to **Storage** (left sidebar)
3. Click on the **receipts** bucket
4. Look for **Configuration** or **Settings** button
5. Find the **"Public bucket"** toggle
6. Turn it **ON** ✅
7. Click **Save**
8. Go back to your app and try uploading again

### Option 2: Add RLS Policies (More Secure)

1. Open Supabase Dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Paste this code:

```sql
-- Allow authenticated users full access to receipts bucket
CREATE POLICY "Allow authenticated users full access to receipts"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'receipts')
WITH CHECK (bucket_id = 'receipts');
```

5. Click **Run**
6. Go back to your app and try uploading again

## Verify It's Working

1. Go to Expenses page
2. Click "Record Expense"
3. Upload a receipt image
4. You should see:
   - Image preview appears immediately
   - "Uploading receipts..." message
   - Success! No error dialog

## Still Not Working?

### Check These:

#### 1. Are you logged in?
- Open browser console (F12)
- Look for authentication errors
- Try logging out and back in

#### 2. Is the bucket name correct?
- Must be exactly `receipts` (lowercase)
- No spaces, no typos

#### 3. Check browser console
- Press F12 to open developer tools
- Go to Console tab
- Look for red error messages
- Share the error message for more help

#### 4. Verify environment variables
Open `.env.local` and check:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

#### 5. Check Supabase project status
- Is your project paused? (Free tier projects pause after inactivity)
- Go to Supabase Dashboard > Settings > General
- Click "Resume project" if needed

## Common Error Messages

### "Permission denied"
→ Bucket is not public AND no RLS policies configured
→ **Fix**: Use Option 1 or Option 2 above

### "Bucket not found"
→ Bucket doesn't exist or wrong name
→ **Fix**: Create bucket named exactly `receipts`

### "JWT expired"
→ Your login session expired
→ **Fix**: Log out and log back in

### "File too large"
→ Image is over 10MB
→ **Fix**: Compress the image first

## Test Your Setup

After fixing, test with these steps:

1. ✅ Click "Record Expense"
2. ✅ Click "Choose Files" 
3. ✅ Select a small image (under 1MB)
4. ✅ See preview appear
5. ✅ Fill in expense details
6. ✅ Click "Record Expense"
7. ✅ Should save without errors
8. ✅ Receipt should appear in expense list

## Need More Help?

1. Check `STORAGE_SETUP.md` for detailed instructions
2. Check browser console for specific error messages
3. Verify all steps in this checklist
4. Make sure Supabase project is active (not paused)

## Screenshot Your Error

If still having issues, take screenshots of:
1. The error message in the app
2. Browser console (F12 > Console tab)
3. Supabase Storage > receipts bucket configuration
4. Supabase Storage > receipts bucket policies (if using RLS)
