# Supabase Storage Setup Guide

This guide will help you set up the storage bucket required for receipt uploads in the expense management feature.

## Prerequisites

- Active Supabase project
- Admin access to your Supabase dashboard

## Quick Diagnostic

If you're getting upload errors, check these first:

1. ✅ **Bucket exists**: Go to Supabase Dashboard > Storage > Check "receipts" bucket exists
2. ✅ **Bucket is Public**: Click on receipts bucket > Configuration > "Public bucket" should be ON
3. ✅ **User is logged in**: Check browser console for authentication status
4. ✅ **Correct environment variables**: Check `.env.local` has valid Supabase URL and keys

**Most common issue**: Bucket exists but is NOT set to Public and has NO policies configured.

## Setup Steps

### 1. Create Storage Bucket

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **New bucket**
5. Configure the bucket:
   - **Name**: `receipts`
   - **Public bucket**: ✅ Enabled (for easy access to receipt images)
   - Click **Create bucket**

### 2. Configure Storage Policies

**IMPORTANT**: If your bucket is NOT set to Public, you MUST configure these policies.

#### Option A: Make Bucket Public (Easiest)

1. Go to Storage > receipts bucket
2. Click on "Configuration" or settings
3. Toggle "Public bucket" to ON
4. This allows anyone with the URL to view receipts (recommended for most use cases)

#### Option B: Use RLS Policies (More Secure)

If you want to keep the bucket private, add these policies in the SQL Editor:

**Allow Authenticated Users to Upload**

```sql
CREATE POLICY "Allow authenticated users to upload receipts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'receipts');
```

**Allow Users to Read Receipts**

```sql
CREATE POLICY "Allow users to read receipts"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'receipts');
```

**Allow Users to Update Receipts**

```sql
CREATE POLICY "Allow users to update receipts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'receipts');
```

**Allow Users to Delete Receipts**

```sql
CREATE POLICY "Allow users to delete receipts"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'receipts');
```

**Or use this all-in-one policy:**

```sql
-- Delete existing policies first (if any)
DROP POLICY IF EXISTS "Allow authenticated users to upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to read receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update receipts" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete receipts" ON storage.objects;

-- Create comprehensive policy
CREATE POLICY "Allow authenticated users full access to receipts"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'receipts')
WITH CHECK (bucket_id = 'receipts');
```

### 3. Verify Setup

To verify your storage bucket is working:

1. Go to the Expenses page in your application
2. Click "Record Expense"
3. Try uploading a receipt image
4. Check the browser console for any errors
5. If successful, you should see the receipt preview

### 4. Troubleshooting

#### Error: "Bucket not found" or "does not exist"

**Solution:**
- Ensure the bucket name is exactly `receipts` (lowercase, no spaces)
- Check that the bucket exists in your Supabase Storage dashboard
- Refresh your browser and try again

#### Error: "Permission denied" or "new row violates row-level security policy"

**This is the most common error!**

**Solution:**
1. **Quick Fix**: Set bucket to Public
   - Go to Storage > receipts bucket
   - Click Configuration/Settings
   - Enable "Public bucket"
   - Save changes

2. **Or** add RLS policies (see section 2 above)
   - Go to SQL Editor in Supabase
   - Run the all-in-one policy script
   - Make sure you're logged in to the app

3. **Verify user is authenticated**
   - Open browser console
   - Check if you're logged in
   - Try logging out and back in

#### Error: "JWT expired" or "Invalid JWT"

**Solution:**
- Log out and log back in
- Clear browser cache and cookies
- Check your `.env.local` has correct Supabase keys

#### Error: "File too large"

**Solution:**
- Maximum file size is 10MB per receipt
- Compress the image before uploading
- Use online tools like TinyPNG or ImageOptim

#### Upload succeeds but image doesn't display

**Solution:**
- Check that the bucket is set to **Public**
- Verify the public URL is being generated correctly
- Check browser console for CORS errors
- Try accessing the image URL directly in a new tab

#### Error: "Failed to fetch" or Network error

**Solution:**
- Check your internet connection
- Verify Supabase project is not paused
- Check Supabase status page: https://status.supabase.com
- Verify your `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`

## File Limits

- **Maximum file size**: 10MB per image
- **Maximum files per expense**: 3 receipts
- **Supported formats**: JPG, JPEG, PNG

## Storage Costs

Supabase provides:
- **Free tier**: 1GB storage
- **Pro tier**: 100GB storage included
- Additional storage available at competitive rates

Monitor your storage usage in the Supabase dashboard under **Settings > Usage**.

## Security Best Practices

1. **Enable RLS policies** instead of making the bucket fully public
2. **Validate file types** on the server side (already implemented in the app)
3. **Set file size limits** to prevent abuse (already implemented in the app)
4. **Regularly audit** uploaded files for inappropriate content
5. **Consider implementing** file scanning for malware if handling sensitive data

## Need Help?

If you encounter issues:
1. Check the browser console for detailed error messages
2. Review Supabase logs in the dashboard
3. Verify your environment variables are correctly set
4. Ensure your Supabase project is active and not paused
