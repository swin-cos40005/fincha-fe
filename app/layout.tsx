import { Montserrat } from 'next/font/google'
import { Inconsolata } from 'next/font/google'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
// import { ThemeToggle } from '@/components/theme-toggle'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Fincha',
  description:
    'Fincha is a financial chatbot that helps you make better investment decisions.'
}

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat'
})

const inconsolata = Inconsolata({
  subsets: ['latin'],
  variable: '--font-inconsolata'
})

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(montserrat.variable, inconsolata.variable)}
    >
      <body className={cn('font-sans antialiased')}>
        <Toaster position="top-center" />
        <Providers
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex flex-col flex-1 bg-muted/50">{children}</main>
          </div>
          {/* <ThemeToggle /> */}
        </Providers>
      </body>
    </html>
  )
}
