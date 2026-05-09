'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/Sidebar'
import { NewProjectModal } from '@/components/project/NewProjectModal'
import { useProjects } from '@/hooks/useProjects'

export default function DashboardPage() {
  const router = useRouter()
  const { projects, loading, refetch } = useProjects()
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex h-screen">
      <Sidebar projects={projects} onNewProject={() => setShowModal(true)} />

      <main className="flex-1 flex flex-col items-center justify-center px-8 bg-white dark:bg-zinc-950">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-3xl font-semibold mb-3">What do you want to know?</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-base">
            Upload a CSV and start asking questions in plain English. Charts, tables, and insights — instantly.
          </p>

          <button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            New project
          </button>

          {!loading && projects.length > 0 && (
            <div className="mt-12">
              <p className="text-sm font-medium text-zinc-400 mb-4 text-left">Recent projects</p>
              <div className="grid grid-cols-2 gap-3">
                {projects.slice(0, 4).map((p) => (
                  <button key={p.id} onClick={() => router.push(`/projects/${p.id}`)} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900 transition group">
                    <div className="flex items-start justify-between mb-2">
                      <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
                      <svg className="h-4 w-4 text-zinc-300 group-hover:text-zinc-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                    </div>
                    <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{p.name}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{p.csv_count} {p.csv_count === 1 ? 'file' : 'files'}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <NewProjectModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); refetch() }} />
      )}
    </div>
  )
}
