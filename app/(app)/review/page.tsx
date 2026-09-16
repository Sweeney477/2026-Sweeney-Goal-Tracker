import { createClient } from '@/lib/supabase/server'
import { WeeklyRitualFlow } from '@/components/review/weekly-ritual-flow'
import { resolveTimezone } from '@/lib/dates'
import { currentRitualWeekStart } from '@/lib/review/weekly-ritual'

export default async function ReviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('user_id', user.id)
    .maybeSingle()

  const timeZone = resolveTimezone(profile?.timezone)
  const weekStart = currentRitualWeekStart(timeZone)

  return (
    <WeeklyRitualFlow userId={user.id} timeZone={timeZone} weekStart={weekStart} />
  )
}
