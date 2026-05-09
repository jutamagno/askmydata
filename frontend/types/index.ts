export interface User {
  id: string
  email: string
  created_at: string
}

export interface CsvFile {
  id: string
  filename: string
  row_count: number
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
  engine: 'sql' | 'pandas' | null
  query: string | null
  chart_data: string | null
  created_at: string
}

export interface QueryResponse {
  answer: string
  query: string | null
  engine: string
  success: boolean
  data: Record<string, unknown>[] | null
}
