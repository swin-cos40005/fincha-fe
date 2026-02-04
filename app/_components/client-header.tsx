'use client'

import dynamic from 'next/dynamic'
import * as React from 'react'
import { ThemeToggle } from '@/app/_components/theme-toggle'

const DynamicThemeToggle = dynamic(
  () => Promise.resolve(ThemeToggle),
  { ssr: false }
)

export function ClientHeader() {
  return <DynamicThemeToggle />
}
