import { Montserrat } from 'next/font/google'
import { Inconsolata } from 'next/font/google'

import '@/app/globals.css'
import { cn } from '@/lib/utils'
import { Providers } from '@/components/providers'
import { Header } from '@/components/header'
import { SidebarLayout } from '@/components/sidebar-layout'
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
          <SidebarLayout>
            <div className="flex flex-col flex-1 h-full min-h-0">
              <Header />
              <main className="flex flex-col flex-1 bg-muted/20 overflow-auto">{children}</main>
            </div>
          </SidebarLayout>
        </Providers>
      </body>
    </html>
  )
}
