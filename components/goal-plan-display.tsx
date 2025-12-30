'use client'

import { TrackingPlan } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface GoalPlanDisplayProps {
  plan: TrackingPlan
}

export function GoalPlanDisplay({ plan }: GoalPlanDisplayProps) {
  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-lg">Tracking Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {plan.lagging_metric && (
          <div>
            <div className="text-sm font-medium mb-1">Lagging Metric</div>
            <div className="text-muted-foreground">{plan.lagging_metric}</div>
          </div>
        )}
        {plan.leading_metrics && plan.leading_metrics.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Leading Metrics</div>
            <div className="flex flex-wrap gap-2">
              {plan.leading_metrics.map((metric, idx) => (
                <Badge key={idx} variant="secondary">
                  {metric}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {plan.cadence && (
          <div>
            <div className="text-sm font-medium mb-1">Cadence</div>
            <Badge>{plan.cadence}</Badge>
          </div>
        )}
        {plan.checkin_types && plan.checkin_types.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Check-in Types</div>
            <div className="flex flex-wrap gap-2">
              {plan.checkin_types.map((type, idx) => (
                <Badge key={idx} variant="outline">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {plan.minimum_viable_day && (
          <div>
            <div className="text-sm font-medium mb-1">Minimum Viable Day</div>
            <div className="text-muted-foreground">{plan.minimum_viable_day}</div>
          </div>
        )}
        {plan.reminder_suggestions && plan.reminder_suggestions.length > 0 && (
          <div>
            <div className="text-sm font-medium mb-2">Reminder Suggestions</div>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {plan.reminder_suggestions.map((reminder, idx) => (
                <li key={idx}>{reminder}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


