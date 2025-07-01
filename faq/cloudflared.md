# 集成 Cloudflared Tunnels 指南

本文档介绍如何在 Komari 中集成 Cloudflared Tunnels。

## 1. 通过环境变量启用 Cloudflared

您可以通过设置以下环境变量来启用 Cloudflared Tunnels：

- `KOMARI_ENABLE_CLOUDFLARED`: 设置为 `true` 以启用 Cloudflared。
- `KOMARI_CLOUDFLARED_TOKEN`: 设置您的 Cloudflared Tunnel Token，例如 `eyJxxxxx`。

示例：

```bash
export KOMARI_ENABLE_CLOUDFLARED=true
export KOMARI_CLOUDFLARED_TOKEN=eyJxxxxx
```

## 2. Cloudflared 启动失败的处理

如果启用了 Cloudflared (`KOMARI_ENABLE_CLOUDFLARED=true`) 但 Komari 无法成功启动 Cloudflared Tunnel，Komari 将会退出。请检查您的 `KOMARI_CLOUDFLARED_TOKEN` 是否正确以及网络连接是否正常。

## 3. Docker 集成指南

有关 Komari Docker 部署的详细信息，请参阅 [Docker 教程](../install/docker.md)。

要在 Docker 中集成 Cloudflared Tunnels，您可以在运行 Komari 容器时通过 `-e` 参数传递环境变量。

示例 `docker run` 命令：

```bash
docker run -d \
  -p 25774:25774 \
  -v $(pwd)/data:/app/data \
  -e KOMARI_ENABLE_CLOUDFLARED=true \
  -e KOMARI_CLOUDFLARED_TOKEN=eyJxxxxx \
  --name komari \
  ghcr.io/komari-monitor/komari:latest
```

或者，您可以在 `docker-compose.yml` 文件中定义环境变量：

```yaml
version: '3.8'
services:
  komari:
    image: ghcr.io/komari-monitor/komari:latest
    environment:
      - KOMARI_ENABLE_CLOUDFLARED=true
      - KOMARI_CLOUDFLARED_TOKEN=eyJxxxxx
```
