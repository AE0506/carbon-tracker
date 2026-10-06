import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Leaf, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请填写用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      await login(username.trim(), password.trim())
      navigate('/app', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6">
            <Leaf className="w-5 h-5 text-primary-400" />
            <span className="font-semibold">碳迹绿行</span>
          </Link>
          <h1 className="text-2xl font-bold text-gradient">登录</h1>
          <p className="text-white/50 text-sm mt-1">登录后继续你的低碳旅程</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              className="w-full glass px-4 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoComplete="username"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              className="w-full glass px-4 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                登录
              </>
            )}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          还没有账号？{' '}
          <Link to="/register" className="text-primary-400 hover:text-primary-300">
            注册
          </Link>
        </p>
      </div>
    </div>
  )
}
