import { Card } from "@/components/ui/card"
import { MetricChart } from "@/components/metric-chart"
import { ArrowDown, ArrowUp, Activity } from "lucide-react"

const metrics = [
  {
    title: "Total Transactions",
    value: "2,847",
    change: "+15.2%",
    trend: "up",
    data: [2100, 2200, 2300, 2400, 2500, 2600, 2700, 2750, 2800, 2820, 2840, 2847],
  },
  {
    title: "Success Rate",
    value: "99.8%",
    change: "+0.1%",
    trend: "up",
    data: [99.5, 99.6, 99.7, 99.6, 99.7, 99.8, 99.7, 99.8, 99.9, 99.8, 99.8, 99.8],
  },
  {
    title: "Avg Response Time",
    value: "45ms",
    change: "-5ms",
    trend: "down",
    data: [55, 52, 50, 48, 47, 46, 45, 44, 45, 44, 45, 45],
  },
  {
    title: "Pilot Tests",
    value: "23/23",
    change: "100%",
    trend: "up",
    data: [18, 19, 20, 21, 22, 22, 23, 23, 23, 23, 23, 23],
  },
]

export function MetricsGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title} className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{metric.title}</p>
              <p className="mt-2 text-2xl font-semibold font-mono text-foreground">{metric.value}</p>
              <div className="mt-2 flex items-center gap-1 text-xs">
                {metric.trend === "up" ? (
                  <ArrowUp className="h-3 w-3 text-chart-2" />
                ) : (
                  <ArrowDown className="h-3 w-3 text-chart-2" />
                )}
                <span className="text-chart-2 font-medium">{metric.change}</span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            </div>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <MetricChart data={metric.data} />
          </div>
        </Card>
      ))}
    </div>
  )
}
