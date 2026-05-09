'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageBubble } from './MessageBubble'
import { Button } from '@/components/ui/Button'
import type { CsvFile, Message, QueryResponse } from '@/types'

interface Props {
  messages: Message[]
  loading: boolean
  asking: boolean
  lastResponse: QueryResponse | null
  activeCsv: CsvFile | null
  onAsk: (q: string) => void
  onClear: () => void
}

const SUGGESTIONS = [
  'What are the top 5 rows by value?',
  'Show me a summary of all columns',
  'Which category has the highest total?',
  'Are there any null values?',
]

export function ChatBox({ messages, loading, asking, lastResponse, activeCsv, onAsk, onClear }: Props) {
  const [input, setInput] = useState('')
  const bottomRef         = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, asking])

  const submit = () => {
    const q = input.trim()
    if (!q || asking) return
    setInput(''); onAsk(q)
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-12">
            <div className="text-center">
              <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">Ready to explore your data</p>
              <p className="text-sm text-zinc-400 mt-1">
                {activeCsv ? `Loaded: ${activeCsv.filename} · ${activeCsv.row_count?.toLocaleString()} rows` : 'No file loaded'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => onAsk(s)} className="rounded-xl border border-zinc-200 dark:border-zinc-700 px-4 py-3 text-left text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => {
              const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1
              return <MessageBubble key={msg.id} message={msg} data={isLastAssistant ? lastResponse?.data : null} />
            })}
            {asking && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-tl-sm bg-zinc-100 dark:bg-zinc-800 px-4 py-3">
                  <div className="flex gap-1">
                    {[0,1,2].map((i) => (
                      <div key={i} className="h-1.5 w-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
        {messages.length > 0 && (
          <div className="flex justify-end mb-2">
            <button onClick={onClear} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition">Clear history</button>
          </div>
        )}
        <div className="flex gap-3 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            placeholder="Ask anything about your data…"
            rows={1}
            className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            style={{ maxHeight: '120px' }}
          />
          <Button onClick={submit} disabled={!input.trim() || asking} className="shrink-0 h-11">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            Ask
          </Button>
        </div>
        <p className="mt-2 text-xs text-zinc-400 text-center">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  )
}
