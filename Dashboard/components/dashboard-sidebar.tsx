import { Activity, Beaker, BarChart3, Settings, Rocket, BookOpen, Cog } from "lucide-react"

const navItems = [
  { icon: Activity, label: "Overview", active: true },
  { icon: Beaker, label: "Testing & Simulator" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Cog, label: "Configuration" },
  { icon: Rocket, label: "Deployment" },
  { icon: BookOpen, label: "Documentation" },
  { icon: Settings, label: "Settings" },
]

export function DashboardSidebar() {
  return (
    <aside className="w-56 border-r border-border bg-muted/30">
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              item.active
                ? "bg-primary text-primary-foreground font-medium"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
