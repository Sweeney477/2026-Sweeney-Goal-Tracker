'use client'

import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'

interface WeightCheckin {
  date: string
  value: number
}

interface WeightChartProps {
  data: WeightCheckin[]
}

export function WeightChart({ data }: WeightChartProps) {
  const chartData = useMemo(() => {
    return data
      .map((item) => ({
        date: format(parseISO(item.date), 'MMM d'),
        weight: item.value,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No weight data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}


