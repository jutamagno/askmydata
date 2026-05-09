'use client'
import { useState, useEffect, useCallback } from 'react'
import { messagesApi, queryApi } from '@/lib/api'
import type { Message, QueryResponse, CsvFile } from '@/types'

export function useChat(projectId: string, csvFiles: CsvFile[]) {
  const [messages, setMessages]     = useState<Message[]>([])
  const [loading, setLoading]       = useState(true)
  const [asking, setAsking]         = useState(false)
  const [messageData, setMessageData] = useState<Record<string, QueryResponse['data']>>({})

  const activeCsv = csvFiles[0] ?? null

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await messagesApi.list(projectId)
      setMessages(data)
      const dataMap: Record<string, QueryResponse['data']> = {}
      for (const msg of data as Message[]) {
        if (msg.chart_data) {
          try { dataMap[msg.id] = JSON.parse(msg.chart_data) } catch {}
        }
      }
      setMessageData(dataMap)
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
      const assistantId = crypto.randomUUID()
      const assistantMsg: Message = {
        id: assistantId,
        role: 'assistant',
        content: data.answer,
        engine: data.engine as Message['engine'],
        query: data.query,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (data.data) {
        setMessageData((prev) => ({ ...prev, [assistantId]: data.data }))
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Algo deu errado. Tente novamente.',
        engine: null,
        query: null,
        created_at: new Date().toISOString(),
      }])
    } finally {
      setAsking(false)
    }
  }

  const clear = async () => {
    await messagesApi.clear(projectId)
    setMessages([])
    setMessageData({})
  }

  return { messages, loading, asking, messageData, activeCsv, ask, clear }
}
