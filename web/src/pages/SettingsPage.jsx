import { useState, useEffect } from 'react'

const DEFAULTS = {
  apiKey: '',
  model: 'gpt-3.5-turbo',
  cloudApi: 'http://47.239.171.228:9098',
  nickname: '用户',
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULTS)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('cyberpet-settings') || '{}')
    setSettings({ ...DEFAULTS, ...stored })
  }, [])

  const save = () => {
    localStorage.setItem('cyberpet-settings', JSON.stringify(settings))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const set = (k, v) => setSettings(prev => ({ ...prev, [k]: v }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h1 className="font-semibold text-lg">⚙️ 设置</h1>
        <p className="text-sm text-slate-400 mt-0.5">云端账号与 API 配置</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg space-y-6">
          {/* Account */}
          <div className="card space-y-4">
            <h2 className="font-medium text-sm text-slate-300">👤 账号</h2>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">昵称</label>
              <input
                className="input"
                placeholder="你的昵称"
                value={settings.nickname}
                onChange={e => set('nickname', e.target.value)}
              />
            </div>
          </div>

          {/* Cloud API */}
          <div className="card space-y-4">
            <h2 className="font-medium text-sm text-slate-300">☁️ 云端 API</h2>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">API 地址</label>
              <input
                className="input font-mono text-sm"
                placeholder="http://47.239.171.228:9098"
                value={settings.cloudApi}
                onChange={e => set('cloudApi', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">API Key</label>
              <input
                className="input font-mono text-sm"
                type="password"
                placeholder="sk-..."
                value={settings.apiKey}
                onChange={e => set('apiKey', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">模型</label>
              <input
                className="input text-sm"
                placeholder="gpt-3.5-turbo"
                value={settings.model}
                onChange={e => set('model', e.target.value)}
              />
            </div>
          </div>

          {/* About */}
          <div className="card">
            <h2 className="font-medium text-sm text-slate-300 mb-3">ℹ️ 关于</h2>
            <div className="space-y-1 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>版本</span>
                <span className="font-mono text-slate-300">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>本地端口</span>
                <span className="font-mono text-slate-300">9095</span>
              </div>
              <div className="flex justify-between">
                <span>项目</span>
                <span className="font-mono text-slate-300">CyberPet Desktop</span>
              </div>
            </div>
          </div>

          <button
            className={`btn-primary w-full py-3 text-base transition-all ${saved ? 'from-emerald-500 to-emerald-600' : ''}`}
            onClick={save}
          >
            {saved ? '✅ 已保存' : '保存设置'}
          </button>
        </div>
      </div>
    </div>
  )
}
