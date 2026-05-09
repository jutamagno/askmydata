'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projectsApi } from '@/lib/api'
import { Sidebar } from '@/components/layout/Sidebar'
import { ChatBox } from '@/components/chat/ChatBox'
import { ReportExport } from '@/components/chat/ReportExport'
import { NewProjectModal } from '@/components/project/NewProjectModal'
import { DataProfilePanel } from '@/components/project/DataProfilePanel'
import { CsvSelector } from '@/components/project/CsvSelector'
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

  const csvFile = project.csv_files[0]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar projects={projects} onNewProject={() => setShowModal(true)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-3">
          <div>
            <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{project.name}</h1>
            <p className="text-xs text-zinc-400">
              {csvFile?.filename ?? 'No file'} · {csvFile?.row_count?.toLocaleString() ?? 0} rows
            </p>
          </div>
          <div className="flex items-center gap-4">
            <CsvSelector
              csvFiles={project.csv_files}
              selectedIds={chat.selectedCsvIds}
              onChange={chat.setSelectedCsvIds}
            />
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> SQL</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Pandas</span>
            </div>
            {chat.messages.length > 0 && (
              <ReportExport
                messages={chat.messages}
                messageData={chat.messageData}
                projectName={project.name}
                fileName={csvFile?.filename ?? ''}
                rowCount={csvFile?.row_count ?? 0}
              />
            )}
          </div>
        </header>

        {csvFile?.profile_json && (
          <DataProfilePanel profile={csvFile.profile_json} rowCount={csvFile.row_count ?? 0} />
        )}

        <ChatBox
          messages={chat.messages}
          loading={chat.loading}
          asking={chat.asking}
          streamingId={chat.streamingId}
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
