import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import * as profileApi from '@/services/profile'
import { Leaf, Award, TreePine, Settings, LogOut, Edit3, Check, X } from 'lucide-react'

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [nickname, setNickname] = useState(user?.nickname ?? '')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setNickname(user?.nickname ?? '')
  }, [user?.nickname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleSaveProfile = async () => {
    const nextNickname = nickname.trim()
    if (!nextNickname) {
      setError('昵称不能为空')
      return
    }

    setSaving(true)
    setError('')
    try {
      await profileApi.updateProfile({ nickname: nextNickname })
      await refreshUser()
      setEditing(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const menuItems = [
    { icon: Leaf, label: '我的积分', value: `${user?.total_points ?? 0} 积分`, color: 'text-primary-400' },
    { icon: Award, label: '当前等级', value: `Lv.${user?.level ?? 1}`, color: 'text-blue-400' },
    { icon: TreePine, label: '已种树木', value: `${user?.total_trees ?? 0} 棵`, color: 'text-green-400' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-4">
        {user?.avatar ? (
          <img src={user.avatar} alt={user.nickname} className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-primary-500" />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-primary-500 bg-primary-600 flex items-center justify-center text-3xl font-bold">
            {user?.nickname?.[0] ?? '?'}
          </div>
        )}
        <h1 className="text-xl font-bold">{user?.nickname}</h1>
        <p className="text-white/40 text-sm">Lv.{user?.level ?? 1} · {user?.total_days ?? 0}天打卡</p>
      </div>

      <div className="glass p-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-white/40" />
            <span>个人资料</span>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-primary-400 hover:text-primary-300 transition-colors"
              aria-label="编辑昵称"
            >
              <Edit3 className="w-5 h-5" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="w-full glass px-4 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="昵称"
              maxLength={32}
            />
            {error && <div className="text-sm text-red-400">{error}</div>}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setEditing(false)
                  setNickname(user?.nickname ?? '')
                  setError('')
                }}
                className="py-3 glass hover:bg-white/10 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {saving ? '保存中' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">昵称</span>
            <span>{user?.nickname}</span>
          </div>
        )}
      </div>

      <div className="glass p-6 space-y-4">
        {menuItems.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span>{item.label}</span>
            </div>
            <span className={`font-medium ${item.color}`}>{item.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 glass hover:bg-white/10 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-red-400"
      >
        <LogOut className="w-4 h-4" />
        退出登录
      </button>

      <div className="text-center text-white/30 text-sm py-4">
        © 2026 碳迹绿行 · 让每一步都成为地球的希望
      </div>
    </div>
  )
}
