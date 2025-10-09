import { AppSidebar } from '@/components/app-sidebar'
import { DashboardHeader } from '@/components/dashboard-header'
import { MetricsGrid } from '@/components/metrics-grid'
import { QuickActions } from '@/components/quick-actions'
import { SdkStatus } from '@/components/sdk-status'
import { ActivityTable } from '@/components/activity-table'
import { EnvironmentControl } from '@/components/environment-control'
import { PilotTesting } from '@/components/pilot-testing'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Visa Direct SDK
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Key Metrics */}
          <div className="space-y-4">
            <div>
              <h1 className="text-heading-lg text-foreground">Overview Dashboard</h1>
              <p className="text-body-sm text-muted-foreground">Monitor your Visa Direct SDK performance and transactions</p>
            </div>
            <MetricsGrid />
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-4">
            {/* Left Column - Quick Actions & SDK Status */}
            <div className="space-y-6">
              <QuickActions />
              <SdkStatus />
            </div>

            {/* Middle Column - Environment & Pilot Testing */}
            <div className="space-y-6">
              <EnvironmentControl />
              <PilotTesting />
            </div>

            {/* Right Column - Recent Activity */}
            <div className="lg:col-span-2">
              <ActivityTable />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
