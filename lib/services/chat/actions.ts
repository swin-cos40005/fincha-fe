'use server'

import { api } from '@/lib/services/api'

export interface ConversationResponse {
  data?: { response?: string }
  message?: string
  response?: string
}

export async function submitUserMessage(message: string): Promise<string> {
  const data = await api.post<ConversationResponse>('/conversation/', {
    query: message
  })

  return data?.data?.response || data?.message || data?.response || ''
}
