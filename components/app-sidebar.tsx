"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, CheckSquare, Layers, MessageSquare, Settings, Brain } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/sidebar-provider"
import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Define the base navigation items
const baseNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Todo List",
    href: "/todos",
    icon: CheckSquare,
  },
  {
    title: "Spaces",
    href: "/spaces",
    icon: Layers,
  },
  {
    title: "AI Chat",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [spaces, setSpaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch spaces for the sidebar
  useEffect(() => {
    async function fetchSpaces() {
      try {
        const response = await fetch("/api/spaces")
        if (response.ok) {
          const data = await response.json()
          setSpaces(data || [])
        }
      } catch (error) {
        console.error("Error fetching spaces:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpaces()
  }, [])

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6" />
          <span className="font-semibold">Sensei AI</span>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-4">
        <SidebarMenu>
          {baseNavItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link href={item.href} className="flex items-center">
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {/* Spaces Section */}
        <div className="mt-6">
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Spaces</h3>
          <SidebarMenu>
            {loading ? (
              // Show skeletons while loading
              Array.from({ length: 3 }).map((_, i) => (
                <SidebarMenuItem key={`skeleton-${i}`}>
                  <div className="flex items-center gap-2 p-2">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </SidebarMenuItem>
              ))
            ) : spaces.length > 0 ? (
              // Show spaces if available
              spaces.map((space) => (
                <SidebarMenuItem key={space.id}>
                  <SidebarMenuButton asChild isActive={pathname === `/spaces/${space.id}`}>
                    <Link href={`/spaces/${space.id}`} className="flex items-center">
                      <div className={`h-3 w-3 rounded-full ${space.color || "bg-gray-500"}`} />
                      <span className="ml-2">{space.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            ) : (
              // Show message if no spaces
              <SidebarMenuItem>
                <div className="px-2 py-1 text-xs text-muted-foreground">No spaces found</div>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto">
        <div className="text-xs text-muted-foreground">Sensei AI © {new Date().getFullYear()}</div>
      </SidebarFooter>
    </Sidebar>
  )
}
