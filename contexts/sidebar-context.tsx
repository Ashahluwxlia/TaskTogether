"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useMobile } from "@/hooks/use-mobile"

interface SidebarContextType {
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  mobileOpen: boolean
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    // Set initial sidebar state based on screen size
    if (isMobile) {
      setCollapsed(true)
    } else {
      // Try to get the user's preference from localStorage
      const savedState = localStorage.getItem("sidebar-collapsed")
      if (savedState) {
        setCollapsed(savedState === "true")
      }
    }
  }, [isMobile])

  // Save sidebar state preference when it changes (desktop only)
  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem("sidebar-collapsed", collapsed.toString())
    }
  }, [collapsed, isMobile])

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen)
    } else {
      setCollapsed(!collapsed)
    }
  }

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        mobileOpen,
        setMobileOpen,
        isMobile,
        toggleSidebar,
      }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}
