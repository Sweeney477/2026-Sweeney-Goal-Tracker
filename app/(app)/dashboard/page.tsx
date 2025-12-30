import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { Plus, TrendingUp } from 'lucide-react'
import { WeightChart } from '@/components/weight-chart'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const today = format(new Date(), 'yyyy-MM-dd')

  // Get today's check-ins
  const { data: todayCheckins } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('date', today)

  // Get weight check-ins for streak calculation
  const { data: weightCheckins } = await supabase
    .from('checkins')
    .select('date')
    .eq('user_id', user.id)
    .eq('type', 'weight')
    .order('date', { ascending: false })
    .limit(30)

  // Calculate current streak (consecutive days with weight logged)
  let streak = 0
  if (weightCheckins && weightCheckins.length > 0) {
    const sortedDates = weightCheckins.map((c) => c.date).sort().reverse()
    let currentDate = new Date(today)
    for (const dateStr of sortedDates) {
      const checkDate = new Date(dateStr)
      if (format(currentDate, 'yyyy-MM-dd') === dateStr) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // Get latest weight
  const { data: latestWeight } = await supabase
    .from('checkins')
    .select('value_json')
    .eq('user_id', user.id)
    .eq('type', 'weight')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  // Get weight data for chart (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: weightData } = await supabase
    .from('checkins')
    .select('date, value_json')
    .eq('user_id', user.id)
    .eq('type', 'weight')
    .gte('date', format(thirtyDaysAgo, 'yyyy-MM-dd'))
    .order('date', { ascending: true })

  const chartData =
    weightData?.map((item) => ({
      date: item.date,
      value: item.value_json?.value || 0,
    })) || []

  // Get active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Check-in</CardTitle>
            <CardDescription>
              Quick access to log your daily metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <Link href="/check-ins?type=weight">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <span className="text-2xl font-bold">
                    {latestWeight?.value_json?.value
                      ? `${latestWeight.value_json.value} lbs`
                      : '—'}
                  </span>
                  <span className="text-xs">Weight</span>
                </Button>
              </Link>
              <Link href="/check-ins?type=steps">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <span className="text-2xl font-bold">
                    {todayCheckins?.find((c) => c.type === 'steps')?.value_json
                      ?.value || '—'}
                  </span>
                  <span className="text-xs">Steps</span>
                </Button>
              </Link>
              <Link href="/check-ins?type=calories">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <span className="text-2xl font-bold">
                    {todayCheckins?.find((c) => c.type === 'calories')?.value_json
                      ?.value || '—'}
                  </span>
                  <span className="text-xs">Calories</span>
                </Button>
              </Link>
              <Link href="/check-ins?type=coding_minutes">
                <Button variant="outline" className="w-full h-20 flex-col">
                  <span className="text-2xl font-bold">
                    {todayCheckins?.find((c) => c.type === 'coding_minutes')?.value_json
                      ?.value || '—'}
                  </span>
                  <span className="text-xs">Coding</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weight Trend</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <WeightChart data={chartData} />
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Streak</CardTitle>
              <CardDescription>Consecutive days with weight logged</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold">{streak}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm">Keep it up!</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Goals</CardTitle>
              <CardDescription>Your current goals</CardDescription>
            </CardHeader>
            <CardContent>
              {goals && goals.length > 0 ? (
                <div className="space-y-2">
                  {goals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="text-sm">
                      <div className="font-medium">{goal.title}</div>
                      <div className="text-muted-foreground text-xs">
                        {goal.category}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No active goals yet
                </div>
              )}
              <Link href="/goals">
                <Button variant="ghost" className="w-full mt-4" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
