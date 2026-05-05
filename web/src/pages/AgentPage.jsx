import { useState, useEffect } from 'react'

export default function AgentPage() {
  const [status, setStatus] = useState(null)
  const [files, setFiles] = useState([])
  const [currentPath, setCurrentPath] = useState('')
  const [fileContent, setFileContent] = useState(null)
  const [cmd, setCmd] = useState('')
  const [cmdResult, setCmdResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ error: 'unreachable' }))
    loadFiles('')
  }, [])

  const loadFiles = async (path) => {
    try {
      const r = await fetch(`/api/agent/files?path=${encodeURIComponent(path)}`)
      const data = await r.json()
      setFiles(data.files || [])
      setCurrentPath(data.path || path)
      setFileContent(null)
    } catch (e) {
      console.error(e)
    }
  }

  const openFile = async (name) => {
    const path = currentPath + '/' + name
    try {
      const r = await fetch(`/api/agent/read?path=${encodeURIComponent(path)}`)
      const data = await r.json()
      setFileContent({ path: data.path, content: data.content })
    } catch (e) {
      console.error(e)
    }
  }

  const runCmd = async () => {
    if (!cmd.trim() || loading) return
    setLoading(true)
    setCmdResult(null)
    try {
      const parts = cmd.trim().split(/\s+/)
      const r = await fetch('/api/agent/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: parts[0], args: parts.slice(1) }),
      })
      const data = await r.json()
      setCmdResult(data)
    } catch (e) {
      setCmdResult({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800">
        <h1 className="font-semibold text-lg">⚡ 本地 Agent 能力</h1>
        <p className="text-sm text-slate-400 mt-0.5">文件系统 · 命令执行（安全白名单）</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Status */}
        <div className="card">
          <h2 className="font-medium text-sm text-slate-300 mb-3">服务状态</h2>
          {status ? (
            <div className="flex flex-wrap gap-3">
              {Object.entries(status).map(([k, v]) => (
                <div key={k} className="bg-slate-800 rounded-lg px-3 py-1.5 text-xs">
                  <span className="text-slate-400">{k}: </span>
                  <span className="text-emerald-400 font-mono">{String(v)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-sm">加载中...</div>
          )}
        </div>

        {/* File Browser */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-sm text-slate-300">📁 文件浏览器</h2>
            {currentPath && (
              <button
                className="text-xs text-slate-400 hover:text-slate-200"
                onClick={() => {
                  const parent = currentPath.split('/').slice(0, -1).join('/')
                  loadFiles(parent || '/')
                }}
              >
                ← 上级
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 font-mono mb-2">{currentPath}</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(files || []).map(f => (
              <button
                key={f.name}
                className="text-left text-sm px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors truncate"
                onClick={() => f.is_dir ? loadFiles(currentPath + '/' + f.name) : openFile(f.name)}
              >
                <span className="mr-1.5">{f.is_dir ? '📁' : '📄'}</span>
                {f.name}
              </button>
            ))}
          </div>
          {fileContent && (
            <div className="mt-4">
              <div className="text-xs text-slate-400 font-mono mb-2">{fileContent.path}</div>
              <pre className="bg-slate-950 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-64 overflow-y-auto text-slate-300">
                {fileContent.content.slice(0, 4000)}
                {fileContent.content.length > 4000 && '\n... (内容已截断)'}
              </pre>
            </div>
          )}
        </div>

        {/* Command Executor */}
        <div className="card">
          <h2 className="font-medium text-sm text-slate-300 mb-3">💻 命令执行（白名单）</h2>
          <div className="flex gap-2 mb-3">
            <input
              className="input font-mono text-sm"
              placeholder="ls -la / pwd / git status ..."
              value={cmd}
              onChange={e => setCmd(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runCmd()}
            />
            <button className="btn-primary whitespace-nowrap" onClick={runCmd} disabled={loading}>
              运行
            </button>
          </div>
          {cmdResult && (
            <pre className="bg-slate-950 rounded-lg p-4 text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto text-slate-300">
              {cmdResult.error || cmdResult.stdout || cmdResult.stderr || '(无输出)'}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}
