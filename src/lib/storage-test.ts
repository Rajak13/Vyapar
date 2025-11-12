/**
 * Storage Diagnostic Tool
 * Use this to test your Supabase storage configuration
 */

import { createClient } from '@/lib/supabase/client'

export async function testStorageAccess() {
  const supabase = createClient()
  
  console.log('🔍 Testing Supabase Storage Access...')
  
  // Test 1: Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    console.error('❌ Authentication Error:', authError?.message || 'No user logged in')
    return {
      success: false,
      error: 'User not authenticated',
      details: authError
    }
  }
  
  console.log('✅ User authenticated:', user.email)
  
  // Test 2: List buckets
  try {
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message)
      return {
        success: false,
        error: 'Cannot list buckets',
        details: bucketsError
      }
    }
    
    console.log('✅ Available buckets:', buckets?.map(b => b.name))
    
    const receiptsBucket = buckets?.find(b => b.name === 'receipts')
    if (!receiptsBucket) {
      console.error('❌ "receipts" bucket not found')
      return {
        success: false,
        error: 'Receipts bucket does not exist'
      }
    }
    
    console.log('✅ Receipts bucket found:', receiptsBucket)
    
  } catch (error) {
    console.error('❌ Exception listing buckets:', error)
  }
  
  // Test 3: Try to upload a test file
  try {
    const testFile = new Blob(['test'], { type: 'text/plain' })
    const testFileName = `test-${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(testFileName, testFile, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Upload Error:', uploadError.message)
      console.error('Error details:', uploadError)
      return {
        success: false,
        error: 'Upload failed',
        details: uploadError,
        suggestion: getErrorSuggestion(uploadError.message)
      }
    }
    
    console.log('✅ Test upload successful:', uploadData)
    
    // Clean up test file
    await supabase.storage.from('receipts').remove([testFileName])
    console.log('✅ Test file cleaned up')
    
    return {
      success: true,
      message: 'Storage is configured correctly!'
    }
    
  } catch (error) {
    console.error('❌ Exception during upload test:', error)
    return {
      success: false,
      error: 'Upload test failed',
      details: error
    }
  }
}

function getErrorSuggestion(errorMessage: string): string {
  if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
    return 'The "receipts" bucket does not exist. Create it in Supabase Dashboard > Storage.'
  }
  
  if (errorMessage.includes('permission') || errorMessage.includes('policy')) {
    return 'Permission denied. You need to set up storage policies. See STORAGE_SETUP.md for instructions.'
  }
  
  if (errorMessage.includes('JWT') || errorMessage.includes('token')) {
    return 'Authentication issue. Try logging out and logging back in.'
  }
  
  if (errorMessage.includes('size') || errorMessage.includes('large')) {
    return 'File is too large. Maximum size is 10MB.'
  }
  
  return 'Check the browser console for more details and review STORAGE_SETUP.md'
}

// Export a function to run from browser console
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).testStorage = testStorageAccess
}
