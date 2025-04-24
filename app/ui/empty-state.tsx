"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

interface EmptyStateProps {
  title: string
  description: string
  icon: ReactNode
  action: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      {action.href ? (
        <Link href={action.href}>
          <Button>{action.label}</Button>
        </Link>
      ) : (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  )
}
