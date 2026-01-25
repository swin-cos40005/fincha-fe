'use client'

import dynamic from 'next/dynamic'
import * as React from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { IconMoon, IconSun } from '@/components/ui/icons'

function HeaderThemeToggle() {
  const { setTheme, theme } = useTheme()
  const [_, startTransition] = React.useTransition()

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => {
        startTransition(() => {
          setTheme(theme === 'light' ? 'dark' : 'light')
        })
      }}
    >
      {!theme ? null : theme === 'dark' ? (
        <IconMoon className="transition-all" />
      ) : (
        <IconSun className="transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

const DynamicThemeToggle = dynamic(
  () => Promise.resolve(HeaderThemeToggle),
  { ssr: false }
)

export function ClientHeader() {
  return <DynamicThemeToggle />
}
