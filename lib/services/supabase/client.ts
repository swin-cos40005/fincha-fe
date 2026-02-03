
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
        // Return a mock client during build/prerender when env vars aren't available
        // This prevents build failures while still allowing runtime functionality
        return createBrowserClient(
            'https://placeholder.supabase.co',
            'placeholder-anon-key'
        )
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
