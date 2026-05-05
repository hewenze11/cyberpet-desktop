# CyberPet Desktop

> 套了 CyberPet 皮的本地桌面端——单文件 Go 二进制，内嵌 React 前端，自动打开浏览器。

---

## 特性

- 🐱 **CyberPet 皮肤** — 现代深色 UI，Tailwind CSS 3
- 📦 **单文件二进制** — Go 编译，内嵌前端资源（`go:embed`）
- 🌐 **自动打开浏览器** — 启动即用，无需手动访问
- 🔒 **安全本地 Agent** — 命令白名单，路径限制在 home 目录内
- 🖥️ **跨平台** — Windows / macOS / Linux
- ☁️ **云端连接** — 前端直接调用 CyberPet 云端 API

---

## 快速开始

```bash
# 构建（需要 Go 1.22+ 和 Node 18+）
make build

# 运行（自动打开浏览器 http://localhost:9095）
./cyberpet-desktop

# 前台运行（不打开浏览器）
./cyberpet-desktop --foreground

# 查看状态
./cyberpet-desktop --status

# 停止
./cyberpet-desktop --stop

# 自定义端口
./cyberpet-desktop --port 8080
```

---

## 页面

| 页面 | 功能 |
|------|------|
| 🐾 聊天 | 连接云端 AI API，对话宠物 |
| ⚡ Agent | 本地文件浏览 + 命令执行 |
| ⚙️ 设置 | API Key、模型、昵称配置 |

---

## 本地 Agent API

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/agent/exec` | 执行本地命令（白名单） |
| GET  | `/api/agent/files?path=` | 列出目录 |
| GET  | `/api/agent/read?path=` | 读文件内容 |
| POST | `/api/agent/write` | 写文件 |
| GET  | `/api/health` | 服务健康检查 |

---

## 开发

```bash
# 安装前端依赖
cd web && npm install

# 启动前端开发服务器（热重载）
cd web && npm run dev  # http://localhost:5173，代理到 9095

# 仅编译后端（跳过前端）
go build -o cyberpet-desktop .
```

---

## 目录结构

```
cyberpet-desktop/
├── main.go                    # 入口，单例检测、CLI 参数、浏览器启动
├── go.mod
├── Makefile
├── internal/
│   ├── server/
│   │   ├── server.go          # HTTP 服务、embed 静态文件、中间件
│   │   └── dist/              # 前端构建产物（go:embed）
│   └── agent/
│       └── handlers.go        # 本地 Agent API 实现
└── web/                       # React + Vite + Tailwind 前端
    ├── src/
    │   ├── App.jsx
    │   ├── pages/
    │   │   ├── ChatPage.jsx
    │   │   ├── AgentPage.jsx
    │   │   └── SettingsPage.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

---

## 安全说明

- 命令执行仅允许白名单命令（`ls`, `git`, `go`, `grep` 等）
- 文件操作路径限制在用户 `home` 目录内
- 危险命令（`rm`, `sudo`, `curl` 等）被拦截

---

## License

MIT
