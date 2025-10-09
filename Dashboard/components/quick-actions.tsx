import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Rocket, RefreshCw, BarChart3, Settings, BookOpen } from "lucide-react"

const actions = [
  {
    icon: Rocket,
    label: "Run Pilot Test",
    description: "Execute GB→PH cross-border",
    variant: "default" as const,
  },
  {
    icon: RefreshCw,
    label: "Switch Environment",
    description: "Simulator ↔ Live Sandbox",
    variant: "outline" as const,
  },
  {
    icon: BarChart3,
    label: "View Analytics",
    description: "Transaction metrics",
    variant: "outline" as const,
  },
  {
    icon: Settings,
    label: "Configure SDK",
    description: "Environment variables",
    variant: "outline" as const,
  },
  {
    icon: BookOpen,
    label: "Documentation",
    description: "Mintlify docs",
    variant: "outline" as const,
  },
]

export function QuickActions() {
  return (
    <Card>
      <div className="border-b border-border p-4">
        <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        <p className="text-sm text-muted-foreground mt-1">Common tasks and shortcuts</p>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <Button key={action.label} variant={action.variant} className="h-auto flex-col items-start gap-1 p-4">
            <div className="flex items-center gap-2 w-full">
              <action.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{action.label}</span>
            </div>
            <span className="text-xs text-muted-foreground">{action.description}</span>
          </Button>
        ))}
      </div>
    </Card>
  )
}
