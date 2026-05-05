package agent

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

var dangerousCommands = []string{
	"rm", "rmdir", "mkfs", "dd", "fdisk", "format",
	"shutdown", "reboot", "halt", "poweroff",
	"iptables", "ufw", "firewall-cmd",
	"passwd", "useradd", "userdel", "usermod",
	"sudo", "su", "chmod", "chown",
	"wget", "curl", "nc", "ncat", "netcat",
}

var allowedCommands = []string{
	"ls", "pwd", "echo", "cat", "head", "tail", "grep",
	"find", "wc", "sort", "uniq", "date", "whoami",
	"hostname", "uname", "uptime", "ps", "top", "df", "du",
	"git", "go", "node", "npm", "python3", "pip3",
}

type execRequest struct {
	Command string   `json:"command"`
	Args    []string `json:"args"`
	Cwd     string   `json:"cwd"`
}

type execResponse struct {
	Stdout   string `json:"stdout"`
	Stderr   string `json:"stderr"`
	ExitCode int    `json:"exit_code"`
	Error    string `json:"error,omitempty"`
}

// HandleExec POST /api/agent/exec
func HandleExec(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	var req execRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// 安全检查
	if !isAllowedCommand(req.Command) {
		jsonError(w, fmt.Sprintf("command '%s' is not allowed", req.Command), http.StatusForbidden)
		return
	}

	home, _ := os.UserHomeDir()
	cwd := home
	if req.Cwd != "" {
		abs, err := filepath.Abs(req.Cwd)
		if err != nil || !strings.HasPrefix(abs, home) {
			jsonError(w, "cwd must be within home directory", http.StatusForbidden)
			return
		}
		cwd = abs
	}

	cmd := exec.Command(req.Command, req.Args...)
	cmd.Dir = cwd
	stdout, _ := cmd.Output()
	var stderr []byte
	exitCode := 0
	if err := cmd.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			stderr = exitErr.Stderr
			exitCode = exitErr.ExitCode()
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(execResponse{
		Stdout:   string(stdout),
		Stderr:   string(stderr),
		ExitCode: exitCode,
	})
}

// HandleFiles GET /api/agent/files?path=
func HandleFiles(w http.ResponseWriter, r *http.Request) {
	home, _ := os.UserHomeDir()
	path := r.URL.Query().Get("path")
	if path == "" {
		path = home
	}
	abs, err := filepath.Abs(path)
	if err != nil || !strings.HasPrefix(abs, home) {
		jsonError(w, "path must be within home directory", http.StatusForbidden)
		return
	}

	entries, err := os.ReadDir(abs)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	type fileInfo struct {
		Name  string `json:"name"`
		IsDir bool   `json:"is_dir"`
		Size  int64  `json:"size"`
	}
	var files []fileInfo
	for _, e := range entries {
		info, _ := e.Info()
		var size int64
		if info != nil {
			size = info.Size()
		}
		files = append(files, fileInfo{Name: e.Name(), IsDir: e.IsDir(), Size: size})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"path":  abs,
		"files": files,
	})
}

// HandleRead GET /api/agent/read?path=
func HandleRead(w http.ResponseWriter, r *http.Request) {
	home, _ := os.UserHomeDir()
	path := r.URL.Query().Get("path")
	if path == "" {
		jsonError(w, "path is required", http.StatusBadRequest)
		return
	}
	abs, err := filepath.Abs(path)
	if err != nil || !strings.HasPrefix(abs, home) {
		jsonError(w, "path must be within home directory", http.StatusForbidden)
		return
	}

	data, err := os.ReadFile(abs)
	if err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"path":    abs,
		"content": string(data),
	})
}

// HandleWrite POST /api/agent/write
func HandleWrite(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	home, _ := os.UserHomeDir()

	var req struct {
		Path    string `json:"path"`
		Content string `json:"content"`
	}
	body, _ := io.ReadAll(r.Body)
	if err := json.Unmarshal(body, &req); err != nil {
		jsonError(w, "invalid request body", http.StatusBadRequest)
		return
	}

	abs, err := filepath.Abs(req.Path)
	if err != nil || !strings.HasPrefix(abs, home) {
		jsonError(w, "path must be within home directory", http.StatusForbidden)
		return
	}

	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if err := os.WriteFile(abs, []byte(req.Content), 0o644); err != nil {
		jsonError(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"ok": true, "path": abs})
}

func isAllowedCommand(cmd string) bool {
	base := filepath.Base(cmd)
	for _, d := range dangerousCommands {
		if base == d {
			return false
		}
	}
	for _, a := range allowedCommands {
		if base == a {
			return true
		}
	}
	return false
}

func jsonError(w http.ResponseWriter, msg string, code int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}
