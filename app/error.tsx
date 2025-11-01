'use client'

interface ErrorProps {
  error: Error
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  return (
    <div className="border p-4">
      <div className="text-red-700 font-medium">Error: {error.message}</div>
      <div className="flex items-center mt-2"></div>
    </div>
  )
}
