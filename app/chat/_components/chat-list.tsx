import { Separator } from '@/components/ui/separator'
import { Message } from '@/lib/types'
import { BotMessage, UserMessage } from './chat-message'

export interface ChatList {
  messages: Message[]
}

export function ChatList({ messages }: ChatList) {
  if (!messages.length) {
    return null
  }

  console.log('messages: ', messages)

  return (
    <div className="relative mx-auto max-w-2xl px-4 pb-4">
      {messages.map((message, index) => (
        <div key={message.id}>
          <div>
            {message.role === 'user' ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <BotMessage key={message.id} message={message} />
            )}
          </div>
          {index < messages.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}