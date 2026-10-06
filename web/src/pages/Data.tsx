import { useState, useEffect } from 'react'
import * as statsApi from '@/services/stats'
import { TrendingUp, BarChart2 } from 'lucide-react'

type TabType = 'week' | 'month' | 'year'

export default function Data() {
  const [weekStats, setWeekStats] = useState<statsApi.WeekStatsResult | null>(null)
  const [monthStats, setMonthStats] = useState<statsApi.MonthStatsResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Exclude<TabType, 'year'>>('week')

  useEffect(() => {
    const now = new Date()
    Promise.all([
      statsApi.getWeekStats(),
      statsApi.getMonthStats(now.getFullYear(), now.getMonth() + 1),
    ])
      .then(([week, month]) => {
        setWeekStats(week)
        setMonthStats(month)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const tabs = [
    { id: 'week' as const, label: '周视图' },
    { id: 'month' as const, label: '月视图' },
  ]

  const weekDays = weekStats?.week_days ?? []
  const scoredDays = weekDays.filter(d => d.scored)
  const monthRecords = monthStats?.records ?? []
  const monthChart = monthRecords.slice(0, 12).reverse()
  const chartItems = activeTab === 'week'
    ? weekDays.map((stat) => ({
        label: stat.weekday,
        score: stat.score,
        points: stat.points,
        scored: stat.scored,
      }))
    : monthChart.map((record) => ({
        label: record.date.slice(5),
        score: record.score,
        points: record.points,
        scored: true,
      }))

  const avgScore = activeTab === 'week' && scoredDays.length > 0
    ? (scoredDays.reduce((a, b) => a + (b.score ?? 0), 0) / scoredDays.length).toFixed(1)
    : (monthStats?.summary.avg_score ?? 0).toFixed(1)
  const maxScore = activeTab === 'week'
    ? (scoredDays.length > 0 ? Math.max(...scoredDays.map(s => s.score ?? 0)) : 0)
    : (monthRecords.length > 0 ? Math.max(...monthRecords.map(record => record.score)) : 0)
  const minScore = activeTab === 'week'
    ? (scoredDays.length > 0 ? Math.min(...scoredDays.map(s => s.score ?? 0)) : 0)
    : (monthRecords.length > 0 ? Math.min(...monthRecords.map(record => record.score)) : 0)
  const lowCarbonDays = activeTab === 'week'
    ? (weekStats?.summary.low_carbon_days ?? 0)
    : (monthStats?.summary.low_carbon_days ?? 0)
  const totalPoints = activeTab === 'week'
    ? (weekStats?.summary.total_points ?? 0)
    : (monthStats?.summary.total_points ?? 0)

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gradient mb-2">数据分析</h1>
        <p className="text-white/60 text-sm">了解你的碳排放趋势</p>
      </div>

      <div className="glass p-1 flex rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart2 className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">碳评分趋势</h2>
        </div>
        <div className="flex items-end justify-between gap-2 h-40">
          {chartItems.length === 0 ? (
            <div className="w-full text-center text-white/40 py-12">暂无统计数据</div>
          ) : chartItems.map((stat, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center">
                <span className="text-xs text-primary-400 mb-1">{stat.score ?? '-'}</span>
                {stat.scored ? (
                  <div
                    className="w-full bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg"
                    style={{ height: `${((stat.score ?? 0) / 10) * 100}%` }}
                  />
                ) : (
                  <div className="w-full h-1 bg-white/10 rounded" />
                )}
              </div>
              <span className="text-xs text-white/40">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-4 text-center">
          <div className="text-3xl font-bold text-primary-400">{avgScore}</div>
          <div className="text-sm text-white/40">平均评分</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-3xl font-bold text-primary-400">{totalPoints}</div>
          <div className="text-sm text-white/40">累计积分</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-3xl font-bold text-green-400">{minScore}</div>
          <div className="text-sm text-white/40">最低评分</div>
        </div>
        <div className="glass p-4 text-center">
          <div className="text-3xl font-bold text-red-400">{maxScore}</div>
          <div className="text-sm text-white/40">最高评分</div>
        </div>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">碳排放建议</h2>
        </div>
        <div className="space-y-3 text-sm text-white/60">
          <p>{activeTab === 'week' ? '本周' : '本月'}有 {lowCarbonDays} 天保持了低碳生活，继续加油！</p>
          <p>建议减少私家车使用，多选择公共交通或骑行。</p>
        </div>
      </div>
    </div>
  )
}
