/**
 * API client with authentication support.
 *
 * Automatically includes the Supabase JWT token in requests.
 */

import { createClient } from '@/utils/supabase/client'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_SERVER_ORIGIN || 'http://localhost:8080'

interface ApiOptions extends RequestInit {
  skipAuth?: boolean
}

/**
 * Get the current user's access token from Supabase.
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = createClient()
    const {
      data: { session }
    } = await supabase.auth.getSession()
    return session?.access_token ?? null
  } catch {
    return null
  }
}

/**
 * Make an authenticated API request.
 *
 * @param endpoint - API endpoint (e.g., '/conversation/')
 * @param options - Fetch options + skipAuth flag
 * @returns Response from the API
 */
export async function apiRequest<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { skipAuth = false, headers: customHeaders, ...fetchOptions } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...customHeaders
  }

  // Add auth token if available and not skipped
  if (!skipAuth) {
    const token = await getAccessToken()
    if (token) {
      ;(headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
    }
  }

  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    cache: 'no-store'
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))

    // Handle specific auth errors
    if (response.status === 401) {
      throw new ApiError(
        error?.detail?.message || 'Authentication required',
        'UNAUTHORIZED',
        401
      )
    }

    throw new ApiError(
      error?.message || error?.detail?.message || 'Request failed',
      error?.detail?.code || 'API_ERROR',
      response.status
    )
  }

  return response.json()
}

/**
 * Custom API error class with code and status.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Convenience methods for common HTTP verbs.
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: ApiOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    }),

  put: <T = unknown>(endpoint: string, data?: unknown, options?: ApiOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    }),

  delete: <T = unknown>(endpoint: string, options?: ApiOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
}
