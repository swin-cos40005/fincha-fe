import { Header } from '@/app/_components/header'
import { SidebarLayout } from '@/app/_components/sidebar-layout'
import { ChatStoreProvider } from '@/app/_providers/chat-store-provider'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  return (
    <SidebarLayout>
      <div className="flex flex-col flex-1 h-full min-h-0">
        <Header />
        <main className="flex flex-col flex-1 bg-muted/20 overflow-auto">
          <ChatStoreProvider>
            {children}
          </ChatStoreProvider>
        </main>
      </div>
    </SidebarLayout>
  )
}
