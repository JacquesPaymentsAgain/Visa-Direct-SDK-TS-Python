import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const activities = [
  {
    transactionId: "9dacd561de130e1eed1eff1a",
    type: "Pilot Test",
    corridor: "US → US",
    status: "success",
    amount: "$50.01",
    duration: "45ms",
    time: "2 minutes ago",
  },
  {
    transactionId: "11286f543f6dde250bce947c",
    type: "Pilot Test",
    corridor: "GB → PH",
    status: "success",
    amount: "£25.00",
    duration: "480ms",
    time: "5 minutes ago",
  },
  {
    transactionId: "2f022258b6cc8d2456c05f6d",
    type: "Simulator Test",
    corridor: "US → US",
    status: "success",
    amount: "$50.00",
    duration: "45ms",
    time: "8 minutes ago",
  },
  {
    transactionId: "6d9beb98b9bb98264a513d29",
    type: "Card Payout",
    corridor: "US → US",
    status: "success",
    amount: "$50.00",
    duration: "45ms",
    time: "12 minutes ago",
  },
  {
    transactionId: "1c3f4de6ea7c99ee5a2cdc3d",
    type: "Account Payout",
    corridor: "US → US",
    status: "success",
    amount: "$50.00",
    duration: "45ms",
    time: "15 minutes ago",
  },
  {
    transactionId: "mvp-test-1760014050",
    type: "MVP Validation",
    corridor: "GB → PH",
    status: "success",
    amount: "£25.00",
    duration: "500ms",
    time: "18 minutes ago",
  },
]

export function ActivityTable() {
  return (
    <Card className="bg-card border-border">
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold">Recent Transactions</h2>
        <p className="text-sm text-muted-foreground mt-1">Live transaction feed from your SDK</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Transaction ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Corridor</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr key={index} className="border-b border-border last:border-0 hover:bg-accent/50 transition-colors">
                <td className="px-4 py-3 text-sm font-mono text-primary">{activity.transactionId}</td>
                <td className="px-4 py-3 text-sm">{activity.type}</td>
                <td className="px-4 py-3 text-sm font-mono">{activity.corridor}</td>
                <td className="px-4 py-3 text-sm">
                  <Badge
                    variant="outline"
                    className={
                      activity.status === "success"
                        ? "border-chart-2 text-chart-2 bg-chart-2/10"
                        : activity.status === "failed"
                          ? "border-chart-4 text-chart-4 bg-chart-4/10"
                          : "border-chart-3 text-chart-3 bg-chart-3/10"
                    }
                  >
                    {activity.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm font-mono font-semibold">{activity.amount}</td>
                <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{activity.duration}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{activity.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
