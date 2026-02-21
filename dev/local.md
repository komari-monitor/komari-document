# 本地开发指南

Komari 使用了 Go + React 技术栈进行开发。如果您想在本地进行二次开发或调试，可以参考以下步骤：

## 环境准备

0. 安装 [Git](https://git-scm.com/)。

1. 安装 [Go](https://go.dev/dl/)（建议版本 1.24 及以上）。

2. 安装 [Node.js](https://nodejs.org/)（建议版本 20 及以上）。

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

Komari 的后端使用了 go-embed 功能将前端静态文件打包进二进制文件中。因此，在启动后端服务之前，<span style="color: red; font-weight: bold;">必须</span>先构建前端静态文件。（或塞一个假的 index.html ，总是要确保 public/dist 目录存在且包含 index.html 文件）

```bash
cd komari-web
npm install
npm run build
```

生成的静态文件位于 `dist` 目录下，将其复制到后端源码的 `public/dist` 目录中：

```bash
cp -r dist/* ../komari/public/defaultTheme/dist/
```

## 启动后端服务

```bash
cd ../komari
go run main.go server -l localhost:25774
```

## 启动 Agent 服务

```bash
cd ../komari-agent
go run main.go --disable-auto-update -e http://localhost:25774 -t <Your Token>
```
