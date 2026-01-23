import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require authentication
const PROTECTED_ROUTES = ['/chat', '/settings', '/profile']
// Routes that should redirect to home if authenticated
const AUTH_ROUTES = ['/login', '/signup']

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // refreshing the auth token
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // Check if it's a protected route
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

    if (user && isAuthRoute) {
        // Already authenticated, redirect to home
        return NextResponse.redirect(new URL('/', request.url))
    }

    if (!user && isProtectedRoute) {
        // No user, redirect to login
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('next', pathname)
        return NextResponse.redirect(loginUrl)
    }

    return response
}
