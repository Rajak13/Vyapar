import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Try to access a protected resource (user_profiles table)
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Verification required' }, { status: 403 })
    }

    // If we can access the data, verification is not required or user is verified
    return NextResponse.json({ verified: true, user_id: user.id })
    
  } catch (error) {
    console.error('Verification check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}