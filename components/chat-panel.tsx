'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'

import { Message } from '@/lib/types'
import { UserMessage } from './stocks/message'
import { nanoid } from 'nanoid'
import { submitUserMessage } from '@/lib/actions/chat'

export interface ChatPanelProps {
  id?: string
  title?: string
  input: string
  setInput: (value: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
  setMessages: (messages: (currentMessages: Message[]) => Message[]) => void
}

export function ChatPanel({
  input,
  setInput,
  isAtBottom,
  scrollToBottom,
  setMessages
}: ChatPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 w-full bg-gradient-to-b from-muted/30 from-0% to-muted/30 to-50% duration-300 ease-in-out animate-in dark:from-background/10 dark:from-10% dark:to-background/80 peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-state=open]]:group-[]:xl:pl-[300px] pointer-events-none">
      <ButtonScrollToBottom
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        className="pointer-events-auto"
      />

      <div className="mx-auto sm:max-w-2xl sm:px-4">
        <div className="space-y-4 border-t bg-background px-4 py-2 shadow-lg sm:border md:py-4 pointer-events-auto">
          <PromptForm
            input={input}
            setInput={setInput}
            setMessages={setMessages}
          />
        </div>
      </div>
    </div>
  )
}
