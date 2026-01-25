'use client'

import * as React from 'react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { IconMoon, IconSun } from '@/components/ui/icons'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = React.useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      // Fallback for browsers logic or initial load
      const isDark = resolvedTheme === 'dark'
      const nextTheme = isDark ? 'light' : 'dark'

      // Check for View Transition API support
      if (
        !document.startViewTransition ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setTheme(nextTheme)
        return
      }

      const x = e.clientX
      const y = e.clientY

      // Calculate radius to cover the furthest corner
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      const transition = document.startViewTransition(() => {
        setTheme(nextTheme)
      })

      transition.ready.then(() => {
        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ]

        // Animate the new view (the next theme) expanding from the click point
        document.documentElement.animate(
          {
            clipPath: clipPath,
          },
          {
            duration: 500,
            easing: 'ease-in-out',
            // The logic here is:
            // "::view-transition-new(root)" contains the snapshot of the NEW state.
            // We want to reveal it with the circle.
            pseudoElement: '::view-transition-new(root)',
          }
        )
      })
    },
    [resolvedTheme, setTheme]
  )

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9 opacity-50 cursor-not-allowed">
        <span className="sr-only">Loading theme</span>
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "group relative flex size-9 items-center justify-center rounded-full border-border bg-transparent hover:bg-muted transition-all duration-300 overflow-hidden",
        "hover:shadow-sm active:scale-95"
      )}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {/* Preview Circle Logic */}
      <span
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500 ease-out",
          "size-0 group-hover:size-[200%]",
          isDark ? "bg-zinc-200/20" : "bg-zinc-800/10"
        )}
      />

      {/* Icons */}
      <IconSun
        className={cn(
          "size-5 transition-all duration-500 absolute rotate-0 scale-100",
          isDark ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
      />
      <IconMoon
        className={cn(
          "size-5 transition-all duration-500 absolute rotate-90 scale-0",
          isDark ? "rotate-0 scale-100 opacity-100" : "rotate-90 scale-0 opacity-0"
        )}
      />

      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
