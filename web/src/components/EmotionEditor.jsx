import { useState } from 'react'
import { getEmotionMappings, saveEmotionMappings, DEFAULT_MAPPINGS } from '../services/emotions.js'

export default function EmotionEditor({ onClose }) {
  const [mappings, setMappings] = useState(getEmotionMappings())
  const [editing, setEditing] = useState(null)
  const [editUrl, setEditUrl] = useState('')

  const startEdit = (tag, currentUrl) => {
    setEditing(tag)
    setEditUrl(currentUrl || '')
  }

  const saveEdit = (tag) => {
    const updated = mappings.map(m =>
      m.tag === tag ? { ...m, gifUrl: editUrl.trim() || null } : m
    )
    setMappings(updated)
    saveEmotionMappings(updated)
    setEditing(null)
    setEditUrl('')
  }

  const clearEdit = (tag) => {
    const updated = mappings.map(m => m.tag === tag ? { ...m, gifUrl: null } : m)
    setMappings(updated)
    saveEmotionMappings(updated)
    setEditing(null)
  }

  const resetAll = () => {
    setMappings(DEFAULT_MAPPINGS)
    saveEmotionMappings(DEFAULT_MAPPINGS)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-[380px] max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="font-semibold">🎭 情绪编辑器</div>
            <div className="text-xs text-slate-400 mt-0.5">为每种情绪配置 GIF 动图</div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">✕</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {mappings.map(m => (
            <div key={m.tag} className="bg-slate-800 rounded-xl p-3">
              <div className="flex items-center gap-3">
                {/* Preview */}
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {m.gifUrl
                    ? <img src={m.gifUrl} alt={m.label} className="w-full h-full object-cover" />
                    : <span className="text-2xl">{m.fallbackEmoji}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-slate-500 font-mono">{m.tag}</div>
                </div>
                <button
                  onClick={() => startEdit(m.tag, m.gifUrl)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                >
                  {m.gifUrl ? '换图' : '设置'}
                </button>
                {m.gifUrl && (
                  <button
                    onClick={() => clearEdit(m.tag)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-red-900 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    清除
                  </button>
                )}
              </div>

              {/* URL input when editing */}
              {editing === m.tag && (
                <div className="mt-3 flex gap-2">
                  <input
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-xs font-mono outline-none focus:border-violet-500"
                    placeholder="粘贴 GIF 图片 URL..."
                    value={editUrl}
                    onChange={e => setEditUrl(e.target.value)}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') saveEdit(m.tag)
                      if (e.key === 'Escape') { setEditing(null); setEditUrl('') }
                    }}
                  />
                  <button
                    onClick={() => saveEdit(m.tag)}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-xs transition-colors"
                  >
                    确定
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-800 flex justify-between">
          <button onClick={resetAll} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            重置默认
          </button>
          <button onClick={onClose} className="text-xs px-4 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors">
            完成
          </button>
        </div>
      </div>
    </div>
  )
}
