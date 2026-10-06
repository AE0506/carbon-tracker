import { request } from './client'

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  level: number
  total_points: number
  total_days: number
  total_trees: number
  low_carbon_count: number
  walk_count: number
  vegan_count: number
  streak: number
  max_streak: number
  last_record_date: string | null
}

export interface AuthResult extends UserInfo {
  access_token: string
  token_type: string
}

export function register(username: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/api/auth/register', {
    method: 'POST',
    body: { username, password },
  })
}

export function login(username: string, password: string): Promise<AuthResult> {
  return request<AuthResult>('/api/auth/login', {
    method: 'POST',
    body: { username, password },
  })
}

export function getProfile(): Promise<UserInfo> {
  return request<UserInfo>('/api/auth/profile')
}
