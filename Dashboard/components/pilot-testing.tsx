import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Rocket, CheckCircle2, Clock, AlertCircle } from "lucide-react"

const pilotTests = [
  {
    name: "Domestic Transaction",
    description: "US → US (USD → USD)",
    status: "completed",
    duration: "45ms",
    result: "success",
  },
  {
    name: "Cross-border Transaction",
    description: "GB → PH (GBP → PHP)",
    status: "completed",
    duration: "480ms",
    result: "success",
  },
  {
    name: "MVP Validation",
    description: "All 6 MVP must-haves",
    status: "completed",
    duration: "2.3s",
    result: "success",
  },
  {
    name: "PII Protection",
    description: "No-PII CI test",
    status: "completed",
    duration: "1.2s",
    result: "success",
  },
  {
    name: "Comprehensive Test Suite",
    description: "23/23 tests passing",
    status: "completed",
    duration: "5.1s",
    result: "success",
  },
]

export function PilotTesting() {
  return (
    <Card>
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Pilot Testing</h2>
            <p className="text-sm text-muted-foreground mt-1">Production-ready transaction testing</p>
          </div>
          <Button className="gap-2">
            <Rocket className="h-4 w-4" />
            Run All Tests
          </Button>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Test Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Test Progress</span>
            <span className="font-medium">5/5 Completed</span>
          </div>
          <Progress value={100} className="h-2" />
        </div>

        {/* Test Results */}
        <div className="space-y-3">
          {pilotTests.map((test, index) => (
            <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex-shrink-0">
                {test.result === "success" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : test.result === "failed" ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{test.name}</p>
                  <Badge 
                    variant="outline" 
                    className={
                      test.result === "success" 
                        ? "border-green-500 text-green-600 bg-green-500/10" 
                        : "border-red-500 text-red-600 bg-red-500/10"
                    }
                  >
                    {test.result}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{test.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Duration: {test.duration}</span>
                  <span>Status: {test.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Rocket className="h-3 w-3" />
            Run Domestic
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Rocket className="h-3 w-3" />
            Run Cross-border
          </Button>
        </div>

        {/* Test Summary */}
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• All MVP must-haves validated</p>
            <p>• PII protection working perfectly</p>
            <p>• Both TypeScript and Python SDKs tested</p>
            <p>• Production deployment ready</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
