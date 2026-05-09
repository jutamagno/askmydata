'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projectsApi } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatBox } from '@/components/chat/ChatBox'
import { NewProjectModal } from '@/components/project/NewProjectModal'
import { useProjects } from '@/hooks/useProjects'
import { useChat } from '@/hooks/useChat'
import type { ProjectDetail } from '@/types'

export default function ProjectPage() {
  const { id }   = useParams<{ id: string }>()
  const router   = useRouter()
  const { projects, refetch } = useProjects()

  const [project, setProject]     = useState<ProjectDetail | null>(null)
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    projectsApi.get(id)
      .then(({ data }) => setProject(data))
      .catch(() => router.push('/dashboard'))
      .finally(() => setLoading(false))
  }, [id, router])

  const chat = useChat(id, project?.csv_files ?? [])

  if (loading || !project) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="no-print">
        <Sidebar projects={projects} onNewProject={() => setShowModal(true)} />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden print-area">
        {/* Print-only report header */}
        <div className="print-header hidden">
          <h1 className="text-2xl font-bold text-zinc-900">{project.name}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {project.csv_files[0]?.filename} · {project.csv_files[0]?.row_count?.toLocaleString()} linhas · Gerado em {new Date().toLocaleDateString('pt-BR', { dateStyle: 'long' })}
          </p>
        </div>

        <header className="no-print flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-3">
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</h1>
            <p className="text-xs text-zinc-400">
              {project.csv_files[0]?.filename ?? 'No file'} · {project.csv_files[0]?.row_count?.toLocaleString() ?? 0} rows
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> SQL</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pandas</span>
            </div>
            {chat.messages.length > 0 && (
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exportar PDF
              </button>
            )}
          </div>
        </header>

        <ChatBox
          messages={chat.messages}
          loading={chat.loading}
          asking={chat.asking}
          messageData={chat.messageData}
          activeCsv={chat.activeCsv}
          onAsk={chat.ask}
          onClear={chat.clear}
        />
      </div>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); refetch() }} />
      )}
    </div>
  )
}
