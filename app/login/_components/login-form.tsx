'use client'

import React, { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useAuthActions, useAuthStore } from '@/app/_providers/auth-store-provider'
import { GoogleIcon } from '@/app/login/_components/google-icon'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/'

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const isSubmitting = useAuthStore((s) => s.isSubmitting)
  const { signIn, signUp, signInWithGoogle } = useAuthActions()

  const handleGoogleLogin = async () => {
    await signInWithGoogle({
      redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (isLogin) {
        const result = await signIn(email, password)
        if (result.error) throw new Error(result.error)
        toast.success('Welcome back!')
        router.push(next)
        router.refresh()
      } else {
        const result = await signUp(email, password, {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
        })
        if (result.error) throw new Error(result.error)
        toast.success('Account created! Please check your email.')
      }
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md space-y-8 rounded-2xl border bg-card p-8 shadow-sm"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin
              ? 'Enter your credentials to continue'
              : 'Enter your email below to create your account'}
          </p>
        </div>

        <div className="space-y-4">
          <Button
            variant="outline"
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
            className="w-full h-11 relative"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">
              {isLogin
                ? "Don't have an account? "
                : 'Already have an account? '}
            </span>
            <button
              type="button"
              className="font-medium text-primary hover:underline underline-offset-4"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
