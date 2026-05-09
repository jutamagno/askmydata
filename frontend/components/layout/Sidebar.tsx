'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { removeToken } from '@/lib/auth'
import { ThemeToggle } from './ThemeToggle'
import type { Project } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  projects: Project[]
  onNewProject: () => void
}

export function Sidebar({ projects, onNewProject }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  const logout = () => { removeToken(); router.push('/login') }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <span className="text-base font-semibold">Ask<span className="text-blue-600">My</span>Data</span>
        <ThemeToggle />
      </div>

      <div className="px-3 py-3">
        <button onClick={onNewProject} className="flex w-full items-center gap-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
          </svg>
          New project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {projects.length > 0 && (
          <p className="mb-2 px-1 text-xs font-medium text-zinc-400 uppercase tracking-wide">Recent projects</p>
        )}
        <nav className="flex flex-col gap-1">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`} className={cn(
              'flex items-center justify-between rounded-lg px-3 py-2 text-sm transition',
              pathname === `/projects/${p.id}`
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            )}>
              <span className="truncate">{p.name}</span>
              <span className="ml-2 shrink-0 text-xs text-zinc-400">{p.csv_count} {p.csv_count === 1 ? 'file' : 'files'}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-3">
        <button onClick={logout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  )
}
