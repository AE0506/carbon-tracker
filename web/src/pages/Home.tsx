import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as statsApi from '@/services/stats'
import * as recordsApi from '@/services/records'
import { Leaf, TrendingUp, Calendar } from 'lucide-react'

export default function Home() {
  const { user } = useAuth()
  const [weekStats, setWeekStats] = useState<statsApi.WeekStatsResult | null>(null)
  const [latestRecord, setLatestRecord] = useState<recordsApi.RecordItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      statsApi.getWeekStats(),
      recordsApi.listRecords(1, 1),
    ]).then(([stats, records]) => {
      setWeekStats(stats)
      if (records.records.length > 0) {
        setLatestRecord(records.records[0])
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const avgScore = weekStats
    ? (weekStats.week_days
        .filter(d => d.scored)
        .reduce((a, b) => a + (b.score ?? 0), 0) /
        Math.max(1, weekStats.week_days.filter(d => d.scored).length)
      ).toFixed(1)
    : '0'

  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">
          <span className="text-gradient">欢迎回来</span>
        </h1>
        <p className="text-white/60">{user?.nickname}，今天为地球做了什么？</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass-strong p-6 text-center">
          <div className="text-white/40 mb-2">今日碳评分</div>
          <div className="text-4xl font-bold text-primary-400">
            {latestRecord && latestRecord.date === new Date().toISOString().slice(0, 10)
              ? latestRecord.carbon_score
              : '-'}
          </div>
          <div className="text-sm text-white/30 mt-1">满分 10 分</div>
        </div>
        <div className="glass-strong p-6 text-center">
          <div className="text-white/40 mb-2">累计积分</div>
          <div className="text-4xl font-bold text-primary-400">{user?.total_points ?? 0}</div>
          <div className="text-sm text-white/30 mt-1">碳积分</div>
        </div>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">本周趋势</h2>
          <span className="text-white/30 ml-auto text-sm">平均 {avgScore} 分</span>
        </div>
        <div className="flex items-end justify-between gap-2 h-32">
          {(weekStats?.week_days ?? []).map((stat, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-lg transition-all"
                style={{ height: `${((stat.score ?? 0) / 10) * 100}%` }}
              />
              <span className="text-xs text-white/40">{stat.weekday}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <Leaf className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">低碳成就</h2>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">{user?.total_trees ?? 0}</div>
            <div className="text-xs text-white/40">已种树木</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">Lv.{user?.level ?? 1}</div>
            <div className="text-xs text-white/40">当前等级</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-400">{user?.total_points ?? 0}</div>
            <div className="text-xs text-white/40">总积分</div>
          </div>
        </div>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">今日记录</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-white/60">交通方式</span>
            <span className="text-white">
              {latestRecord?.date === new Date().toISOString().slice(0, 10)
                ? latestRecord.transport
                : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">饮食习惯</span>
            <span className="text-white">
              {latestRecord?.date === new Date().toISOString().slice(0, 10)
                ? latestRecord.diet
                : '-'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">生活状态</span>
            <span className="text-white">
              {latestRecord?.date === new Date().toISOString().slice(0, 10)
                ? latestRecord.status
                : '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
