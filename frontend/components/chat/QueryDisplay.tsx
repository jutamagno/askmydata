'use client'
import { useState } from 'react'

interface Props {
  query: string
  engine: string
  durationMs?: number | null
}

export function QueryDisplay({ query, engine, durationMs }: Props) {
  const [open, setOpen]         = useState(false)
  const [copied, setCopied]     = useState(false)

  const engineColor = {
    sql:    'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    pandas: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    error:  'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  }[engine] ?? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'

  const copy = async () => {
    await navigator.clipboard.writeText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const duration = durationMs != null
    ? durationMs >= 1000
      ? `${(durationMs / 1000).toFixed(1)}s`
      : `${durationMs}ms`
    : null

  return (
    <div className="mt-1 mb-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((p) => !p)}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition ${engineColor}`}
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3" />
          </svg>
          {engine.toUpperCase()} engine
          <svg
            className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {duration && (
          <span className="text-[10px] text-zinc-400">{duration}</span>
        )}
      </div>

      {open && query && (
        <div className="mt-2 relative group">
          <pre className="rounded-lg bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 p-3 text-xs text-zinc-300 overflow-x-auto font-mono leading-relaxed">
            {query}
          </pre>
          <button
            onClick={copy}
            className="absolute top-2 right-2 rounded px-2 py-1 text-[10px] bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition opacity-0 group-hover:opacity-100"
          >
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      )}
    </div>
  )
}
