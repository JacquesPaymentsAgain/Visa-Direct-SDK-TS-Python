import * as React from "react"

import { SearchForm } from '@/components/search-form'
import { VersionSwitcher } from '@/components/version-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

// Visa Direct SDK Dashboard Navigation
const data = {
  versions: ["v2.1.4", "v2.1.3", "v2.0.0"],
  navMain: [
    {
      title: "🏠 Overview",
      url: "/dashboard",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          isActive: true,
        },
        {
          title: "Quick Actions",
          url: "/dashboard/quick-actions",
        },
        {
          title: "Recent Activity",
          url: "/dashboard/activity",
        },
      ],
    },
    {
      title: "🧪 Testing & Simulator",
      url: "/dashboard/testing",
      items: [
        {
          title: "Simulator Control",
          url: "/dashboard/testing/simulator",
        },
        {
          title: "Pilot Testing",
          url: "/dashboard/testing/pilot",
        },
        {
          title: "Environment Switch",
          url: "/dashboard/testing/environment",
        },
        {
          title: "Test Scenarios",
          url: "/dashboard/testing/scenarios",
        },
      ],
    },
    {
      title: "📊 Analytics & Monitoring",
      url: "/dashboard/analytics",
      items: [
        {
          title: "Transaction Analytics",
          url: "/dashboard/analytics/transactions",
        },
        {
          title: "SDK Performance",
          url: "/dashboard/analytics/performance",
        },
        {
          title: "Real-time Monitoring",
          url: "/dashboard/analytics/monitoring",
        },
        {
          title: "Error Analysis",
          url: "/dashboard/analytics/errors",
        },
      ],
    },
    {
      title: "⚙️ Configuration",
      url: "/dashboard/configuration",
      items: [
        {
          title: "SDK Settings",
          url: "/dashboard/configuration/sdk",
        },
        {
          title: "Corridor Policies",
          url: "/dashboard/configuration/policies",
        },
        {
          title: "Security Settings",
          url: "/dashboard/configuration/security",
        },
        {
          title: "Certificates",
          url: "/dashboard/configuration/certificates",
        },
      ],
    },
    {
      title: "🚀 Deployment",
      url: "/dashboard/deployment",
      items: [
        {
          title: "Deployment Pipeline",
          url: "/dashboard/deployment/pipeline",
        },
        {
          title: "Production Readiness",
          url: "/dashboard/deployment/readiness",
        },
        {
          title: "Health Checks",
          url: "/dashboard/deployment/health",
        },
        {
          title: "Rollback",
          url: "/dashboard/deployment/rollback",
        },
      ],
    },
    {
      title: "📚 Documentation",
      url: "/dashboard/docs",
      items: [
        {
          title: "API Reference",
          url: "/dashboard/docs/api",
        },
        {
          title: "Guides",
          url: "/dashboard/docs/guides",
        },
        {
          title: "Troubleshooting",
          url: "/dashboard/docs/troubleshooting",
        },
        {
          title: "Support",
          url: "/dashboard/docs/support",
        },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher
          versions={data.versions}
          defaultVersion={data.versions[0]}
        />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <SidebarGroup key={item.title}>
            <SidebarGroupLabel className="text-sidebar-label">{item.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {item.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={item.isActive} className="text-sidebar">
                      <a href={item.url}>{item.title}</a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
