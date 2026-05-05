package server

import (
	"context"
	"cyberpet-desktop/internal/agent"
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os"
	"time"
)

//go:embed all:dist
var staticFiles embed.FS

type Server struct {
	port   int
	mux    *http.ServeMux
	server *http.Server
}

func New(port int) *Server {
	if port <= 0 {
		port = 9095
	}
	mux := http.NewServeMux()
	s := &Server{port: port, mux: mux}
	setupRoutes(mux)
	s.setupMiddlewares()
	return s
}

func (s *Server) Start() error {
	addr := fmt.Sprintf(":%d", s.port)
	if isPortInUse(s.port) {
		return fmt.Errorf("端口 %d 已被占用", s.port)
	}
	s.server = &http.Server{
		Addr:         addr,
		Handler:      s.mux,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 60 * time.Second,
		IdleTimeout:  120 * time.Second,
	}
	log.Printf("[server] CyberPet Desktop 启动，监听 %s", addr)
	return s.server.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	if s.server == nil {
		return nil
	}
	return s.server.Shutdown(ctx)
}

func setupRoutes(mux *http.ServeMux) {
	// Agent API
	mux.HandleFunc("/api/agent/exec", agent.HandleExec)
	mux.HandleFunc("/api/agent/files", agent.HandleFiles)
	mux.HandleFunc("/api/agent/read", agent.HandleRead)
	mux.HandleFunc("/api/agent/write", agent.HandleWrite)
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintf(w, `{"status":"ok","app":"cyberpet-desktop","version":"1.0.0"}`)
	})

	// 静态文件（SPA）
	distFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Printf("警告: 嵌入静态文件失败: %v", err)
		return
	}
	fileServer := http.FileServer(http.FS(distFS))
	mux.Handle("/", spaHandler(fileServer, distFS))
}

// spaHandler 处理 SPA 路由：静态文件存在则直接服务，否则返回 index.html
func spaHandler(fs http.Handler, distFS fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path
		if path == "/" {
			fs.ServeHTTP(w, r)
			return
		}
		// 尝试打开文件
		f, err := distFS.Open(path[1:]) // 去掉前导 /
		if err == nil {
			f.Close()
			fs.ServeHTTP(w, r)
			return
		}
		// 回退到 index.html（SPA 路由）
		r2 := r.Clone(r.Context())
		r2.URL.Path = "/"
		fs.ServeHTTP(w, r2)
	})
}

func (s *Server) setupMiddlewares() {
	original := s.mux
	wrapped := http.NewServeMux()
	wrapped.Handle("/", corsMiddleware(loggingMiddleware(original)))
	s.mux = wrapped
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rw := &responseWriter{ResponseWriter: w, statusCode: 200}
		next.ServeHTTP(rw, r)
		log.Printf("[http] %s %s %d %s", r.Method, r.URL.Path, rw.statusCode, time.Since(start))
	})
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}

func isPortInUse(port int) bool {
	ln, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		return true
	}
	ln.Close()
	return false
}

func WritePIDFile(path string) error {
	return os.WriteFile(path, []byte(fmt.Sprintf("%d", os.Getpid())), 0o644)
}

func RemovePIDFile(path string) {
	os.Remove(path)
}
