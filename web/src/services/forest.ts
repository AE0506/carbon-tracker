import { request } from './client'

export interface TreeItem {
  id: number
  date: string
  carbon_score: number
  tree_value: number
  tree_level: number
  created_at: string
}

export interface ForestStats {
  total_trees: number
  level_1_count: number
  level_2_count: number
  level_3_count: number
  level_4_count: number
}

export interface ForestResult {
  trees: TreeItem[]
  stats: ForestStats
}

export function getForest(): Promise<ForestResult> {
  return request<ForestResult>('/api/forest')
}
