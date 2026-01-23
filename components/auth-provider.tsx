'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
    user: User | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error?: string }>
    signUp: (email: string, password: string) => Promise<{ error?: string }>
    signOut: () => Promise<void>
    signInWithGoogle: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => ({}),
    signUp: async () => ({}),
    signOut: async () => { },
    signInWithGoogle: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setUser(session?.user ?? null)
            } catch (error) {
                console.error('Error checking auth session:', error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        checkUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event)
            setUser(session?.user ?? null)
            setLoading(false)

            if (event === 'SIGNED_OUT') {
                router.refresh()
            }
        })

        return () => subscription.unsubscribe()
    }, [router, supabase])

    const signIn = async (email: string, password: string) => {
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
        }
    }

    const signUp = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            })
            if (error) {
                return { error: error.message }
            }
            return {}
        } catch (error: any) {
            return { error: error.message || 'Sign up failed' }
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

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            })
            if (error) throw error
        } catch (error: any) {
            console.error('Google sign-in error:', error)
            toast.error(error.message || 'Error logging in with Google')
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, signInWithGoogle }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
