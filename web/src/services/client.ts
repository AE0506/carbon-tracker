/**
 * 通用 API 客户端
 * - 自动附带 JWT token
 * - 统一错误处理
 * - Token 过期自动跳转登录页
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem('auth_token')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = API_BASE_URL.endsWith('/api') && normalizedPath.startsWith('/api/')
    ? `${API_BASE_URL}${normalizedPath.slice('/api'.length)}`
    : `${API_BASE_URL}${normalizedPath}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  if (res.status === 204) {
    return undefined as T
  }

  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    const err = await res.json().catch(() => ({ detail: '请求失败' }))
    const message = Array.isArray(err.detail)
      ? err.detail.map((item: { msg?: string }) => item.msg).filter(Boolean).join('；')
      : err.detail
    throw new ApiError(message || '请求失败', res.status)
  }

  return res.json()
}

export { request, ApiError }
export type { RequestOptions }
