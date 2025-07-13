# 非 Root 环境下安装和运行 Komari Agent

在某些情况下，您可能没有 root 权限或希望在用户空间运行 Komari Agent。本文档将指导您如何在非 root 环境下安装、运行和保活 Komari Agent。

## 前提条件

- 具有一个普通用户账户
- 确保用户具有写入主目录的权限
- 确保系统已安装 `curl` 命令
- 可选：安装 `screen` 或 `tmux` 用于后台运行（推荐）
- 网络连接正常，可以访问 GitHub 和目标监控服务器

## 1. 确定系统架构

在下载之前，首先确定您的系统架构：

```bash
# 查看系统架构
uname -m
```

常见架构对应的文件名：
- `x86_64` 或 `amd64` → `komari-agent-linux-amd64`（64位 x86 架构，最常用）
- `i386` 或 `i686` → `komari-agent-linux-386`（32位 x86 架构）
- `aarch64` 或 `arm64` → `komari-agent-linux-arm64`（64位 ARM 架构）
- `armv7l` → `komari-agent-linux-arm`（32位 ARM 架构）

**说明**：
- **amd64/x86_64**：适用于大多数现代的 PC 和服务器
- **386**：适用于较老的 32位 x86 系统
- **arm64**：适用于 ARM64 处理器（如树莓派 4、Apple M1 等）
- **arm**：适用于 32位 ARM 处理器（如较老的树莓派）

## 2. 下载 Komari Agent

请访问 [Github Releases](https://github.com/komari-monitor/komari-agent/releases) 页面，根据您的系统架构下载对应的文件：

- **amd64/x86_64**：适用于大多数现代的 PC 和服务器
- **386**：适用于较老的 32位 x86 系统  
- **arm64**：适用于 ARM64 处理器（如树莓派 4 等）
- **arm**：适用于 32位 ARM 处理器（如较老的树莓派）

**验证下载**

下载完成后，验证文件是否完整：

```bash
# 检查文件大小（应该大于 0）
ls -lh komari-agent

# 检查文件类型
file komari-agent
```

## 3. 赋予执行权限

在下载完成后，您需要为 Komari Agent 文件赋予执行权限：

```bash
chmod +x komari-agent
```

## 4. 获取运行参数

Komari Agent 通过命令行参数进行配置。您可以从一键安装脚本中获取运行参数。

**获取参数示例**

```bash
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e http://127.0.0.1 -t 1234567890 --install-xxx xxx
```

从一键安装脚本输出中，排除 `--install` 开头的参数，其余即为运行时所需参数。

例如，如果脚本显示的完整命令是：
```bash
./komari-agent -e http://127.0.0.1:8080 -t 1234567890abcdef
```

那么这就是您需要的运行参数。

## 5. 运行 Komari Agent

**基本启动方式**

在终端中运行以下命令来启动 Komari Agent：

```bash
./komari-agent [运行参数]
```

**启动示例**

```bash
# 使用您从安装脚本获取的参数
./komari-agent -e http://127.0.0.1:8080 -t 1234567890abcdef
```

**验证启动状态**

启动后，检查 Agent 是否正常运行：

```bash
# 检查进程
ps aux | grep komari-agent
```

## 6. 保活 Komari Agent

由于非 root 环境无法使用 systemd 服务，需要使用其他方法确保 Komari Agent 持续运行。

### 方法一：使用 nohup

`nohup` 命令可以让程序在后台运行，不受 SSH 断开影响。

```bash
# 使用 nohup 启动 Agent
nohup ./komari-agent -e http://127.0.0.1:8080 -t 1234567890abcdef > komari.log 2>&1 &

# 查看后台进程
jobs

# 查看进程 PID
ps aux | grep komari-agent

# 查看日志
tail -f komari.log

# 停止进程（使用 PID）
kill [PID]
```

### 方法二：使用 screen（推荐）

`screen` 是一个终端复用器，可以让程序在后台持续运行，即使 SSH 连接断开。

**安装 screen（如果尚未安装）**

```bash
# Ubuntu/Debian
sudo apt install screen

# CentOS/RHEL
sudo yum install screen
```

**使用 screen 运行 Agent**

```bash
# 创建一个名为 komari 的 screen 会话
screen -S komari

# 在 screen 会话中启动 Komari Agent
./komari-agent -e http://127.0.0.1:8080 -t 1234567890abcdef

# 分离 screen 会话（按 Ctrl+A，然后按 D）
# 现在可以安全地退出 SSH 连接，Agent 将继续运行
```

**管理 screen 会话**

```bash
# 查看所有 screen 会话
screen -ls

# 重新连接到 komari 会话
screen -r komari

# 终止 screen 会话（在会话内）
exit
# 或者按 Ctrl+A，然后按 K，再确认
```

## 故障排除

### 常见问题

1. **下载失败**
   ```bash
   # 检查网络连接
   ping -c 1 github.com
   
   # 使用代理下载（如果需要）
   curl --proxy http://proxy.example.com:8080 -L -o komari-agent "https://github.com/komari-monitor/komari-agent/releases/latest/download/komari-agent-linux-amd64"
   ```

2. **权限问题**
   ```bash
   # 确保文件有执行权限
   chmod +x komari-agent
   
   # 检查文件权限
   ls -l komari-agent
   ```

3. **连接服务器失败**
   ```bash
   # 检查服务器连通性
   nc -zv [服务器地址] [端口]
   ```

4. **Agent 启动后立即退出**
   ```bash
   # 前台运行、查看详细日志
   ./komari-agent -e http://127.0.0.1:8080 -t 1234567890
   ```

## 日志管理

```bash
# 查看实时日志
tail -f komari.log
```

## 性能监控

```bash
# 查看 Agent 资源使用情况
ps aux | grep komari-agent

# 查看系统负载
top -p $(pgrep komari-agent)
```