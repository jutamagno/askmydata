'use client'
import { useState } from 'react'

interface ColumnProfile {
  name: string
  type: string
  null_pct: number
  unique_count: number
  min?: number
  max?: number
  mean?: number
  top_values?: { value: string; count: number }[]
}

interface Profile {
  columns: ColumnProfile[]
}

interface Props {
  profile: Profile
  rowCount: number
}

export function DataProfilePanel({ profile, rowCount }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-2.5 text-xs text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition"
      >
        <span className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          Perfil dos dados · {profile.columns.length} colunas · {rowCount.toLocaleString('pt-BR')} linhas
        </span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {profile.columns.map((col) => (
            <ColumnCard key={col.name} col={col} />
          ))}
        </div>
      )}
    </div>
  )
}

function ColumnCard({ col }: { col: ColumnProfile }) {
  const isNumeric = col.min !== undefined
  const nullPct = Math.round(col.null_pct * 100)

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-xs space-y-1.5">
      <div className="flex items-center justify-between gap-1">
        <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate">{col.name}</span>
        <span className="shrink-0 rounded px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-mono text-[10px]">
          {col.type}
        </span>
      </div>

      <div className="flex items-center gap-3 text-zinc-500">
        <span>{col.unique_count} únicos</span>
        {nullPct > 0 && (
          <span className="text-amber-500">{nullPct}% nulos</span>
        )}
      </div>

      {/* Null bar */}
      <div className="h-1 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${100 - nullPct}%` }}
        />
      </div>

      {isNumeric ? (
        <div className="text-zinc-500 space-y-0.5">
          <div className="flex justify-between">
            <span>min</span><span className="font-medium text-zinc-700 dark:text-zinc-300">{col.min}</span>
          </div>
          <div className="flex justify-between">
            <span>max</span><span className="font-medium text-zinc-700 dark:text-zinc-300">{col.max}</span>
          </div>
          <div className="flex justify-between">
            <span>média</span><span className="font-medium text-zinc-700 dark:text-zinc-300">{col.mean}</span>
          </div>
        </div>
      ) : col.top_values && col.top_values.length > 0 ? (
        <div className="space-y-0.5">
          {col.top_values.slice(0, 3).map((tv) => {
            const maxCount = col.top_values![0].count
            return (
              <div key={tv.value} className="flex items-center gap-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-400"
                    style={{ width: `${Math.round((tv.count / maxCount) * 100)}%` }}
                  />
                </div>
                <span className="truncate text-zinc-500 max-w-[70px]">{tv.value}</span>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
