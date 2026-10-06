import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Leaf, UserPlus } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    if (username.trim().length < 2) {
      setError('用户名至少 2 个字符')
      return
    }
    if (password.length < 6) {
      setError('密码至少 6 个字符')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(username.trim(), password.trim())
      navigate('/app', { replace: true })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '注册失败')
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
          <h1 className="text-2xl font-bold text-gradient">注册</h1>
          <p className="text-white/50 text-sm mt-1">加入碳迹绿行，开始低碳生活</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名（2-32 字符）"
              className="w-full glass px-4 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoComplete="username"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码（至少 6 位）"
              className="w-full glass px-4 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoComplete="new-password"
            />
          </div>
          <div>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="确认密码"
              className="w-full glass px-4 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              autoComplete="new-password"
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
                <UserPlus className="w-4 h-4" />
                注册
              </>
            )}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-6">
          已有账号？{' '}
          <Link to="/login" className="text-primary-400 hover:text-primary-300">
            登录
          </Link>
        </p>
      </div>
    </div>
  )
}
