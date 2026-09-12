import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all user data
    const [checkins, meals, workouts, photos, projects, goals] = await Promise.all([
      supabase.from('checkins').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('meals').select('*').eq('user_id', user.id).order('consumed_at', { ascending: false }),
      supabase.from('workouts').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('photos').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('projects').select('*').eq('user_id', user.id).order('week_start', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

    const exportData = {
      exported_at: new Date().toISOString(),
      user_id: user.id,
      email: user.email,
      data: {
        checkins: checkins.data || [],
        meals: meals.data || [],
        workouts: workouts.data || [],
        photos: photos.data || [],
        projects: projects.data || [],
        goals: goals.data || [],
      },
    }

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="goaltracker-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    })
  } catch (error: any) {
    console.error('Error exporting data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}

