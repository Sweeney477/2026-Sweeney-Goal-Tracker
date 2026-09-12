'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { EmptyState } from '@/components/empty-state'

interface WeightCheckin {
  date: string
  value: number
}

interface WeightChartProps {
  data: WeightCheckin[]
  unit?: string
}

export function WeightChart({ data, unit = 'lbs' }: WeightChartProps) {
  const chartData = useMemo(() => {
    return [...data]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((item) => ({
        iso: item.date,
        label: format(parseISO(item.date), 'MMM d'),
        weight: item.value,
      }))
  }, [data])

  if (chartData.length === 0) {
    return (
      <EmptyState
        className="h-64 border-0 bg-transparent py-8"
        title="No weight data yet"
        description="Log today’s weight to start your trend line."
      />
    )
  }

  const values = chartData.map((d) => d.weight)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const padding = Math.max(1, (max - min) * 0.15)

  return (
    <div className="h-[280px] w-full" role="img" aria-label={`Weight trend in ${unit}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            domain={[Math.floor(min - padding), Math.ceil(max + padding)]}
            tick={{ fontSize: 12 }}
            stroke="hsl(var(--muted-foreground))"
            width={40}
          />
          <Tooltip
            formatter={(value: number) => [`${value} ${unit}`, 'Weight']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.iso || ''}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="hsl(var(--brand))"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
