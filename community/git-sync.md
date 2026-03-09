# 将 Komari 节点 IP 自动同步到 Git

> 项目地址：[Github](https://github.com/constansino/komari-git-sync)
>
> 开发者：[constansino](https://github.com/constansino)

`komari-git-sync` 是一个社区维护的小工具，用于把 Komari 数据库中的节点 IP 信息自动同步到 Git 仓库，方便追踪动态 IP 变化、审计历史记录，或在团队之间共享。

## 适用场景

- 需要持续记录 GCP 等动态 IP 的变化
- 需要把节点 IP 历史保存到 Git 中做审计
- 想把同步脚本和真实数据分开管理

## 工作原理

1. 从 Komari 的 SQLite 数据库读取 `clients` 表
2. 提取 `name / ipv4 / ipv6 / updated_at`
3. 生成 `nodes-ip.json`
4. 导出数据库快照 `komari.db`
5. 检测文件变化，有变化时再执行 `git add / commit / push`

## 前置条件

目标机（部署 Komari 的服务器）需要满足以下条件：

- 已安装 `sqlite3`
- 已安装 `git`
- 使用 `systemd`
- 服务器具备访问目标 Git 仓库的权限（`PAT`、`SSH key` 或 `gh auth` 均可）

## 安装步骤

### 1. 获取项目文件

```bash
git clone https://github.com/constansino/komari-git-sync.git
cd komari-git-sync
```

### 2. 安装脚本和 systemd unit

```bash
sudo install -m 755 komari-git-sync.sh /usr/local/bin/komari-git-sync.sh
sudo install -m 600 komari-git-sync.env.example /etc/komari-git-sync.env
sudo install -m 644 komari-git-sync.service /etc/systemd/system/komari-git-sync.service
sudo install -m 644 komari-git-sync.timer /etc/systemd/system/komari-git-sync.timer
```

### 3. 编辑环境变量

```bash
sudo nano /etc/komari-git-sync.env
```

至少需要设置：

```bash
REPO_URL=https://github.com/<your-name>/<your-private-repo>.git
BRANCH=main
```

如果你的 Komari 数据库路径不同，也需要一并修改：

```bash
KOMARI_DB=/data/komari-monitor/data/komari.db
```

### 4. 启动定时器

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now komari-git-sync.timer
```

## 手动测试

```bash
sudo systemctl start komari-git-sync.service
sudo systemctl status --no-pager komari-git-sync.service
sudo tail -n 100 /var/log/komari-git-sync.log
```

## 常见问题

### 日志显示 `REPO_URL is empty, skip`

说明尚未配置仓库地址：

- 编辑 `/etc/komari-git-sync.env`
- 填写 `REPO_URL`

### Push 失败（鉴权问题）

为服务器配置 Git 凭据：

- `HTTPS + PAT`
- 或 `SSH key`
- 或 `gh auth login`

### 不想使用默认同步周期

修改 `komari-git-sync.timer` 中的 `OnUnitActiveSec`，例如：

```ini
OnUnitActiveSec=30min
# 或 2h / 6h / 1d
```

修改后重新加载并重启定时器：

```bash
sudo systemctl daemon-reload
sudo systemctl restart komari-git-sync.timer
```

## 安全建议

- 真实节点 IP 数据建议存放在私有仓库中
- 公共仓库更适合仅保存脚本与文档
- 避免把 `token`、密钥等敏感信息提交进 Git

## 相关链接

- 项目仓库：[constansino/komari-git-sync](https://github.com/constansino/komari-git-sync)
- 原始说明：[README](https://github.com/constansino/komari-git-sync/blob/main/README.md)
