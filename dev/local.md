# 本地开发指南

Komari 使用了 Go + React 技术栈进行开发。如果您想在本地进行二次开发或调试，可以参考以下步骤：

## 环境准备

0. 安装 [Git](https://git-scm.com/)。

1. 安装 [Go](https://go.dev/dl/)（`komari-server` 要求 `1.25` 及以上；`komari-agent` 要求 `1.24` 及以上）。

2. 安装 [Node.js](https://nodejs.org/)（建议版本 `22` 及以上）。

3. 安装 `zstd` 与 C 编译器（如 Linux 下 `gcc` / `build-essential`），因为服务端依赖 `go-sqlite3`（需要 `CGO_ENABLED=1`）。

## 克隆源码

使用 Git 克隆 Komari 源码仓库：

1. 后端

```bash
git clone https://github.com/komari-monitor/komari
```

2. 前端

```bash
git clone https://github.com/komari-monitor/komari-web
```

3. Agent

```bash
git clone https://github.com/komari-monitor/komari-agent
```

## 构建前端静态文件

Komari 的后端使用 go-embed 将 `dist.tar.zst` 打包进二进制文件，并在启动时解压到内存。因此，在启动后端服务之前，<span style="color: red; font-weight: bold;">必须</span>先构建前端并生成归档。

```bash
cd komari-web
npm install
npm run build
```

生成的静态文件位于 `dist` 目录下，将其打包到后端源码的 `web/public/defaultTheme/dist.tar.zst`；同时复制 `komari-theme.json`，用于后台读取默认主题元数据和可管理配置：

```bash
mkdir -p ../komari/web/public/defaultTheme
tar -cf /tmp/komari-dist.tar -C dist .
zstd -19 -T0 -f /tmp/komari-dist.tar -o ../komari/web/public/defaultTheme/dist.tar.zst
rm -f /tmp/komari-dist.tar
cp komari-theme.json ../komari/web/public/defaultTheme/
```

## 启动后端服务

```bash
cd ../komari
CGO_ENABLED=1 go run . server -l 127.0.0.1:25774
```

如仅调试前端页面，可在打包一次默认主题后保持后端运行，并在 `komari-web` 目录启动 Vite 开发服务器（通过 `VITE_API_TARGET` 将 `/api` 与 `/themes` 代理到后端）：

```bash
cd ../komari-web
VITE_API_TARGET=http://127.0.0.1:25774 npm run dev
```

## 启动 Agent 服务

```bash
cd ../komari-agent
go run . --disable-auto-update -e http://127.0.0.1:25774 -t <Your Token>
```
