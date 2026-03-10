'use client'

import { Separator } from '@/components/ui/separator'
import { BotMessage, UserMessage } from './chat-message'
import { useChatStore } from '@/app/_providers/chat-store-provider'

export function ChatList() {
  const messages = useChatStore((s) => s.messages)

  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4 pb-4">
      {messages.map((message, index) => (
        <div key={message.id}>
          <div>
            {message.role === 'user' ? (
              <UserMessage message={message} />
            ) : (
              <BotMessage message={message} />
            )}
          </div>
          {index < messages.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}
