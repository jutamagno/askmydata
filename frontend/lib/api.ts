import axios from 'axios'
import Cookies from 'js-cookie'
import type { QueryResponse } from '@/types'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = Cookies.get('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  register: (email: string, password: string) =>
    api.post<{ access_token: string }>('/auth/register', { email, password }),
  login: (email: string, password: string) =>
    api.post<{ access_token: string }>('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
}

export const projectsApi = {
  list: () => api.get('/projects/'),
  create: (name: string) => api.post('/projects/', { name }),
  get: (id: string) => api.get(`/projects/${id}`),
  delete: (id: string) => api.delete(`/projects/${id}`),
  uploadCsv: (projectId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/projects/${projectId}/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const messagesApi = {
  list: (projectId: string) => api.get(`/messages/${projectId}`),
  clear: (projectId: string) => api.delete(`/messages/${projectId}`),
}

export const queryApi = {
  ask: (projectId: string, csvFileId: string, question: string) =>
    api.post<QueryResponse>('/query/', { project_id: projectId, csv_file_id: csvFileId, question }),
}

export type StreamDoneResult = {
  engine: string
  query: string | null
  data: QueryResponse['data']
  duration_ms?: number | null
}

async function _consumeSseStream(
  response: Response,
  onToken: (token: string) => void,
  onStep?: (label: string) => void,
): Promise<StreamDoneResult> {
  const reader = response.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const payload = JSON.parse(line.slice(6))
      if (payload.type === 'token') {
        onToken(payload.content)
      } else if (payload.type === 'step') {
        onStep?.(payload.label)
      } else if (payload.type === 'done') {
        return { engine: payload.engine, query: payload.query, data: payload.data, duration_ms: payload.duration_ms ?? null }
      }
    }
  }

  throw new Error('Stream ended without done event')
}

export async function streamAsk(
  projectId: string,
  csvFileIds: string | string[],
  question: string,
  onToken: (token: string) => void,
  onStep?: (label: string) => void,
): Promise<StreamDoneResult> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  const token = Cookies.get('token')
  const ids = Array.isArray(csvFileIds) ? csvFileIds : [csvFileIds]

  const response = await fetch(`${base}/query/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      project_id: projectId,
      csv_file_id: ids[0],
      csv_file_ids: ids,
      question,
    }),
  })

  if (!response.ok) {
    if (response.status === 401) {
      Cookies.remove('token')
      window.location.href = '/login'
    }
    throw new Error(`HTTP ${response.status}`)
  }

  return _consumeSseStream(response, onToken, onStep)
}

export async function connectTaskStream(
  taskId: string,
  onToken: (token: string) => void,
  onStep?: (label: string) => void,
): Promise<StreamDoneResult> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  const token = Cookies.get('token')

  const response = await fetch(`${base}/query/task/${taskId}/stream`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })

  if (!response.ok) throw new Error(`Task stream HTTP ${response.status}`)

  return _consumeSseStream(response, onToken, onStep)
}

export async function startBackgroundTask(
  projectId: string,
  csvFileIds: string[],
  question: string,
): Promise<string> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
  const token = Cookies.get('token')
  const ids = Array.isArray(csvFileIds) ? csvFileIds : [csvFileIds]

  const res = await fetch(`${base}/query/task`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      project_id: projectId,
      csv_file_id: ids[0],
      csv_file_ids: ids,
      question,
    }),
  })

  if (!res.ok) throw new Error(`Start task HTTP ${res.status}`)
  const { task_id } = await res.json()
  return task_id
}
