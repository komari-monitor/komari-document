# 快速安装

我们提供了一键脚本和 Docker 镜像，方便您快速部署 Komari。

## 方式1：使用一键管理脚本

适用于使用了 `systemd` 的发行版（Ubuntu、Debian...）。

```bash
curl -fsSL https://raw.githubusercontent.com/komari-monitor/komari/main/install-komari.sh -o install-komari.sh
chmod +x install-komari.sh
sudo ./install-komari.sh
```

## 方式2：使用 Docker

```bash
mkdir -p ./data
docker run -d \
  -p 25774:25774 \
  -v $(pwd)/data:/app/data \
  --name komari \
  ghcr.io/komari-monitor/komari:latest
docker logs komari
```

访问 `http://<your-ip>:25774` 即可看到 Komari 的仪表盘。

## 其他安装方式

如果您需要更详细的安装指南，请参考：

- [Docker 部署](/install/docker)
- [二进制安装](/install/binary)
- [手动编译](/install/compile)
- [更新](/install/update)
