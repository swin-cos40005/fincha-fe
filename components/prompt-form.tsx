'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { fetchApi } from '@/lib/api-client'

import { Button } from '@/components/ui/button'
import { IconArrowDown, IconPlus } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
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
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)

  const handleSubmit = async (value: string) => {
    setMessages(prevMessages => [
      ...prevMessages,
      { id: nanoid(), role: 'user', content: value }
    ])

    const res = await fetchApi('/conversation/', {
      method: 'POST',
      body: JSON.stringify({ query: value }),
      cache: 'no-store'
    })

    console.log('res: ', res)

    if (!res.ok) {
      throw new Error('Failed to submit user message')
    }

    const data = await res.json()


    const assistantText =
      (data && data.data && data.data.response) ||
      data?.message ||
      data?.response ||
      ''

    setMessages(prevMessages => [
      ...prevMessages,
      { id: nanoid(), role: 'assistant', content: assistantText }
    ])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type (PDF or TXT only)
      const validTypes = ['application/pdf', 'text/plain']
      if (!validTypes.includes(file.type)) {
        alert('Please select a PDF or TXT file')
        return
      }
      setSelectedFile(file)
    }
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
        if (selectedFile) {
          console.log('Selected file: ', selectedFile.name)
          // Note: Backend processing not implemented yet
        }

        handleSubmit(value)
      }}
    >
      <div className="relative flex max-h-60 w-full grow flex-col overflow-hidden bg-background px-8 sm:border sm:px-12">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-0 top-[14px] size-8 rounded-full bg-background p-0 sm:left-4"
              onClick={() => fileInputRef.current?.click()}
            >
              <IconPlus />
              <span className="sr-only">Upload file</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upload file (PDF, TXT)</TooltipContent>
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt"
            className="hidden"
            onChange={handleFileSelect}
          />
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
