'use client'

import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { LoginForm } from '@/app/login/_components/login-form'

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen w-full items-center justify-center bg-background">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
