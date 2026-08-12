import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isPushConfigured, sendPushNotification } from '@/lib/push'
import { workoutAnswerFromValue } from '@/lib/workout-day'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function localParts(timeZone: string, date = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  }
}

function authorize(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization')
  return header === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(request: NextRequest) {
  try {
    if (!authorize(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isPushConfigured()) {
      return NextResponse.json({ ok: true, skipped: 'push_not_configured' })
    }

    const admin = createAdminClient()
    const { data: profiles, error } = await admin
      .from('profiles')
      .select(
        'user_id, timezone, workout_reminder_enabled, workout_reminder_time, workout_reminder_last_sent'
      )
      .eq('workout_reminder_enabled', true)

    if (error) throw error

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/goal'
    let sent = 0
    let skipped = 0

    for (const profile of profiles || []) {
      const tz = profile.timezone || 'UTC'
      const reminderTime = (profile.workout_reminder_time || '18:00').slice(0, 5)
      const local = localParts(tz)

      const [rh, rm] = reminderTime.split(':').map((n: string) => Number(n) || 0)
      const [lh, lm] = local.time.split(':').map((n: string) => Number(n) || 0)
      const reminderMinutes = rh * 60 + rm
      const localMinutes = lh * 60 + lm
      // Cron runs every 15 minutes — fire once in the reminder's 15-minute slot.
      if (localMinutes < reminderMinutes || localMinutes >= reminderMinutes + 15) {
        skipped++
        continue
      }

      if (profile.workout_reminder_last_sent === local.date) {
        skipped++
        continue
      }

      const { data: checkin } = await admin
        .from('checkins')
        .select('value_json')
        .eq('user_id', profile.user_id)
        .eq('date', local.date)
        .eq('type', 'workout')
        .maybeSingle()

      if (workoutAnswerFromValue(checkin?.value_json) != null) {
        skipped++
        continue
      }

      const { data: subs } = await admin
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', profile.user_id)

      if (!subs?.length) {
        skipped++
        continue
      }

      let delivered = false
      for (const sub of subs) {
        try {
          await sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            {
              title: 'Did you work out today?',
              body: 'Tap Yes or Rest — 2 seconds.',
              url: `${basePath}/dashboard`,
            }
          )
          delivered = true
        } catch (err: any) {
          const status = err?.statusCode
          if (status === 404 || status === 410) {
            await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
          } else {
            console.error('push send failed', err)
          }
        }
      }

      if (delivered) {
        await admin
          .from('profiles')
          .update({ workout_reminder_last_sent: local.date })
          .eq('user_id', profile.user_id)
        sent++
      }
    }

    return NextResponse.json({ ok: true, sent, skipped })
  } catch (error: any) {
    console.error('workout reminder cron failed', error)
    return NextResponse.json({ error: error.message || 'Failed' }, { status: 500 })
  }
}
