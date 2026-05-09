export interface User {
  id: string
  email: string
  created_at: string
}

export interface CsvColumnProfile {
  name: string
  type: string
  null_pct: number
  unique_count: number
  min?: number
  max?: number
  mean?: number
  top_values?: { value: string; count: number }[]
}

export interface CsvFile {
  id: string
  filename: string
  row_count: number
  profile_json?: { columns: CsvColumnProfile[] } | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  updated_at: string
  csv_count: number
}

export interface ProjectDetail {
  id: string
  name: string
  created_at: string
  updated_at: string
  csv_files: CsvFile[]
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  engine: 'sql' | 'pandas' | 'error' | 'pending' | null
  query: string | null
  chart_data: Record<string, unknown>[] | null
  duration_ms?: number | null
  created_at: string
  steps?: string[]        // thinking steps, only populated during/after streaming
  taskId?: string         // background task id, only set for in-flight tasks
}

export interface QueryResponse {
  answer: string
  query: string | null
  engine: string
  success: boolean
  data: Record<string, unknown>[] | null
  duration_ms?: number | null
}
