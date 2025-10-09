import { Bell, ChevronDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export function DashboardHeader() {
  return (
    <header className="border-b border-border bg-muted/30">
      <div className="flex h-14 items-center gap-4 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-primary">
            <svg className="h-5 w-5 text-primary-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 8h20v2H2zm0 6h20v2H2z" />
              <path d="M4 4h16v16H4z" opacity="0.3" />
            </svg>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Visa Direct SDK</span>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              v2.0
            </Badge>
          </div>
        </div>

        <div className="ml-8 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Environment:</span>
          <Button variant="outline" size="sm" className="h-8 gap-2 bg-transparent">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm">Simulator</span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>

        <div className="ml-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">SDK Status:</span>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-600">TypeScript</span>
            <span className="h-2 w-2 rounded-full bg-green-500 ml-2" />
            <span className="text-xs font-medium text-green-600">Python</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search transactions..." className="h-9 w-64 pl-9" />
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center text-xs font-semibold text-primary-foreground">
              DV
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
