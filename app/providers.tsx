'use client'

import * as React from 'react'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthStoreProvider } from '@/app/_providers/auth-store-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthStoreProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthStoreProvider>
    </ThemeProvider>
  )
}
