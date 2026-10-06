import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as recordsApi from '@/services/records'
import { Bike, Utensils, Home, Check } from 'lucide-react'

const transportOptions = ['步行', '骑行', '公交', '地铁', '出租车', '私家车']
const dietOptions = ['素食', '普通', '高碳']
const statusOptions = ['在家', '出行']

export default function Record() {
  const { refreshUser } = useAuth()
  const [records, setRecords] = useState<recordsApi.RecordItem[]>([])
  const [selectedTransport, setSelectedTransport] = useState('')
  const [selectedDiet, setSelectedDiet] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    recordsApi.listRecords(1, 50)
      .then(res => setRecords(res.records))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async () => {
    if (!selectedTransport || !selectedDiet || !selectedStatus) return

    setSubmitting(true)
    setError('')
    try {
      const result = await recordsApi.createRecord({
        transport: selectedTransport,
        diet: selectedDiet,
        status: selectedStatus,
      })
      const nextRecord = {
        id: result.id,
        date: result.date,
        transport: result.transport,
        diet: result.diet,
        status: result.status,
        carbon_score: result.carbon_score,
        carbon_points: result.carbon_points,
        is_low_carbon: result.is_low_carbon,
        tree_value: result.tree_value,
        tree_level: result.tree_level,
        created_at: result.created_at,
      }
      setRecords(prev => [nextRecord, ...prev.filter(record => record.date !== result.date)])
      await refreshUser()
      setSubmitted(true)
      window.setTimeout(() => {
        setSubmitted(false)
        setSelectedTransport('')
        setSelectedDiet('')
        setSelectedStatus('')
      }, 1600)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gradient mb-2">记录今日</h1>
        <p className="text-white/60 text-sm">选择你的出行、饮食和生活状态</p>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <Bike className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">交通方式</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {transportOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedTransport(opt)}
              className={`p-3 rounded-xl text-center transition-all ${
                selectedTransport === opt
                  ? 'bg-primary-600 text-white'
                  : 'glass hover:bg-white/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <Utensils className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">饮食习惯</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {dietOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedDiet(opt)}
              className={`p-3 rounded-xl text-center transition-all ${
                selectedDiet === opt
                  ? 'bg-primary-600 text-white'
                  : 'glass hover:bg-white/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <Home className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">生活状态</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {statusOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedStatus(opt)}
              className={`p-3 rounded-xl text-center transition-all ${
                selectedStatus === opt
                  ? 'bg-primary-600 text-white'
                  : 'glass hover:bg-white/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!selectedTransport || !selectedDiet || !selectedStatus || submitting}
        className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
      >
        {submitted ? (
          <>
            <Check className="w-5 h-5" />
            记录成功
          </>
        ) : (
          '提交记录'
        )}
      </button>
      {error && <div className="text-center text-sm text-red-400">{error}</div>}

      <div className="glass p-6">
        <h2 className="font-semibold mb-4">历史记录</h2>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {loading ? (
            <div className="text-center text-white/40 py-4">加载中...</div>
          ) : records.length === 0 ? (
            <div className="text-center text-white/40 py-4">还没有记录</div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <div className="text-sm text-white/80">{record.date}</div>
                  <div className="text-xs text-white/40">
                    {record.transport} · {record.diet} · {record.status}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-primary-400 font-medium">{record.carbon_score} 分</div>
                  <div className="text-xs text-white/40">+{record.carbon_points} 积分</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
