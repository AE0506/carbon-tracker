import { request } from './client'

export interface RecordItem {
  id: number
  date: string
  transport: string
  diet: string
  status: string
  carbon_score: number
  carbon_points: number
  is_low_carbon: boolean
  tree_value: number
  tree_level: number
  created_at: string
}

export interface RecordCreateResult extends RecordItem {
  user: {
    level: number
    total_points: number
    total_trees: number
    streak: number
    total_days: number
  }
}

export interface RecordListResult {
  records: RecordItem[]
  total: number
  page: number
  per_page: number
}

export function createRecord(data: {
  transport: string
  diet: string
  status: string
}): Promise<RecordCreateResult> {
  return request<RecordCreateResult>('/api/records', {
    method: 'POST',
    body: data,
  })
}

export function listRecords(page = 1, perPage = 20): Promise<RecordListResult> {
  return request<RecordListResult>(`/api/records?page=${page}&per_page=${perPage}`)
}

export function deleteRecord(date: string): Promise<void> {
  return request<void>(`/api/records?date=${encodeURIComponent(date)}`, {
    method: 'DELETE',
  })
}
