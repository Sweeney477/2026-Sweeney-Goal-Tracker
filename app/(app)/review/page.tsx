'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WeeklyReview } from '@/lib/types'
import { TrendingUp, AlertTriangle, Target } from 'lucide-react'

export default function ReviewPage() {
  const [review, setReview] = useState<WeeklyReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [days, setDays] = useState(7)

  const generateReview = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/weekly-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate review')
      }

      const data = await response.json()
      setReview(data.review)
    } catch (error) {
      console.error('Error generating review:', error)
      alert('Failed to generate review. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Weekly Review</h1>
          <p className="text-muted-foreground mt-1">
            Get AI-powered insights from your tracking data
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate Review</CardTitle>
            <CardDescription>
              Analyze your recent activity and get personalized recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Days to analyze (default: 7)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 7)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={generateReview} disabled={loading}>
              {loading ? 'Generating Review...' : 'Generate Weekly Review'}
            </Button>
          </CardContent>
        </Card>

        {review && (
          <div className="space-y-4">
            {review.wins && review.wins.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Wins
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {review.wins.map((win, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{win}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {review.risks && review.risks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    Risks & Concerns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {review.risks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {review.changes && review.changes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recommended Changes</CardTitle>
                  <CardDescription>
                    1-2 key changes to make next week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {review.changes.map((change, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {review.next_week_plan && review.next_week_plan.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Next Week Plan</CardTitle>
                  <CardDescription>Actionable steps for the upcoming week</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {review.next_week_plan.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {review.priority_goal && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-600" />
                    Priority Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg">{review.priority_goal}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


