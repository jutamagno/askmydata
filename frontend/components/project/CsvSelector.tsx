'use client'
import type { CsvFile } from '@/types'

interface Props {
  csvFiles: CsvFile[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function CsvSelector({ csvFiles, selectedIds, onChange }: Props) {
  if (csvFiles.length <= 1) return null

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length === 1) return // always keep at least one
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-zinc-400">Arquivos:</span>
      {csvFiles.map((f) => (
        <button
          key={f.id}
          onClick={() => toggle(f.id)}
          className={`rounded-full px-2.5 py-0.5 text-xs transition border ${
            selectedIds.includes(f.id)
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-zinc-300 dark:border-zinc-600 text-zinc-500 hover:border-zinc-400'
          }`}
        >
          {f.filename}
        </button>
      ))}
    </div>
  )
}
