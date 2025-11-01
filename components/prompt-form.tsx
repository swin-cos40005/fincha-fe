'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'

import { Button } from '@/components/ui/button'
import { IconArrowDown, IconPlus } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { useRouter } from 'next/navigation'
import { Message } from '@/lib/types'
import { nanoid } from 'nanoid'

export function PromptForm({
  input,
  setInput,
  setMessages
}: {
  input: string
  setInput: (value: string) => void
  setMessages: (messages: (currentMessages: Message[]) => Message[]) => void
}) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (value: string) => {
    setMessages(prevMessages => [
      ...prevMessages,
      { id: nanoid(), role: 'user', content: value }
    ])

    const SERVER_URL =
      process.env.API_SERVER_ORIGIN || 'http://localhost:8080/api'
    console.log('SERVER_URL: ', SERVER_URL)
    const res = await fetch(`${SERVER_URL}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message: value }),
      cache: 'no-store'
    })

    console.log('res: ', res)

    if (!res.ok) {
      throw new Error('Failed to submit user message')
    }

    const data = await res.json()
    console.log('data: ', data)
    console.log('responseMessage: ', JSON.stringify(data, null, 2))

    setMessages(prevMessages => [
      ...prevMessages,
      { id: nanoid(), role: 'assistant', content: data.message as string }
    ])
  }

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <form
      ref={formRef}
      onSubmit={async (e: any) => {
        e.preventDefault()

        // Blur focus on mobile
        if (window.innerWidth < 600) {
          e.target['message']?.blur()
        }

        const value = input.trim()
        setInput('')
        if (!value) return

        console.log('value: ', value)

        handleSubmit(value)
      }}
    >
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:border sm:px-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
              onClick={() => {
                router.push('/new')
              }}
            >
              <IconPlus />
              <span className="sr-only">New Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder="Send a message."
          className="min-h-[60px] w-full resize-none bg-transparent px-4 py-[1.3rem] focus-within:outline-none sm:text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <div className="absolute right-0 top-[13px] sm:right-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button type="submit" size="icon" disabled={input === ''}>
                <div className="rotate-180">
                  <IconArrowDown />
                </div>
                <span className="sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </form>
  )
}
