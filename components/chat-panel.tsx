'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
import { PromptForm } from '@/components/prompt-form'
import { ButtonScrollToBottom } from '@/components/button-scroll-to-bottom'

import { Message } from '@/lib/types'
import { UserMessage } from './stocks/message'
import { nanoid } from 'nanoid'
import { submitUserMessage } from '@/lib/actions/chat'
import { cn } from '@/lib/utils'

export interface ChatPanelProps {
  id?: string
  title?: string
  input: string
  setInput: (value: string) => void
  isAtBottom: boolean
  scrollToBottom: () => void
  setMessages: (messages: (currentMessages: Message[]) => Message[]) => void
  hasInteracted: boolean
  onInteraction: () => void
}

export function ChatPanel({
  input,
  setInput,
  isAtBottom,
  scrollToBottom,
  setMessages,
  hasInteracted,
  onInteraction
}: ChatPanelProps) {
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
        <PromptForm
          input={input}
          setInput={setInput}
          setMessages={setMessages}
          onInteraction={onInteraction}
        />
      </div>
    </div>
  )
}