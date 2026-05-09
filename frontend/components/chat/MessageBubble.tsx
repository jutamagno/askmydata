import { QueryDisplay } from './QueryDisplay'
import { ChartDisplay } from './ChartDisplay'
import type { Message } from '@/types'

interface Props {
  message: Message
  data?: Record<string, unknown>[] | null
}

export function MessageBubble({ message, data }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        {message.engine && (
          <QueryDisplay query={message.query ?? ''} engine={message.engine} />
        )}
        <div className="rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
          {message.content}
        </div>
        {data && data.length > 0 && <ChartDisplay data={data} />}
      </div>
    </div>
  )
}
