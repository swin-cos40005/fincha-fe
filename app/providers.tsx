'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/app/auth/auth-provider'

export function Providers({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <AuthProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </AuthProvider>
    </NextThemesProvider>
  )
}
