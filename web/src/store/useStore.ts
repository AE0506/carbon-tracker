import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface LocalAchievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  target?: number
}

interface AppState {
  // UI 状态
  aiVisible: boolean
  aiExpanded: boolean
  setAiVisible: (visible: boolean) => void
  setAiExpanded: (expanded: boolean) => void

  // 聊天记录（纯本地）
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChatMessages: () => void

  // 成就数据（本地模拟，不须后端）
  achievements: LocalAchievement[]
  setAchievements: (achievements: LocalAchievement[]) => void
}

const mockAchievements: LocalAchievement[] = [
  { id: '1', name: '首次记录', description: '完成第一次碳足迹记录', icon: '📝', unlocked: true, unlockedAt: '2026-04-10' },
  { id: '2', name: '连续7天', description: '连续记录7天碳足迹', icon: '🔥', unlocked: false, progress: 3, target: 7 },
  { id: '3', name: '低碳达人', description: '单日碳评分低于3分', icon: '🌿', unlocked: false },
  { id: '4', name: '森林园丁', description: '种植10棵树', icon: '🌳', unlocked: false, progress: 5, target: 10 },
  { id: '5', name: '素食主义者', description: '累计30天素食', icon: '🥗', unlocked: false, progress: 8, target: 30 },
  { id: '6', name: '百公里骑行', description: '累计骑行100公里', icon: '🚴', unlocked: false, progress: 42, target: 100 },
  { id: '7', name: '碳中和先锋', description: '年度碳排放为零', icon: '🏆', unlocked: false },
  { id: '8', name: '环保卫士', description: '分享低碳生活给10个朋友', icon: '👥', unlocked: false, progress: 2, target: 10 },
]

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // UI
      aiVisible: true,
      aiExpanded: false,
      setAiVisible: (visible) => set({ aiVisible: visible }),
      setAiExpanded: (expanded) => set({ aiExpanded: expanded }),

      // 聊天
      chatMessages: [],
      addChatMessage: (message) => set((state) => ({ chatMessages: [...state.chatMessages, message] })),
      clearChatMessages: () => set({ chatMessages: [] }),

      // 成就
      achievements: mockAchievements,
      setAchievements: (achievements) => set({ achievements }),
    }),
    {
      name: 'carbon-tracker-v5-state',
      partialize: (state) => ({
        aiVisible: state.aiVisible,
        aiExpanded: state.aiExpanded,
        chatMessages: state.chatMessages,
      }),
    }
  )
)
