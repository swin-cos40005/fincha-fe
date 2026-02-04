import { createStore } from 'zustand/vanilla'
import type { User } from '@supabase/supabase-js'

export type AuthState = {
  user: User | null
  loading: boolean
}

export type AuthActions = {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}

export type AuthStore = AuthState & AuthActions

export const defaultInitState: AuthState = {
  user: null,
  loading: true,
}

export const createAuthStore = (initState: AuthState = defaultInitState) => {
  return createStore<AuthStore>()((set) => ({
    ...initState,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
  }))
}
