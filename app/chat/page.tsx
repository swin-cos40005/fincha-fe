import { nanoid } from '@/lib/utils'
import { Chat } from '@/app/chat/_components/chat'

export const metadata = {
  title: 'Financial advisor by Fincha'
}

export default async function IndexPage() {
  const id = nanoid()

  return <Chat id={id} />
}
