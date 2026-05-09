'use client'
import { useState, useEffect, useCallback } from 'react'
import { messagesApi, queryApi } from '@/lib/api'
import type { Message, QueryResponse, CsvFile } from '@/types'

export function useChat(projectId: string, csvFiles: CsvFile[]) {
  const [messages, setMessages]         = useState<Message[]>([])
  const [loading, setLoading]           = useState(true)
  const [asking, setAsking]             = useState(false)
  const [lastResponse, setLastResponse] = useState<QueryResponse | null>(null)

  const activeCsv = csvFiles[0] ?? null

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await messagesApi.list(projectId)
      setMessages(data)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  const ask = async (question: string) => {
    if (!activeCsv || asking) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      engine: null,
      query: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setAsking(true)

    try {
      const { data } = await queryApi.ask(projectId, activeCsv.id, question)
      setLastResponse(data)
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer,
        engine: data.engine as Message['engine'],
        query: data.query,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      const errMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        engine: null,
        query: null,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setAsking(false)
    }
  }

  const clear = async () => {
    await messagesApi.clear(projectId)
    setMessages([])
    setLastResponse(null)
  }

  return { messages, loading, asking, lastResponse, activeCsv, ask, clear }
}
