"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  CheckSquare,
  Bell,
  Settings,
  LogOut,
  User,
  Layout,
  Star,
  Users,
  Plus,
  ChevronLeft,
  ChevronRight,
  Menu,
} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useMobile } from "@/hooks/use-mobile"

interface SidebarProps {
  className?: string
}

interface Team {
  id: string
  name: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = useMobile()
  const [mobileOpen, setMobileOpen] = useState(false)

  // App name and initials - hardcoded to prevent hydration errors
  const appName = "TaskTogether"
  const appInitials = "TT"

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/teams")
        if (response.ok) {
          const data = await response.json()
          setTeams(data)
        }
      } catch (error) {
        console.error("Error fetching teams:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTeams()
  }, [])

  // Set collapsed state based on screen size on initial load
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true)
    }
  }, [isMobile])

  // Close mobile sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && mobileOpen) {
        const sidebar = document.getElementById("sidebar")
        if (sidebar && !sidebar.contains(event.target as Node)) {
          setMobileOpen(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMobile, mobileOpen])

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false)
    }
  }, [pathname, isMobile, mobileOpen])

  const handleToggle = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setCollapsed(!collapsed)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    window.location.href = "/login"
  }

  const mainLinks = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "My tasks",
      href: "/tasks",
      icon: CheckSquare,
      active: pathname === "/tasks",
    },
    {
      name: "Boards",
      href: "/boards",
      icon: Layout,
      active: pathname === "/boards",
    },
    {
      name: "Starred",
      href: "/starred",
      icon: Star,
      active: pathname === "/starred",
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: Bell,
      active: pathname === "/notifications",
    },
    {
      name: "Teams",
      href: "/teams",
      icon: Users,
      active: pathname === "/teams" || pathname.startsWith("/teams/"),
    },
    {
      name: "Profile",
      href: "/profile",
      icon: User,
      active: pathname === "/profile",
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ]

  // Mobile menu toggle button - visible only on mobile
  const mobileMenuToggle = isMobile && (
    <Button
      variant="ghost"
      size="icon"
      className="fixed top-4 left-4 z-50 md:hidden"
      onClick={handleToggle}
      aria-label="Toggle menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  )

  const sidebarClasses = cn(
    "sidebar flex flex-col h-full border-r z-30 transition-all duration-300",
    isMobile ? "fixed left-0 top-0 bottom-0" : "relative",
    isMobile && !mobileOpen ? "-translate-x-full" : "translate-x-0",
    collapsed && !isMobile ? "w-[70px]" : "w-64",
    className,
  )

  return (
    <>
      {mobileMenuToggle}

      <aside id="sidebar" className={sidebarClasses}>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-[-12px] top-[50%] z-10 h-6 w-6 rounded-full bg-background text-foreground border border-border shadow-sm hidden md:flex"
            onClick={handleToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        )}

        <div className="space-y-4 py-4 flex-1 overflow-y-auto">
          <div className={cn("px-4 py-2", collapsed && !isMobile && "flex justify-center")}>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-yellow-300 rounded-full w-8 h-8 flex items-center justify-center text-black font-bold">
                {appInitials}
              </div>
              {(!collapsed || isMobile) && <h2 className="text-xl font-bold text-foreground">{appName}</h2>}
            </Link>
          </div>

          <div className="flex flex-col gap-y-2 px-3">
            {mainLinks.map((link) => (
              <Button
                key={link.href}
                variant={link.active ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start text-foreground",
                  link.active
                    ? "bg-sidebar-active text-sidebar-active-fg font-medium"
                    : "hover:bg-sidebar-hover hover:text-sidebar-fg",
                  collapsed && !isMobile ? "justify-center px-2" : "justify-start",
                )}
                title={collapsed && !isMobile ? link.name : undefined}
                asChild
              >
                <Link href={link.href} className="text-foreground no-underline hover:no-underline">
                  <link.icon className={cn("h-5 w-5", collapsed && !isMobile ? "mr-0" : "mr-2")} />
                  {(!collapsed || isMobile) && link.name}
                </Link>
              </Button>
            ))}
          </div>

          {(!collapsed || isMobile) && (
            <div className="mt-4">
              <Accordion type="multiple" defaultValue={["teams"]} className="px-2">
                <AccordionItem value="teams" className="border-none">
                  <AccordionTrigger className="px-4 py-2 hover:no-underline hover:bg-sidebar-hover text-sidebar-fg">
                    <span className="text-sm font-semibold">Your Teams</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    {loading ? (
                      <div className="px-2 space-y-2">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-y-1 px-2">
                        {teams.map((team) => (
                          <Button
                            key={team.id}
                            variant="ghost"
                            className={cn(
                              "w-full justify-start text-foreground hover:bg-sidebar-hover hover:text-sidebar-fg",
                              pathname === `/teams/${team.id}` &&
                                "bg-sidebar-active text-sidebar-active-fg font-medium",
                            )}
                            asChild
                          >
                            <Link
                              href={`/teams/${team.id}`}
                              className="text-foreground no-underline hover:no-underline"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {team.name}
                            </Link>
                          </Button>
                        ))}
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-fg"
                          asChild
                        >
                          <Link href="/teams" className="text-muted-foreground no-underline hover:no-underline">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Team
                          </Link>
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}

          {collapsed && !isMobile && (
            <div className="mt-4 flex justify-center">
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Teams" asChild>
                <Link href="/teams">
                  <Users className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        <div className={cn("px-3 bottom-4 w-full py-4", collapsed && !isMobile ? "pr-3" : "pr-8")}>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              "w-full text-foreground hover:bg-sidebar-hover hover:text-sidebar-fg",
              collapsed && !isMobile && "justify-center px-0",
            )}
            title={collapsed && !isMobile ? "Log out" : undefined}
          >
            <LogOut className="h-5 w-5" />
            {(!collapsed || isMobile) && "Log out"}
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/20 z-20" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}
    </>
  )
}
