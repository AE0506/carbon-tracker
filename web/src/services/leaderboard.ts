import { request } from './client'

export interface LeaderboardEntry {
  rank: number
  user_id: number
  nickname: string
  avatar: string
  total_points: number
  level: number
  total_days: number
}

export interface MyRank {
  rank: number
  user_id: number
  nickname: string
  total_points: number
  level: number
}

export interface LeaderboardResult {
  leaderboard: LeaderboardEntry[]
  my_rank: MyRank | null
}

export function getLeaderboard(): Promise<LeaderboardResult> {
  return request<LeaderboardResult>('/api/leaderboard')
}
