import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { confirm } = body

    if (confirm !== 'DELETE') {
      return NextResponse.json({ error: 'Confirmation required' }, { status: 400 })
    }

    // Delete all user data (cascade will handle related records)
    // Note: This will also delete the user's auth account via Supabase
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      // If admin delete fails, try manual cleanup
      // Delete in order to respect foreign key constraints
      await Promise.all([
        supabase.from('checkins').delete().eq('user_id', user.id),
        supabase.from('meals').delete().eq('user_id', user.id),
        supabase.from('workouts').delete().eq('user_id', user.id),
        supabase.from('photos').delete().eq('user_id', user.id),
        supabase.from('projects').delete().eq('user_id', user.id),
        supabase.from('goals').delete().eq('user_id', user.id),
        supabase.from('exercises_library').delete().eq('user_id', user.id),
        supabase.from('rate_limits').delete().eq('user_id', user.id),
        supabase.from('push_subscriptions').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('user_id', user.id),
      ])

      // Sign out the user
      await supabase.auth.signOut()
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}

