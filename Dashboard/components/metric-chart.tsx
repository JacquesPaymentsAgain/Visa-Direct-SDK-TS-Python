"use client"

import { Line, LineChart, ResponsiveContainer } from "recharts"

interface MetricChartProps {
  data: number[]
}

export function MetricChart({ data }: MetricChartProps) {
  const chartData = data.map((value, index) => ({
    value,
    index,
  }))

  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="value" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
