'use client'
import { useState, useEffect, useCallback } from 'react'
import { projectsApi } from '@/lib/api'
import type { Project } from '@/types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await projectsApi.list()
      setProjects(data)
    } catch {
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { projects, loading, error, refetch: fetch }
}
