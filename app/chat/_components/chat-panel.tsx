'use client'

import { PromptForm } from '@/app/chat/_components/prompt-form'
import { ButtonScrollToBottom } from '@/app/_components/button-scroll-to-bottom'
import { useChatStore } from '@/app/_providers/chat-store-provider'

export interface ChatPanelProps {
  isAtBottom: boolean
  scrollToBottom: () => void
}

export function ChatPanel({ isAtBottom, scrollToBottom }: ChatPanelProps) {
  const hasInteracted = useChatStore((s) => s.hasInteracted)

  return (
    <div className="w-full relative">
      {hasInteracted && !isAtBottom && (
        <ButtonScrollToBottom
          isAtBottom={isAtBottom}
          scrollToBottom={scrollToBottom}
          className="absolute -top-14 right-4 z-10"
        />
      )}

      <div className="mx-auto sm:max-w-2xl px-4 py-3">
        <PromptForm />
      </div>
    </div>
  )
}
