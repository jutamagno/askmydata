import ReactMarkdown from 'react-markdown'
import { QueryDisplay } from './QueryDisplay'
import { ChartDisplay } from './ChartDisplay'
import { ThinkingSteps } from './ThinkingSteps'
import type { Message } from '@/types'

interface Props {
  message: Message
  data?: Record<string, unknown>[] | null
  isStreaming?: boolean
}

export function MessageBubble({ message, data, isStreaming }: Props) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-blue-600 px-4 py-2.5 text-sm text-white">
          {message.content}
        </div>
      </div>
    )
  }

  if (message.engine === 'error') {
    return (
      <div className="flex justify-start">
        <div className="max-w-[85%] flex items-start gap-2.5 rounded-2xl rounded-tl-sm border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          {message.content}
        </div>
      </div>
    )
  }

  const hasSteps = (message.steps?.length ?? 0) > 0
  const isThinking = isStreaming === true && message.content === ''

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        {hasSteps && (
          <ThinkingSteps steps={message.steps!} isThinking={isThinking} />
        )}
        {message.engine && message.engine !== 'pending' && (
          <QueryDisplay
            query={message.query ?? ''}
            engine={message.engine}
            durationMs={message.duration_ms}
          />
        )}
        {message.content && (
          <div className="rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
            <ReactMarkdown
              components={{
                p:      ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-zinc-900 dark:text-zinc-100">{children}</strong>,
                ul:     ({ children }) => <ul className="mt-1 space-y-0.5 list-none pl-0">{children}</ul>,
                li:     ({ children }) => <li className="flex gap-1.5 before:content-['–'] before:text-zinc-400">{children}</li>,
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block h-4 w-0.5 bg-zinc-500 align-middle animate-pulse ml-0.5" />
            )}
          </div>
        )}
        {data && data.length > 0 && <ChartDisplay data={data} />}
      </div>
    </div>
  )
}
