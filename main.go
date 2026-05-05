package main

import (
	"context"
	"cyberpet-desktop/internal/server"
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"runtime"
	"strconv"
	"syscall"
	"time"
)

const (
	defaultPort = 9095
	pidFileName = ".cyberpet-desktop.pid"
	appName     = "CyberPet Desktop"
)

func main() {
	foreground := flag.Bool("foreground", false, "在前台运行（不开浏览器）")
	daemon := flag.Bool("daemon", false, "以守护进程方式运行")
	status := flag.Bool("status", false, "查看运行状态")
	stop := flag.Bool("stop", false, "停止运行中的实例")
	port := flag.Int("port", defaultPort, "HTTP 服务监听端口")
	flag.Parse()

	home, _ := os.UserHomeDir()
	pidPath := filepath.Join(home, pidFileName)

	if *status {
		showStatus(pidPath)
		return
	}

	if *stop {
		stopInstance(pidPath)
		return
	}

	_ = daemon // daemon mode: just run in background via shell redirect

	// 单例检查
	if checkAlreadyRunning(pidPath) {
		log.Fatalf("%s 已在运行（PID 文件: %s）\n使用 --stop 停止它", appName, pidPath)
	}

	// 写 PID 文件
	if err := server.WritePIDFile(pidPath); err != nil {
		log.Printf("警告：无法写入 PID 文件: %v", err)
	}
	defer server.RemovePIDFile(pidPath)

	srv := server.New(*port)

	errCh := make(chan error, 1)
	go func() {
		errCh <- srv.Start()
	}()

	// 等一下确保服务启动
	time.Sleep(300 * time.Millisecond)

	if !*foreground {
		url := fmt.Sprintf("http://localhost:%d", *port)
		log.Printf("[%s] 打开浏览器: %s", appName, url)
		openBrowser(url)
	}

	log.Printf("[%s] 运行中，端口 %d，按 Ctrl+C 退出", appName, *port)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-errCh:
		if err != nil {
			log.Fatalf("服务器错误: %v", err)
		}
	case sig := <-quit:
		log.Printf("收到信号 %v，关闭中...", sig)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(ctx)
	log.Printf("[%s] 已关闭", appName)
}

func openBrowser(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	default:
		cmd = exec.Command("xdg-open", url)
	}
	_ = cmd.Start()
}

func checkAlreadyRunning(pidPath string) bool {
	data, err := os.ReadFile(pidPath)
	if err != nil {
		return false
	}
	pid, err := strconv.Atoi(string(data))
	if err != nil {
		return false
	}
	proc, err := os.FindProcess(pid)
	if err != nil {
		return false
	}
	return proc.Signal(syscall.Signal(0)) == nil
}

func showStatus(pidPath string) {
	data, err := os.ReadFile(pidPath)
	if err != nil {
		fmt.Printf("%s 未运行\n", appName)
		return
	}
	pid, _ := strconv.Atoi(string(data))
	proc, err := os.FindProcess(pid)
	if err != nil || proc.Signal(syscall.Signal(0)) != nil {
		fmt.Printf("%s 未运行（PID 文件残留）\n", appName)
		return
	}
	fmt.Printf("%s 运行中 (PID %d)\n", appName, pid)
}

func stopInstance(pidPath string) {
	data, err := os.ReadFile(pidPath)
	if err != nil {
		fmt.Printf("%s 未运行\n", appName)
		return
	}
	pid, _ := strconv.Atoi(string(data))
	proc, err := os.FindProcess(pid)
	if err != nil {
		fmt.Printf("找不到进程 %d\n", pid)
		return
	}
	if err := proc.Signal(syscall.SIGTERM); err != nil {
		fmt.Printf("发送停止信号失败: %v\n", err)
		return
	}
	fmt.Printf("%s (PID %d) 已发送停止信号\n", appName, pid)
}

func init() {
	log.SetFlags(log.LstdFlags | log.Lmsgprefix)
	log.SetPrefix(fmt.Sprintf("[cyberpet pid=%d] ", os.Getpid()))
}
