'use server'



export async function submitUserMessage(message: string) {
  console.log('message: ', message)
  
  const SERVER_URL = process.env.API_SERVER_ORIGIN || 'http://localhost:8080/api'
  console.log('SERVER_URL: ', SERVER_URL)
  const res = await fetch(`${SERVER_URL}/chat`, {
    method: 'POST',
    body: JSON.stringify({ message }),
    cache: 'no-store'
  })

  if (!res.ok) {
    throw new Error('Failed to submit user message')
  }

  const data = await res.json() 
  console.log('data: ', data)
  return data.message as string
}