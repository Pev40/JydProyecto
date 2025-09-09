"use client"

import { Navigation } from "@/components/navigation"

interface ClientNavigationProps {
  userRole: string
}

export function ClientNavigation({ userRole }: ClientNavigationProps) {
  return <Navigation userRole={userRole} />
}
