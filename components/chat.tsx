'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { useState } from 'react'
import { Message, Session } from '@/lib/types'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'

export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  session?: Session
}

export function Chat({ id, className, session }: ChatProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [hasInteracted, setHasInteracted] = useState(false)

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true)
    }
  }

  // Before interaction: centered layout
  if (!hasInteracted) {
    return (
      <div className="group absolute inset-0 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl flex flex-col items-center gap-8">
          <EmptyScreen />
          <div className="w-full">
            <ChatPanel
              id={id}
              input={input}
              setInput={setInput}
              isAtBottom={isAtBottom}
              scrollToBottom={scrollToBottom}
              setMessages={setMessages}
              hasInteracted={hasInteracted}
              onInteraction={handleInteraction}
            />
          </div>
        </div>
      </div>
    )
  }

  // After interaction: fixed bottom layout with scrollable messages
  return (
    <div className="group absolute inset-0 flex flex-col">
      {/* Scrollable messages area */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
        ref={scrollRef}
      >
        <div className="mx-auto max-w-2xl px-4 pb-4 pt-8 md:pt-12 lg:pt-16" ref={messagesRef}>
          <ChatList messages={messages} />
          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      </div>
      
      {/* Fixed input panel at bottom */}
      <div className="flex-shrink-0 border-t bg-background w-full">
        <div className="mx-auto max-w-2xl px-4">
          <ChatPanel
            id={id}
            input={input}
            setInput={setInput}
            isAtBottom={isAtBottom}
            scrollToBottom={scrollToBottom}
            setMessages={setMessages}
            hasInteracted={hasInteracted}
            onInteraction={handleInteraction}
          />
        </div>
      </div>
    </div>
  )
}