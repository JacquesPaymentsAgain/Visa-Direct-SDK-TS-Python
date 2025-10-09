import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MetricsGrid } from "@/components/metrics-grid"
import { QuickActions } from "@/components/quick-actions"
import { SdkStatus } from "@/components/sdk-status"
import { ActivityTable } from "@/components/activity-table"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-balance">Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor your Visa Direct SDK performance and transaction metrics
            </p>
          </div>

          <MetricsGrid />

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <SdkStatus />
            <QuickActions />
          </div>

          <div className="mt-6">
            <ActivityTable />
          </div>
        </main>
      </div>
    </div>
  )
}
