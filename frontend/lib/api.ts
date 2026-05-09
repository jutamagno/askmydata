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
