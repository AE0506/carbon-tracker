import { request } from './client'

export interface WeekDayStat {
  date: string
  weekday: string
  scored: boolean
  score: number | null
  points: number
  is_low_carbon: boolean
  is_today: boolean
}

export interface WeekSummary {
  avg_score: number
  total_points: number
  low_carbon_days: number
  max_score: number
  min_score: number
}

export interface WeekStatsResult {
  week_days: WeekDayStat[]
  summary: WeekSummary
}

export interface MonthRecord {
  date: string
  score: number
  points: number
  is_low_carbon: boolean
  tree_level: number
}

export interface MonthSummary {
  total_days: number
  total_points: number
  avg_score: number
  low_carbon_days: number
}

export interface MonthStatsResult {
  records: MonthRecord[]
  summary: MonthSummary
}

export function getWeekStats(): Promise<WeekStatsResult> {
  return request<WeekStatsResult>('/api/stats/week')
}

export function getMonthStats(year: number, month: number): Promise<MonthStatsResult> {
  return request<MonthStatsResult>(`/api/stats/month?year=${year}&month=${month}`)
}
