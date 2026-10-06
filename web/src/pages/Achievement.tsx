import { useAuth } from '@/contexts/AuthContext'
import { Award, Lock } from 'lucide-react'
import clsx from 'clsx'

const ALL_ACHIEVEMENTS = [
  { id: '1', name: '首次记录', description: '完成第一次碳足迹记录', icon: '📝' },
  { id: '2', name: '连续7天', description: '连续记录7天碳足迹', icon: '🔥' },
  { id: '3', name: '低碳达人', description: '单日碳评分低于3分', icon: '🌿' },
  { id: '4', name: '森林园丁', description: '种植10棵树', icon: '🌳' },
  { id: '5', name: '素食主义者', description: '累计30天素食', icon: '🥗' },
  { id: '6', name: '百公里骑行', description: '累计骑行100公里', icon: '🚴' },
  { id: '7', name: '碳中和先锋', description: '年度碳排放为零', icon: '🏆' },
  { id: '8', name: '环保卫士', description: '分享低碳生活给10个朋友', icon: '👥' },
]

export default function Achievement() {
  const { user } = useAuth()

  // 根据用户实际数据动态计算成就解锁状态
  const achievements = ALL_ACHIEVEMENTS.map(a => {
    let unlocked = false
    let progress: number | undefined
    let target: number | undefined

    switch (a.id) {
      case '1': // 首次记录
        unlocked = (user?.total_days ?? 0) >= 1
        break
      case '2': // 连续7天
        progress = user?.streak ?? 0
        target = 7
        unlocked = progress >= target
        break
      case '4': // 森林园丁 - 10棵树
        progress = user?.total_trees ?? 0
        target = 10
        unlocked = progress >= target
        break
      case '5': // 素食主义者 - 30次
        progress = user?.vegan_count ?? 0
        target = 30
        unlocked = progress >= target
        break
      default:
        unlocked = false
    }

    return { ...a, unlocked, progress, target }
  })

  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gradient mb-2">成就中心</h1>
        <p className="text-white/60 text-sm">已解锁 {unlockedCount} / {achievements.length} 成就</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={clsx(
              'glass p-4 transition-all',
              achievement.unlocked ? 'border-primary-500/30' : 'opacity-60'
            )}
          >
            <div className="text-4xl mb-3">{achievement.icon}</div>
            <div className="font-semibold text-sm mb-1">{achievement.name}</div>
            <div className="text-xs text-white/40 mb-2">{achievement.description}</div>
            {achievement.unlocked ? (
              <div className="flex items-center gap-1 text-xs text-primary-400">
                <Award className="w-3 h-3" />
                已解锁
              </div>
            ) : achievement.progress !== undefined && achievement.target ? (
              <div className="space-y-1">
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%` }}
                  />
                </div>
                <div className="text-xs text-white/30">
                  {achievement.progress} / {achievement.target}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-white/30">
                <Lock className="w-3 h-3" />
                未解锁
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
