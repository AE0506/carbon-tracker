import { useState } from 'react'
import { useStore } from '@/store/useStore'
import { generateAIResponse, knowledgeBase } from '@/knowledge'
import { SendHorizonal, X, Sparkles } from 'lucide-react'
import clsx from 'clsx'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export default function AIChat() {
  const { aiExpanded, setAiExpanded, chatMessages, addChatMessage } = useStore()
  const [input, setInput] = useState('')

  if (!aiExpanded) return null

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }

    addChatMessage(userMessage)

    setTimeout(() => {
      const response = generateAIResponse(input.trim())
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }
      addChatMessage(assistantMessage)
    }, 500)

    setInput('')
  }

  const handleQuickQuestion = (question: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
      timestamp: Date.now(),
    }
    addChatMessage(userMessage)

    setTimeout(() => {
      const response = generateAIResponse(question)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }
      addChatMessage(assistantMessage)
    }, 500)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/80 p-4">
      <div className="glass-panel w-full max-w-2xl h-[32rem] flex flex-col animate-scale-in">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold">碳迹绿行 AI 助手</div>
              <div className="text-sm text-white/50">随时为你解答</div>
            </div>
          </div>
          <button
            onClick={() => setAiExpanded(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="text-center">
              <div className="text-white/40 mb-6">有什么可以帮助你的？</div>
              <div className="flex flex-wrap gap-2 justify-center">
                {knowledgeBase.quickQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuickQuestion(q)}
                    className="glass px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              <div
                className={clsx(
                  'max-w-[80%] px-4 py-3 rounded-2xl',
                  msg.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'glass text-white/90'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入你的问题..."
              className="flex-1 glass px-4 py-3 bg-transparent text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              <SendHorizonal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}