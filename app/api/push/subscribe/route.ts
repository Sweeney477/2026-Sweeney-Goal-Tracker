import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isPushConfigured } from '@/lib/push'

export async function POST(request: NextRequest) {
  try {
    if (!isPushConfigured()) {
      return NextResponse.json({ error: 'Push not configured' }, { status: 503 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const endpoint = body?.endpoint as string | undefined
    const p256dh = body?.keys?.p256dh as string | undefined
    const auth = body?.keys?.auth as string | undefined

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: request.headers.get('user-agent') || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,endpoint' }
    )

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('push subscribe error', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const endpoint = body?.endpoint as string | undefined

    let query = supabase.from('push_subscriptions').delete().eq('user_id', user.id)
    if (endpoint) query = query.eq('endpoint', endpoint)

    const { error } = await query
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('push unsubscribe error', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
