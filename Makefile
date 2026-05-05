BINARY_NAME=cyberpet-desktop
GO=/usr/local/go/bin/go
NPM=/root/.openclaw/node/bin/npm
VERSION=$(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
LDFLAGS=-ldflags "-X main.version=$(VERSION) -s -w"

.PHONY: all build frontend backend clean run dev help

all: frontend backend

## frontend: 构建前端 React 页面（输出到 internal/server/dist/）
frontend:
	cd web && $(NPM) install && $(NPM) run build

## backend: 编译 Go 二进制（需先构建前端）
backend:
	$(GO) build $(LDFLAGS) -o $(BINARY_NAME) .

## build: 完整构建（前端 + 后端）
build: frontend backend
	@echo "✅ 构建完成: ./$(BINARY_NAME)"

## run: 直接运行（前台模式）
run: build
	./$(BINARY_NAME) --foreground

## dev: 仅启动后端（开发前端时用 cd web && npm run dev）
dev: backend
	./$(BINARY_NAME) --foreground --port 9095

## clean: 清理构建产物
clean:
	rm -f $(BINARY_NAME)
	rm -rf internal/server/dist
	rm -rf web/node_modules

## cross: 跨平台构建
cross: frontend
	GOOS=linux   GOARCH=amd64 $(GO) build $(LDFLAGS) -o dist/$(BINARY_NAME)-linux-amd64 .
	GOOS=darwin  GOARCH=amd64 $(GO) build $(LDFLAGS) -o dist/$(BINARY_NAME)-darwin-amd64 .
	GOOS=darwin  GOARCH=arm64 $(GO) build $(LDFLAGS) -o dist/$(BINARY_NAME)-darwin-arm64 .
	GOOS=windows GOARCH=amd64 $(GO) build $(LDFLAGS) -o dist/$(BINARY_NAME)-windows-amd64.exe .
	@echo "✅ 跨平台构建完成，输出在 dist/"

## help: 显示帮助
help:
	@grep -E '^## ' Makefile | sed 's/## //'
