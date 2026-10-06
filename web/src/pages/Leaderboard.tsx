import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as leaderboardApi from '@/services/leaderboard'
import { Trophy, Medal } from 'lucide-react'
import clsx from 'clsx'

export default function Leaderboard() {
  const { user } = useAuth()
  const [data, setData] = useState<leaderboardApi.LeaderboardResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    leaderboardApi.getLeaderboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const leaderboard = data?.leaderboard ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gradient mb-2">排行榜</h1>
        <p className="text-white/60 text-sm">与好友比拼低碳生活</p>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">积分排行</h2>
        </div>
        {leaderboard.length === 0 ? (
          <div className="text-center text-white/40 py-8">还没有用户数据</div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((item) => (
              <div
                key={item.user_id}
                className={clsx(
                  'flex items-center gap-4 p-3 rounded-xl transition-all',
                  item.user_id === user?.id
                    ? 'bg-primary-600/20 border border-primary-500/30'
                    : 'hover:bg-white/5'
                )}
              >
                <div className="w-8 h-8 flex items-center justify-center">
                  {item.rank <= 3 ? (
                    <Medal
                      className={clsx(
                        'w-6 h-6',
                        item.rank === 1 ? 'text-yellow-400' : item.rank === 2 ? 'text-gray-300' : 'text-amber-600'
                      )}
                    />
                  ) : (
                    <span className="text-white/40 font-medium">{item.rank}</span>
                  )}
                </div>
                {item.avatar ? (
                  <img src={item.avatar} alt={item.nickname} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold">
                    {item.nickname[0]}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium">{item.nickname}</div>
                  {item.user_id === user?.id && (
                    <div className="text-xs text-primary-400">你自己</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="font-medium text-primary-400">{item.total_points}</div>
                  <div className="text-xs text-white/40">积分</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {data?.my_rank && (
        <div className="glass p-4 text-center">
          <div className="text-white/40 text-sm mb-1">你的排名</div>
          <div className="text-3xl font-bold text-primary-400">#{data.my_rank.rank}</div>
          <div className="text-white/60 text-sm">{data.my_rank.total_points} 积分</div>
        </div>
      )}
    </div>
  )
}
