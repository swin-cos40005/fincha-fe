'use client'

import { ChatList } from '@/app/chat/_components/chat-list'
import { ChatPanel } from '@/app/chat/_components/chat-panel'
import { EmptyScreen } from '@/app/_components/empty-screen'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { useChatStore } from '@/app/_providers/chat-store-provider'

export interface ChatProps extends React.ComponentProps<'div'> {
  id?: string
}

export function Chat({ id }: ChatProps) {
  const hasInteracted = useChatStore((s) => s.hasInteracted)

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  if (!hasInteracted) {
    return (
      <div className="group absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">
          <EmptyScreen />
          <div className="w-full">
            <ChatPanel
              isAtBottom={isAtBottom}
              scrollToBottom={scrollToBottom}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group absolute inset-0 flex flex-col">
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
        ref={scrollRef}
      >
        <div className="mx-auto max-w-2xl px-4 pb-4 pt-8 md:pt-12 lg:pt-16" ref={messagesRef}>
          <ChatList />
          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      </div>

      <div className="shrink-0 border-t bg-background w-full">
        <div className="mx-auto max-w-2xl px-4">
          <ChatPanel
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
          />
        </div>
      </div>
    </div>
  )
}
