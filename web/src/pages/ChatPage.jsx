import { useState, useRef, useEffect } from 'react'

const CLOUD_API = 'http://47.239.171.228:9098'

export default function ChatPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: '你好！我是 CyberPet 🐱，有什么可以帮你的吗？' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const settings = JSON.parse(localStorage.getItem('cyberpet-settings') || '{}')
      const res = await fetch(`${CLOUD_API}/api/chat`, {
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
      const reply = data.choices?.[0]?.message?.content || data.reply || data.message || '...'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ 连接云端失败: ${err.message}\n请检查设置页面的 API 配置。`
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pet-purple to-pet-pink flex items-center justify-center">🐱</div>
        <div>
          <div className="font-semibold">CyberPet</div>
          <div className="text-xs text-slate-400">云端 AI 助手</div>
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
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm
              ${msg.role === 'user'
                ? 'bg-gradient-to-br from-cyber-500 to-cyber-700'
                : 'bg-gradient-to-br from-pet-purple to-pet-pink'
              }`}>
              {msg.role === 'user' ? '👤' : '🐱'}
            </div>
            <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap
              ${msg.role === 'user'
                ? 'bg-gradient-to-br from-cyber-600 to-cyber-700 rounded-tr-sm'
                : 'bg-slate-800 rounded-tl-sm'
              }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pet-purple to-pet-pink flex items-center justify-center text-sm">🐱</div>
            <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:0ms]"></span>
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:150ms]"></span>
              <span className="w-2 h-2 rounded-full bg-slate-500 animate-bounce [animation-delay:300ms]"></span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-800">
        <div className="flex gap-3">
          <input
            className="input"
            placeholder="输入消息..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          />
          <button
            className="btn-primary whitespace-nowrap"
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  )
}
