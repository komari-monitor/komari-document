## Komari 面板更新指南

> 如果您查找的是Agent的更新指南，请在右侧的目录大纲(移动端右上角)点击“Komari Agent 更新指南”。

本文档将指导您如何将 Komari 面板（主程序）更新到最新版本。此指南假设您是按照 [Docker 部署指南](../install/docker.md) 进行的安装。

更新过程的核心是使用最新的 Docker 镜像重新创建容器，同时确保挂载了原有的数据目录以保留所有数据。

### 步骤 1：拉取最新的 Docker 镜像

从 ghcr.io 拉取 Komari 的最新镜像，以确保您拥有最新的功能和修复。

```bash
docker pull ghcr.io/komari-monitor/komari:latest
```

### 步骤 2：停止并移除当前运行的容器

<span style="color: red; font-weight: bold;">请先在设置-账户中备份您的数据。</span>

您需要先停止并移除旧的 Komari 容器，才能使用新镜像启动新容器。

```bash
# 停止名为 komari 的容器
docker stop komari

# 移除名为 komari 的容器
docker rm komari
```

**注意**：此操作只会移除容器，您通过 `-v` 参数挂载到本地的数据卷（`data` 文件夹）不会被删除。

### 步骤 3：使用新镜像启动容器

使用与初次安装时相同的 `docker run` 命令来启动新的容器。**最关键的一步**是确保使用了完全相同的 `-v` 卷挂载参数，以链接到您现有的数据目录。

```bash
docker run -d \
  -p 25774:25774 \
  -v $(pwd)/data:/app/data \
  --name komari \
  ghcr.io/komari-monitor/komari:latest
```

**重要提示**：
-   请确保 `-v` 参数中的 `$(pwd)/data` 部分正确指向您之前创建的 `data` 文件夹的绝对路径。
-   如果您在初次安装时设置了自定义的环境变量（例如 `ADMIN_USERNAME`, `ADMIN_PASSWORD`），则无需在更新时再次指定，因为初始管理员账号已经创建。
-   如果您使用了 `docker-compose`，请在 `docker-compose.yml` 所在的目录执行 `docker-compose pull` 和 `docker-compose up -d` 来完成更新。

### 步骤 4：验证更新

容器启动后，请打开浏览器访问您的 Komari 地址（例如 `http://localhost:25774`）。您应该能看到界面已更新，并且您之前的所有配置和监控数据都保持不变。

## Komari Agent 更新指南

- 如果您打开了自动更新，Agent会每隔6小时自动检查更新并下载最新版本。
- 如果您没有打开自动更新，重新执行安装命令即可更新。