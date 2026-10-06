import { request } from './client'
import type { UserInfo } from './auth'

export function updateProfile(data: { nickname?: string }): Promise<UserInfo> {
  return request<UserInfo>('/api/profile', {
    method: 'PATCH',
    body: data,
  })
}
