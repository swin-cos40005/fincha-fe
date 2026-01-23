import { createClient } from '@/utils/supabase/client'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_SERVER_ORIGIN || 'http://localhost:8080/api'

type FetchOptions = RequestInit & {
    headers?: Record<string, string>
}

export async function fetchApi(endpoint: string, options: FetchOptions = {}) {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    if (options.headers && typeof options.headers === 'object' && !Array.isArray(options.headers) && !(options.headers instanceof Headers)) {
        Object.assign(headers, options.headers)
    }

    if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
    }

    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`

    const response = await fetch(url, {
        ...options,
        headers,
    })

    // Handle 401 Unauthorized globally if needed (e.g. redirect to login)
    if (response.status === 401) {
        // Optional: Trigger a logout or token refresh if needed, 
        // but Supabase client handles token refresh automatically mostly.
        console.warn('API returned 401 Unauthorized')
    }

    return response
}
