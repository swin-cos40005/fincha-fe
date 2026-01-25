import * as React from 'react'
import { MobileSidebar } from '@/components/sidebar-mobile'
import { ClientHeader } from '@/components/client-header'

async function UserOrLogin() {
  return (
    <div className="flex items-center font-semibold">
      <a href="#">Fincha</a>
    </div>
  )
}

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between w-full h-16 px-4 shrink-0 bg-muted/20">
      <div className="flex items-center gap-2">
        <MobileSidebar />
        <React.Suspense fallback={<div className="flex-1 overflow-auto" />}>
          <UserOrLogin />
        </React.Suspense>
      </div>
      <ClientHeader />
    </header>
  )
}
