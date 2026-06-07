# 强制允许密码登录教程


## 快速上手（TLDR）

如果你能看懂以下内容并且知道自己在干什么，那么你可以直接参考以下命令

```bash
$ ./komari permit-login --help
./komari permit-login

Force permit password login

Usage:
  Komari permit-login [flags]

Flags:
  -h, --help   help for permit-login

Global Flags:
  -d, --database string   SQLite database file path [env: KOMARI_DB_FILE] (default "./data/komari.db")
  -t, --db-type string    Database type (sqlite) [env: KOMARI_DB_TYPE] (default "sqlite")
```

## 教程：开启**强制允许密码登录**
下面提供一个使用 Markdown 语法编写的简化版强制允许密码登录教程，无论你是在 Windows、Linux 还是 Docker 环境下，都可以参照以下步骤操作：


## 1. 基础准备

- 确保你有 Komari 的可执行文件：
  - Windows 下为 `komari.exe`；
  - Linux/Mac 下为 `komari`。
- 同目录下需存在 `data` 文件夹，里面包含 `komari.db`（存储登录相关的数据库）。


## 2. 打开终端并切换目录

- **Windows（PowerShell）**
  ```powershell
  cd C:\komari
  ```

- **Linux/Mac**
  ```bash
  cd ~/komari
  ```


## 3. 执行强制允许密码登录命令

当你误开启了**禁用密码登录**功能，且未绑定单点登录时，可以通过以下命令开启**强制允许密码登录**恢复：

**二进制部署（适用于 Windows 和 Linux/Mac）：**

- Windows:
  ```powershell
  .\komari.exe permit-login
  ```
- Linux/Mac:
  ```bash
  ./komari permit-login
  ```

## 4. Docker 部署用户

1. 确认容器正在运行：
   ```bash
   docker ps
   ```
2. 在容器内执行强制允许密码登录命令：
   ```bash
   docker exec komari /app/komari permit-login
   ```
   
## 5. 验证

- 成功执行后，终端会提示 “Force permit password login”。
- 重启 Komari（如需要）：
  - 二进制部署：重新运行 `komari server`；
  - Docker 部署：使用 `docker restart komari` 重启容器。
- 用浏览器访问 Komari（例如 `http://localhost:25774` 或服务器 IP），尝试用账号密码登录验证效果。

## 小贴士

- **使用场景**：适用于误开启了**禁用密码登录**功能且未绑定 SSO，导致无法登录后台的情况。
- **故障排查**：如遇问题，请检查当前目录、命令格式或 Docker 容器名称，必要时查看日志（Docker 下使用 `docker logs komari`）。

## 遇到其他问题？

- **日志怎么看？**
  - 二进制部署：启动 Komari 时看终端输出。
  - Docker：用 `docker logs komari` 查看。
- **还是搞不定？**
  - 把终端的错误信息复制下来，贴到在[这里](https://github.com/komari-monitor/komari/issues/new?template=general_issue.md)提问。
