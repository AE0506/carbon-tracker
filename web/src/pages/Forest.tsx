import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import * as forestApi from '@/services/forest'
import { TreePine, Leaf } from 'lucide-react'

const treeEmojis = ['🌱', '🌿', '🌲', '🌳']

export default function Forest() {
  const { user } = useAuth()
  const [forestData, setForestData] = useState<forestApi.ForestResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    forestApi.getForest()
      .then(setForestData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const trees = forestData?.trees ?? []

  return (
    <div className="p-6 space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gradient mb-2">我的森林</h1>
        <p className="text-white/60 text-sm">每一棵树都是你低碳生活的见证</p>
      </div>

      <div className="glass p-6 flex items-center justify-center gap-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary-400">{user?.total_trees ?? 0}</div>
          <div className="text-sm text-white/40">已种树木</div>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div className="text-center">
          <div className="text-4xl font-bold text-green-400">{user?.total_points ?? 0}</div>
          <div className="text-sm text-white/40">累计积分</div>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div className="text-center">
          <div className="text-4xl font-bold text-emerald-400">{user?.level ?? 1}</div>
          <div className="text-sm text-white/40">当前等级</div>
        </div>
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <TreePine className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">森林全景</h2>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : trees.length === 0 ? (
          <div className="text-center text-white/40 py-8">
            还没有种树，快去打卡吧！
          </div>
        ) : (
          <>
            <div className="grid grid-cols-6 gap-2">
              {trees.slice(0, 24).map((tree) => (
                <div
                  key={tree.id}
                  className="aspect-square glass flex items-center justify-center text-2xl hover:scale-110 transition-transform cursor-pointer"
                  title={`种植于 ${tree.date}`}
                >
                  {treeEmojis[tree.tree_level - 1] ?? '🌱'}
                </div>
              ))}
            </div>
            {trees.length > 24 && (
              <div className="text-center text-white/30 text-sm mt-4">
                还有 {trees.length - 24} 棵树未显示...
              </div>
            )}
          </>
        )}
      </div>

      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-4">
          <Leaf className="w-5 h-5 text-primary-400" />
          <h2 className="font-semibold">植树规则</h2>
        </div>
        <div className="text-sm text-white/60 space-y-2">
          <p>• 每获得 10 碳积分，自动种植 1 棵虚拟树木</p>
          <p>• 树木等级根据碳积分累积量提升</p>
          <p>• 等级越高，树木形态越完整</p>
        </div>
      </div>
    </div>
  )
}
