import { nanoid } from '@/lib/utils'
import { Chat } from '@/components/chat'
import { getMissingKeys } from '@/app/actions'

export const metadata = {
  title: 'Financial advisor by Fincha'
}

export default async function IndexPage() {
  const id = nanoid()

  return <Chat id={id} />
}
