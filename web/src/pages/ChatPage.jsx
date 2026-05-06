import { useState, useRef, useEffect } from 'react'
import { extractEmotion, getMapping } from '../services/emotions.js'
import EmotionEditor from '../components/EmotionEditor.jsx'

const CLOUD_API = 'http://47.239.171.228:9098'
const DRAFT_KEY = 'cyberpet_draft_input'
const MESSAGES_KEY = 'cyberpet_session_messages'

const INIT_MESSAGES = [
  { role: 'assistant', content: '你好！我是 CyberPet 🐱，有什么可以帮你的吗？', emotion: 'idle' }
]

export default function ChatPage() {
  // 从 sessionStorage 恢复消息记录（切页面不丢失）
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(MESSAGES_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return INIT_MESSAGES
  })

  // 从 sessionStorage 恢复草稿（切页面不丢失）
  const [input, setInput] = useState(() => {
    try { return sessionStorage.getItem(DRAFT_KEY) || '' } catch { return '' }
  })

  const [loading, setLoading] = useState(false)
  const [emotion, setEmotion] = useState('idle')
  const [showEmotionEditor, setShowEmotionEditor] = useState(false)
  const bottomRef = useRef(null)

  // 持久化消息到 sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(messages)) } catch {}
  }, [messages])

  // 持久化草稿到 sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(DRAFT_KEY, input) } catch {}
  }, [input])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 初始化情绪：取最后一条 AI 消息的情绪
  useEffect(() => {
    const lastAi = [...messages].reverse().find(m => m.role === 'assistant' && m.emotion)
    if (lastAi?.emotion) setEmotion(lastAi.emotion)
  }, [])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim(), emotion: null }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setEmotion('thinking')

    try {
      const settings = JSON.parse(localStorage.getItem('cyberpet-settings') || '{}')
      const cloudApi = settings.cloudApi || CLOUD_API

      const res = await fetch(`${cloudApi}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.apiKey ? { Authorization: `Bearer ${settings.apiKey}` } : {}),
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          model: settings.model || 'gpt-3.5-turbo',
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const raw = data.choices?.[0]?.message?.content || data.reply || data.message || '...'

      // 解析情绪 tag（与移动端逻辑一致）
      const { content, emotion: newEmotion } = extractEmotion(raw)
      setEmotion(newEmotion)
      setMessages(prev => [...prev, { role: 'assistant', content, emotion: newEmotion }])
    } catch (err) {
      setEmotion('error')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ 连接云端失败: ${err.message}\n请检查设置页面的 API 配置。`,
        emotion: 'error'
      }])
    } finally {
      setLoading(false)
    }
  }

  const mapping = getMapping(emotion)

  return (
    <div className="flex flex-col h-full">
      {/* Header — 宠物情绪展示 */}
      <div className="px-6 py-3 border-b border-slate-800 flex items-center gap-3">
        {/* 宠物头像（点击打开情绪编辑器） */}
        <button
          onClick={() => setShowEmotionEditor(true)}
          title="点击编辑情绪表情"
          className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-violet-500 transition-all"
        >
          {mapping.gifUrl
            ? <img src={mapping.gifUrl} alt={mapping.label} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-xl">
                {mapping.fallbackEmoji}
              </div>
          }
        </button>
        <div>
          <div className="font-semibold">CyberPet</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <span>{mapping.fallbackEmoji}</span>
            <span>{mapping.label}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs text-slate-400">在线</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm overflow-hidden
              ${msg.role === 'user'
                ? 'bg-gradient-to-br from-cyan-600 to-cyan-800'
                : 'bg-gradient-to-br from-violet-600 to-pink-500'
              }`}>
              {msg.role === 'user'
                ? '👤'
                : (() => {
                    const m = getMapping(msg.emotion || 'idle')
                    return m.gifUrl
                      ? <img src={m.gifUrl} alt={m.label} className="w-full h-full object-cover" />
                      : m.fallbackEmoji
                  })()
              }
            </div>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap
              ${msg.role === 'user'
                ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-tr-sm'
                : 'bg-slate-800 rounded-tl-sm'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-sm">
              {getMapping('thinking').fallbackEmoji}
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]"></span>
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]"></span>
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]"></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input — 草稿已通过 sessionStorage 持久化 */}
      <div className="px-6 py-4 border-t border-slate-800">
        <div className="flex gap-3">
          <textarea
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none
              focus:border-violet-500 resize-none transition-colors"
            placeholder="输入消息...（Enter 发送，Shift+Enter 换行）"
            rows={2}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
          />
          <button
            className="px-5 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 hover:opacity-90
              disabled:opacity-40 text-sm font-medium transition-opacity self-end py-2.5"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            发送
          </button>
        </div>
        <div className="text-xs text-slate-600 mt-1.5">点击宠物头像可自定义情绪表情</div>
      </div>

      {/* 情绪编辑器弹窗 */}
      {showEmotionEditor && (
        <EmotionEditor onClose={() => setShowEmotionEditor(false)} />
      )}
    </div>
  )
}
