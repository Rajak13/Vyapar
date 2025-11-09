# 🚀 QUICK FIX - Receipt Upload Error

## The Problem
You created the "receipts" bucket but uploads are failing.

## The Solution (30 seconds)

### Step 1: Open Supabase Dashboard
Go to: https://app.supabase.com

### Step 2: Navigate to Storage
Click **Storage** in the left sidebar

### Step 3: Click on "receipts" bucket
You should see it in the list

### Step 4: Make it Public
Look for one of these:
- A toggle switch labeled **"Public bucket"**
- A **Configuration** or **Settings** button
- A **Policies** tab

### Step 5: Enable Public Access
- If you see a toggle: Turn it **ON** ✅
- If you see settings: Enable **"Public bucket"** ✅
- Click **Save** or **Update**

### Step 6: Test
Go back to your app and try uploading a receipt again!

---

## Why This Works

When you create a bucket in Supabase, it's **private by default**. This means:
- ❌ No one can upload files
- ❌ No one can view files
- ❌ Even authenticated users are blocked

Making it **public** means:
- ✅ Authenticated users can upload
- ✅ Anyone with the URL can view (which is what you want for receipts)
- ✅ Files are still secure (URLs are hard to guess)

---

## Alternative: Use RLS Policies Instead

If you don't want the bucket to be public, you need to add policies:

1. Go to **SQL Editor** in Supabase
2. Run this:

```sql
CREATE POLICY "Allow authenticated users full access to receipts"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'receipts')
WITH CHECK (bucket_id = 'receipts');
```

3. Click **Run**

---

## Still Getting Errors?

Check the browser console (F12) and look for:

- **"Permission denied"** → Bucket not public, no policies
- **"Bucket not found"** → Bucket name is wrong (must be exactly "receipts")
- **"JWT expired"** → Log out and log back in
- **"File too large"** → Image over 10MB, compress it first

---

## Visual Checklist

```
Supabase Dashboard
  └─ Storage
      └─ receipts (bucket)
          └─ Configuration
              └─ Public bucket: [X] ON  ← This must be checked!
```

---

That's it! Your receipts should now upload successfully. 🎉
