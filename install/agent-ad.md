# Agent 自动发现

Komari 支持自动发现功能，允许批量部署和管理多个 Agent 实例。通过自动发现密钥，Agent 可以自动注册到 Komari 监控系统中。

## 快速安装

### Linux/macOS

```bash
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e https://example.com --auto-discovery <AD Key>
```

### Windows

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "iwr 'https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.ps1' -UseBasicParsing -OutFile 'install.ps1'; & '.\install.ps1' '-e' 'https://example.com' '--auto-discovery' '<AD Key>'"
```

:::warning 注意
1. 请将 `https://example.com` 替换为您的 Komari 服务器地址。
2. 将 `<AD Key>` 替换为您的自动发现密钥。
3. 确保目标服务器可以访问 Komari 服务器地址。
:::

## 参数说明

### 必需参数

| 参数 | 说明 |
|------|------|
| `-e, --endpoint` | Komari 服务器地址，例如：`https://your-komari-server.com` |
| `--auto-discovery` | 自动发现密钥，用于批量注册 Agent |

### 可选参数

#### 更新和安全

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--disable-auto-update` | `false` | 禁用自动更新功能 |
| `--disable-web-ssh` | `false` | 禁用远程控制（Web SSH 和 RCE） |
| `-u, --ignore-unsafe-cert` | `false` | 忽略不安全的证书错误 |

#### 监控配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-i, --interval` | `1.0` | 数据上报间隔（秒） |
| `--info-report-interval` | `5` | 基础信息上报间隔（分钟） |
| `--memory-mode-available` | `false` | 内存使用率报告为可用内存而非已用内存 |

#### 网络和重连

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `-r, --max-retries` | `3` | 最大重试次数 |
| `-c, --reconnect-interval` | `5` | 重连间隔（秒） |

#### 网络接口过滤

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--include-nics` | 无 | 包含的网络接口列表（逗号分隔） |
| `--exclude-nics` | 无 | 排除的网络接口列表（逗号分隔） |

#### 磁盘监控

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--include-mountpoint` | 无 | 包含的挂载点列表（分号分隔） |
| `--month-rotate` | `0` | 网络统计月度重置（0 为禁用） |

## 使用示例

### 基础安装

最简单的自动发现安装：

```bash
# Linux/macOS
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e https://your-komari-server.com --auto-discovery your-ad-key

# Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "iwr 'https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.ps1' -UseBasicParsing -OutFile 'install.ps1'; & '.\install.ps1' '-e' 'https://your-komari-server.com' '--auto-discovery' 'your-ad-key'"
```

### 高级配置

包含多个配置参数的安装示例：

```bash
# Linux/macOS
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) \
  -e https://your-komari-server.com \
  --auto-discovery your-ad-key \
  --interval 2.0 \
  --disable-web-ssh \
  --exclude-nics "lo,docker0" \
  --info-report-interval 10

# Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "iwr 'https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.ps1' -UseBasicParsing -OutFile 'install.ps1'; & '.\install.ps1' '-e' 'https://your-komari-server.com' '--auto-discovery' 'your-ad-key' '--interval' '2.0' '--disable-web-ssh' '--exclude-nics' 'lo,docker0' '--info-report-interval' '10'"
```

### 生产环境推荐配置

适用于生产环境的安全配置：

```bash
# Linux/macOS
bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) \
  -e https://your-komari-server.com \
  --auto-discovery your-ad-key \
  --disable-web-ssh \
  --interval 5.0 \
  --max-retries 5 \
  --reconnect-interval 10 \
  --info-report-interval 15

# Windows
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "iwr 'https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.ps1' -UseBasicParsing -OutFile 'install.ps1'; & '.\install.ps1' '-e' 'https://your-komari-server.com' '--auto-discovery' 'your-ad-key' '--disable-web-ssh' '--interval' '5.0' '--max-retries' '5' '--reconnect-interval' '10' '--info-report-interval' '15'"
```

## 批量部署

### 使用脚本批量部署

创建批量部署脚本：

```bash
#!/bin/bash
# deploy-agents.sh

KOMARI_SERVER="https://your-komari-server.com"
AD_KEY="your-ad-key"
SERVERS=("server1.example.com" "server2.example.com" "server3.example.com")

for server in "${SERVERS[@]}"; do
    echo "正在部署到 $server..."
    ssh root@$server "bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) -e $KOMARI_SERVER --auto-discovery $AD_KEY"
done
```

### 使用 Ansible 批量部署

创建 Ansible playbook：

```yaml
# deploy-komari-agents.yml
---
- hosts: all
  vars:
    komari_server: "https://your-komari-server.com"
    ad_key: "your-ad-key"
  tasks:
    - name: 下载并执行 Komari Agent 安装脚本
      shell: |
        bash <(curl -sL https://raw.githubusercontent.com/komari-monitor/komari-agent/refs/heads/main/install.sh) \
          -e {{ komari_server }} \
          --auto-discovery {{ ad_key }} \
          --disable-web-ssh \
          --interval 5.0
```

## 注意事项

1. **自动发现密钥安全**：请确保 AD Key 的安全性，不要在公开场合暴露
2. **网络连通性**：确保目标服务器能够访问 Komari 服务器地址
3. **权限要求**：安装脚本需要管理员权限
4. **防火墙设置**：确保必要的端口已开放
5. **证书验证**：生产环境中避免使用 `--ignore-unsafe-cert` 参数

## 故障排除

### 常见问题

1. **连接失败**：检查网络连通性和防火墙设置
2. **证书错误**：确认服务器证书有效性
3. **权限不足**：确保以管理员身份运行安装脚本
4. **自动发现失败**：验证 AD Key 是否正确

### 查看日志

Agent 安装完成后，可以通过以下方式查看日志：

```bash
# Linux
sudo journalctl -u komari-agent -f

# 或查看日志文件
tail -f /var/log/komari-agent.log
```

