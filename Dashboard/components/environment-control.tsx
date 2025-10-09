import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Settings, Play, Pause, RefreshCw } from "lucide-react"

export function EnvironmentControl() {
  return (
    <Card>
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold text-foreground">Environment Control</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage simulator and live environments</p>
      </div>
      <div className="p-4 space-y-4">
        {/* Current Environment */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
            <div>
              <p className="font-semibold text-sm">Simulator</p>
              <p className="text-xs text-muted-foreground">http://127.0.0.1:8766</p>
            </div>
          </div>
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Active
          </Badge>
        </div>

        {/* Simulator Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Simulator Status</span>
            </div>
            <div className="flex items-center gap-2">
              <Switch defaultChecked />
              <span className="text-xs text-muted-foreground">Running</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Endpoints</span>
            </div>
            <Badge variant="outline" className="text-xs">
              11/11 Healthy
            </Badge>
          </div>
        </div>

        {/* Environment Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-3 w-3" />
            Switch to Live
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-3 w-3" />
            Configure
          </Button>
        </div>

        {/* Environment Info */}
        <div className="pt-2 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• 11 API endpoints available</p>
            <p>• Deterministic responses</p>
            <p>• No rate limits</p>
            <p>• Perfect for development</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
