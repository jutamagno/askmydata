'use client'
import { useState, useEffect, useCallback } from 'react'
import { messagesApi, startBackgroundTask, connectTaskStream } from '@/lib/api'
import type { StreamDoneResult } from '@/lib/api'
import type { Message, QueryResponse, CsvFile } from '@/types'

const TASK_STORAGE_KEY = (projectId: string) => `askmydata_task_${projectId}`
const TASK_TTL_MS = 10 * 60 * 1000  // 10 minutes

export function useChat(projectId: string, csvFiles: CsvFile[]) {
  const [messages, setMessages]           = useState<Message[]>([])
  const [loading, setLoading]             = useState(true)
  const [asking, setAsking]               = useState(false)
  const [streamingId, setStreamingId]     = useState<string | null>(null)
  const [messageData, setMessageData]     = useState<Record<string, QueryResponse['data']>>({})
  const [selectedCsvIds, setSelectedCsvIds] = useState<string[]>([])

  const activeCsv = csvFiles[0] ?? null

  useEffect(() => {
    if (csvFiles.length > 0 && selectedCsvIds.length === 0) {
      setSelectedCsvIds([csvFiles[0].id])
    }
  }, [csvFiles, selectedCsvIds.length])

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await messagesApi.list(projectId)
      const msgs = data as Message[]
      setMessages(msgs)
      const dataMap: Record<string, QueryResponse['data']> = {}
      for (const msg of msgs) {
        if (msg.chart_data) dataMap[msg.id] = msg.chart_data
      }
      setMessageData(dataMap)

      // Reconnect to any in-flight background task
      const stored = sessionStorage.getItem(TASK_STORAGE_KEY(projectId))
      if (stored) {
        const { taskId, assistantId, timestamp } = JSON.parse(stored)
        if (Date.now() - timestamp < TASK_TTL_MS) {
          _reconnectTask(taskId, assistantId)
        } else {
          sessionStorage.removeItem(TASK_STORAGE_KEY(projectId))
        }
      }
    } finally {
      setLoading(false)
    }
  }, [projectId])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchHistory() }, [fetchHistory])

  function _addStep(assistantId: string, label: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, steps: [...(m.steps ?? []), label] }
          : m
      )
    )
  }

  function _applyResult(assistantId: string, result: StreamDoneResult) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? { ...m, engine: result.engine as Message['engine'], query: result.query, duration_ms: result.duration_ms ?? null }
          : m
      )
    )
    if (result.data) {
      setMessageData((prev) => ({ ...prev, [assistantId]: result.data }))
    }
  }

  async function _reconnectTask(taskId: string, assistantId: string) {
    // Create a placeholder message for the reconnected task if it doesn't exist yet
    setMessages((prev) => {
      if (prev.find((m) => m.id === assistantId)) return prev
      return [
        ...prev,
        {
          id: assistantId,
          role: 'assistant',
          content: '',
          engine: 'pending',
          query: null,
          chart_data: null,
          created_at: new Date().toISOString(),
          steps: [],
        } satisfies Message,
      ]
    })
    setStreamingId(assistantId)
    setAsking(true)

    try {
      const result = await connectTaskStream(
        taskId,
        (token) => setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: m.content + token } : m)),
        (label) => _addStep(assistantId, label),
      )
      _applyResult(assistantId, result)
    } catch (err) {
      // Task expired or already consumed — refresh history which has the completed message
      if (err instanceof Error && err.message.includes('404')) {
        setMessages((prev) => prev.filter((m) => m.id !== assistantId))
        const { data } = await messagesApi.list(projectId)
        const msgs = data as Message[]
        setMessages(msgs)
        const dataMap: Record<string, QueryResponse['data']> = {}
        for (const msg of msgs) {
          if (msg.chart_data) dataMap[msg.id] = msg.chart_data
        }
        setMessageData(dataMap)
      } else {
        setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: 'Não foi possível recuperar a resposta.', engine: 'error' } : m)
        )
      }
    } finally {
      setAsking(false)
      setStreamingId(null)
      sessionStorage.removeItem(TASK_STORAGE_KEY(projectId))
    }
  }

  const ask = async (question: string) => {
    if (!activeCsv || asking) return

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      engine: null,
      query: null,
      chart_data: null,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setAsking(true)

    const assistantId = crypto.randomUUID()
    const assistantMsg: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      engine: null,
      query: null,
      chart_data: null,
      created_at: new Date().toISOString(),
      steps: [],
    }
    setMessages((prev) => [...prev, assistantMsg])
    setStreamingId(assistantId)

    const csvIds = selectedCsvIds.length > 0 ? selectedCsvIds : [activeCsv.id]

    try {
      // Start background task and persist task_id for reconnect
      const taskId = await startBackgroundTask(projectId, csvIds, question)
      sessionStorage.setItem(
        TASK_STORAGE_KEY(projectId),
        JSON.stringify({ taskId, assistantId, timestamp: Date.now() }),
      )

      const result = await connectTaskStream(
        taskId,
        (token) => setMessages((prev) =>
          prev.map((m) => m.id === assistantId ? { ...m, content: m.content + token } : m)
        ),
        (label) => _addStep(assistantId, label),
      )

      _applyResult(assistantId, result)
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: 'Algo deu errado. Tente novamente.', engine: 'error' as const }
            : m
        )
      )
    } finally {
      setAsking(false)
      setStreamingId(null)
      sessionStorage.removeItem(TASK_STORAGE_KEY(projectId))
    }
  }

  const clear = async () => {
    await messagesApi.clear(projectId)
    setMessages([])
    setMessageData({})
    sessionStorage.removeItem(TASK_STORAGE_KEY(projectId))
  }

  return { messages, loading, asking, streamingId, messageData, activeCsv, selectedCsvIds, setSelectedCsvIds, ask, clear }
}
