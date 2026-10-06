import { useStore } from '@/store/useStore'
import { useScrollPosition } from '@/hooks/useScrollPosition'
import AIChat from './AIChat'
import { Sparkles } from 'lucide-react'

export default function AIFloating() {
  const { aiVisible, aiExpanded, setAiExpanded } = useStore()
  const { isScrolled } = useScrollPosition()

  if (aiExpanded) {
    return <AIChat />
  }

  return (
    <>
      {!aiVisible && !isScrolled && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-center justify-center bg-dark/60">
          <div className="glass-strong p-8 max-w-lg text-center animate-fade-in pointer-events-auto">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-gradient">碳迹绿行 AI 助手</h2>
            <p className="text-white/60 mb-6">有什么可以帮助你的？</p>
            <button
              onClick={() => setAiExpanded(true)}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl transition-colors"
            >
              开始对话
            </button>
          </div>
        </div>
      )}

      {isScrolled && aiVisible && !aiExpanded && (
        <button
          onClick={() => setAiExpanded(true)}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 glass-strong flex items-center justify-center hover:scale-110 transition-transform animate-scale-in"
        >
          <Sparkles className="w-6 h-6 text-primary-400" />
        </button>
      )}
    </>
  )
}