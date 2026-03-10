'use client'

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { useStore } from 'zustand'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { type AuthStore, createAuthStore } from '@/app/_stores/auth-store'
import { createClient } from '@/lib/services/supabase/client'

export type AuthStoreApi = ReturnType<typeof createAuthStore>

export const AuthStoreContext = createContext<AuthStoreApi | undefined>(undefined)

export interface AuthStoreProviderProps {
  children: ReactNode
}

export const AuthStoreProvider = ({ children }: AuthStoreProviderProps) => {
  const [store] = useState(() => createAuthStore())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { setUser, setLoading } = store.getState()

    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error checking auth session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      if (event === 'SIGNED_OUT') {
        router.refresh()
      }
    })

    return () => subscription.unsubscribe()
  }, [router, store, supabase])

  return (
    <AuthStoreContext.Provider value={store}>
      {children}
    </AuthStoreContext.Provider>
  )
}

export const useAuthStore = <T,>(selector: (store: AuthStore) => T): T => {
  const authStoreContext = useContext(AuthStoreContext)

  if (!authStoreContext) {
    throw new Error('useAuthStore must be used within AuthStoreProvider')
  }

  return useStore(authStoreContext, selector)
}

// Auth actions hook - provides methods for authentication
export const useAuthActions = () => {
  const router = useRouter()
  const supabase = createClient()
  const setIsSubmitting = useAuthStore((s) => s.setIsSubmitting)

  const signIn = async (email: string, password: string) => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        return { error: error.message }
      }
      return {}
    } catch (error: any) {
      return { error: error.message || 'Sign in failed' }
    } finally {
      setIsSubmitting(false)
    }
  }

  const signUp = async (email: string, password: string, options?: { emailRedirectTo?: string }) => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: options?.emailRedirectTo ? { emailRedirectTo: options.emailRedirectTo } : undefined,
      })
      if (error) {
        return { error: error.message }
      }
      return {}
    } catch (error: any) {
      return { error: error.message || 'Sign up failed' }
    } finally {
      setIsSubmitting(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      toast.success('Signed out successfully')
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const signInWithGoogle = async (options?: { redirectTo?: string }) => {
    setIsSubmitting(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: options?.redirectTo ?? `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      toast.error(error.message || 'Error logging in with Google')
      setIsSubmitting(false)
    }
  }

  return { signIn, signUp, signOut, signInWithGoogle }
}

// Convenience hook that combines store state with actions (similar to original useAuth)
export const useAuth = () => {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const isSubmitting = useAuthStore((state) => state.isSubmitting)
  const { signIn, signUp, signOut, signInWithGoogle } = useAuthActions()

  return { user, loading, isSubmitting, signIn, signUp, signOut, signInWithGoogle }
}
