import { useState } from 'react'
import ChatPage from './pages/ChatPage.jsx'
import AgentPage from './pages/AgentPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

const NAV = [
  { id: 'chat', label: '🐾 聊天', emoji: '🐾' },
  { id: 'agent', label: '⚡ Agent', emoji: '⚡' },
  { id: 'settings', label: '⚙️ 设置', emoji: '⚙️' },
]

export default function App() {
  const [page, setPage] = useState('chat')

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 flex flex-col items-center py-6 gap-4 bg-slate-900 border-r border-slate-800">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pet-purple to-pet-pink flex items-center justify-center text-xl pet-glow mb-2">
          🐱
        </div>
        {NAV.map(n => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            title={n.label}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all
              ${page === n.id
                ? 'bg-gradient-to-br from-pet-purple to-pet-pink shadow-lg'
                : 'hover:bg-slate-800 text-slate-400'
              }`}
          >
            {n.emoji}
          </button>
        ))}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {page === 'chat' && <ChatPage />}
        {page === 'agent' && <AgentPage />}
        {page === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}
