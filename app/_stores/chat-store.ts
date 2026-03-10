import { createStore } from 'zustand/vanilla'
import { nanoid } from 'nanoid'
import type { Message } from '@/lib/types'
import { submitUserMessage } from '@/lib/services/chat/actions'

export type ChatState = {
  messages: Message[]
  input: string
  isLoading: boolean
  hasInteracted: boolean
}

export type ChatActions = {
  setInput: (input: string) => void
  setHasInteracted: (hasInteracted: boolean) => void
  sendMessage: (content: string) => Promise<void>
  reset: () => void
}

export type ChatStore = ChatState & ChatActions

export const defaultInitState: ChatState = {
  messages: [],
  input: '',
  isLoading: false,
  hasInteracted: false,
}

export const createChatStore = (initState: ChatState = defaultInitState) => {
  return createStore<ChatStore>()((set, get) => ({
    ...initState,

    setInput: (input) => set({ input }),

    setHasInteracted: (hasInteracted) => set({ hasInteracted }),

    sendMessage: async (content: string) => {
      const userMessage: Message = { id: nanoid(), role: 'user', content }

      set((state) => ({
        messages: [...state.messages, userMessage],
        input: '',
        isLoading: true,
        hasInteracted: true,
      }))

      try {
        const response = await submitUserMessage(content)
        const assistantMessage: Message = { id: nanoid(), role: 'assistant', content: response }

        set((state) => ({
          messages: [...state.messages, assistantMessage],
          isLoading: false,
        }))
      } catch {
        set({ isLoading: false })
      }
    },

    reset: () => set(defaultInitState),
  }))
}
