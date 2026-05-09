'use client'
import { useState, useEffect } from 'react'

interface Props {
  steps: string[]
  isThinking: boolean  // true while streaming hasn't produced tokens yet
}

export function ThinkingSteps({ steps, isThinking }: Props) {
  const [expanded, setExpanded] = useState(true)

  // Collapse when the first real token arrives (thinking done)
  useEffect(() => {
    if (!isThinking && steps.length > 0) {
      setExpanded(false)
    }
  }, [isThinking, steps.length])

  if (steps.length === 0) return null

  const lastStep = steps[steps.length - 1]

  return (
    <div className="mb-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs overflow-hidden">
      <button
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
        onClick={() => setExpanded((e) => !e)}
      >
        {isThinking ? (
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
          </span>
        ) : (
          <svg className="h-3 w-3 shrink-0 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        <span className="flex-1 truncate">
          {isThinking ? lastStep : `Processado em ${steps.length} etapa${steps.length !== 1 ? 's' : ''}`}
        </span>
        <svg
          className={`h-3 w-3 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-2 pt-0.5 space-y-1 bg-zinc-50/50 dark:bg-zinc-800/30">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
              {i < steps.length - 1 || !isThinking ? (
                <svg className="h-2.5 w-2.5 shrink-0 text-zinc-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400 animate-pulse" />
              )}
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
