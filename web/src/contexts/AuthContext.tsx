import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { UserInfo } from '@/services/auth'
import * as authApi from '@/services/auth'

interface AuthContextType {
  user: UserInfo | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }
    try {
      const profile = await authApi.getProfile()
      setUser(profile)
    } catch {
      localStorage.removeItem('auth_token')
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = useCallback(async (username: string, password: string) => {
    const result = await authApi.login(username, password)
    localStorage.setItem('auth_token', result.access_token)
    setUser(result)
    setIsLoading(false)
  }, [])

  const register = useCallback(async (username: string, password: string) => {
    const result = await authApi.register(username, password)
    localStorage.setItem('auth_token', result.access_token)
    setUser(result)
    setIsLoading(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token')
    setUser(null)
    setIsLoading(false)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
