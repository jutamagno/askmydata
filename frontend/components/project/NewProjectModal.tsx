'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { projectsApi } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface Props { onClose: () => void; onCreated: () => void }
type Step = 'name' | 'upload'

export function NewProjectModal({ onClose, onCreated }: Props) {
  const router    = useRouter()
  const fileRef   = useRef<HTMLInputElement>(null)
  const [step, setStep]           = useState<Step>('name')
  const [name, setName]           = useState('')
  const [file, setFile]           = useState<File | null>(null)
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [projectId, setProjectId] = useState('')

  const handleCreateProject = async () => {
    if (!name.trim()) return setError('Project name is required')
    setLoading(true); setError('')
    try {
      const { data } = await projectsApi.create(name.trim())
      setProjectId(data.id); setStep('upload')
    } catch { setError('Failed to create project') }
    finally { setLoading(false) }
  }

  const handleUpload = async () => {
    if (!file) return setError('Please select a CSV file')
    setLoading(true); setError('')
    try {
      await projectsApi.uploadCsv(projectId, file)
      onCreated(); router.push(`/projects/${projectId}`)
    } catch { setError('Failed to upload file') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold">{step === 'name' ? 'New project' : 'Upload your CSV'}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{step === 'name' ? 'Give your project a name' : `Project "${name}" created — now add a file`}</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {(['name', 'upload'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium transition ${step === s ? 'bg-blue-600 text-white' : i < (['name', 'upload'] as Step[]).indexOf(step) ? 'bg-blue-100 dark:bg-blue-950 text-blue-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>{i + 1}</div>
              {i < 1 && <div className="h-px w-8 bg-zinc-200 dark:bg-zinc-700"/>}
            </div>
          ))}
        </div>

        {step === 'name' && (
          <div className="flex flex-col gap-4">
            <Input label="Project name" placeholder="e.g. Sales Q4 2024" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()} autoFocus/>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleCreateProject} loading={loading}>Continue</Button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="flex flex-col gap-4">
            <div onClick={() => fileRef.current?.click()} className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 py-10 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800 transition">
              <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
              {file ? (
                <div className="text-center"><p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{file.name}</p><p className="text-xs text-zinc-400">{(file.size / 1024).toFixed(1)} KB</p></div>
              ) : (
                <div className="text-center"><p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Click to upload CSV</p><p className="text-xs text-zinc-400">Only .csv files supported</p></div>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError('') }}/>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button onClick={handleUpload} loading={loading} disabled={!file}>Start chatting</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
