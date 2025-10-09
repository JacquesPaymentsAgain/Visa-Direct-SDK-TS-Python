import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle } from "lucide-react"

const sdks = [
  {
    name: "TypeScript SDK",
    version: "v0.9.0-pilot",
    status: "healthy",
    uptime: "100%",
    requests: "1,234",
    avgResponse: "45ms",
  },
  {
    name: "Python SDK",
    version: "v0.9.0-pilot",
    status: "healthy",
    uptime: "100%",
    requests: "613",
    avgResponse: "52ms",
  },
]

export function SdkStatus() {
  return (
    <Card>
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold text-foreground">SDK Health Status</h2>
        <p className="text-sm text-muted-foreground mt-1">Monitor SDK performance and availability</p>
      </div>
      <div className="p-4 space-y-4">
        {sdks.map((sdk) => (
          <div key={sdk.name} className="flex items-start gap-4 p-3 rounded-lg bg-muted/50 border border-border">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm text-foreground">{sdk.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {sdk.version}
                </Badge>
                {sdk.status === "healthy" ? (
                  <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Healthy
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Issues
                  </Badge>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground">Uptime</p>
                  <p className="font-mono font-semibold mt-1 text-foreground">{sdk.uptime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Requests</p>
                  <p className="font-mono font-semibold mt-1 text-foreground">{sdk.requests}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Avg Response</p>
                  <p className="font-mono font-semibold mt-1 text-foreground">{sdk.avgResponse}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
