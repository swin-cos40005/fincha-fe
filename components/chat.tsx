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

  return (
    <div
      className={cn(
        "group w-full pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] relative",
        messages.length ? "overflow-auto" : "overflow-hidden"
      )}
      ref={scrollRef}
    >
      {messages.length ? (
        <div className="pb-[200px] pt-4 md:pt-6" ref={messagesRef}>
          <ChatList messages={messages} />
          <div className="w-full h-px" ref={visibilityRef} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
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
      )}
      
      {messages.length > 0 && (
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
      )}
    </div>
  )
}
