# 重置密码教程


## 快速上手（TLDR）

如果你能看懂以下内容并且知道自己在干什么，那么你可以直接参考以下命令

```bash
$ ./komari chpasswd --help
./komari chpasswd -p <password>

Force change password

Usage:
  Komari chpasswd [flags]

Examples:
komari chpasswd -p <password>

Flags:
  -h, --help              help for chpasswd
  -p, --password string   New password

Global Flags:
  -d, --database string   SQLite database file path [env: KOMARI_DB_FILE] (default "./data/komari.db")
      --db-host string    MySQL/Other database host address [env: KOMARI_DB_HOST] (default "localhost")
      --db-name string    MySQL/Other database name [env: KOMARI_DB_NAME] (default "komari")
      --db-pass string    MySQL/Other database password [env: KOMARI_DB_PASS]
      --db-port string    MySQL/Other database port [env: KOMARI_DB_PORT] (default "3306")
  -t, --db-type string    Database type (sqlite, mysql) [env: KOMARI_DB_TYPE] (default "sqlite")
      --db-user string    MySQL/Other database username [env: KOMARI_DB_USER] (default "root")
```

## 教程：重置 Komari 密码
下面提供一个使用 Markdown 语法编写的简化版重置 Komari 密码教程，无论你是在 Windows、Linux 还是 Docker 环境下，都可以参照以下步骤操作：


## 1. 基础准备

- 确保你有 Komari 的可执行文件：
  - Windows 下为 `komari.exe`；
  - Linux/Mac 下为 `komari`。
- 同目录下需存在 `data` 文件夹，里面包含 `komari.db`（存储密码的数据库）。


## 2. 打开终端并切换目录

- **Windows（PowerShell）**
  ```powershell
  cd C:\komari
  ```

- **Linux/Mac**
  ```bash
  cd ~/komari
  ```


## 3. 执行重置密码命令

将下面命令中的 `新密码` 替换为你想设置的新密码（比如 `MySecurePass123`）。

**二进制部署（适用于 Windows 和 Linux/Mac）：**

- Windows:
  ```powershell
  .\komari.exe chpasswd -p MySecurePass123
  ```
- Linux/Mac:
  ```bash
  ./komari chpasswd -p MySecurePass123
  ```

> 若数据库路径非默认（`data/komari.db`），可用 `-d` 参数指定：
> ```bash
> ./komari chpasswd -p MySecurePass123 -d /path/to/data/komari.db
> ```


## 4. Docker 部署用户

1. 确认容器正在运行：
   ```bash
   docker ps
   ```
2. 在容器内执行重置密码命令：
   ```bash
   docker exec komari /app/komari chpasswd -p MySecurePass123
   ```
   
> 若数据库路径不是默认的，同样可加 `-d` 参数：
> ```bash
> docker exec komari /app/komari chpasswd -p MySecurePass123 -d /app/data/komari.db
> ```

## 5. 验证

- 成功执行后，终端会提示 “Password changed successfully”。
- 重启 Komari（如需要）：
  - 二进制部署：重新运行 `komari server`；
  - Docker 部署：使用 `docker restart komari` 重启容器。
- 用浏览器访问 Komari（例如 `http://localhost:25774` 或服务器 IP），以默认用户名 `admin` 和新密码登录验证效果。

## 小贴士

- **安全性**：建议设置复杂密码，包含字母、数字和符号。
- **备份数据**：重置密码会修改 `data/komari.db`，改动前请适当备份 `data` 文件夹。
- **故障排查**：如遇问题，请检查当前目录、命令格式或 Docker 容器名称，必要时查看日志（Docker 下使用 `docker logs komari`）。

这样，无论你使用哪种平台，都能快速重置 Komari 的密码。

## 遇到其他问题？

- **日志怎么看？**
  - 二进制部署：启动 Komari 时看终端输出。
  - Docker：用 `docker logs komari` 查看。
- **还是搞不定？**
  - 把终端的错误信息复制下来，贴到在[这里](https://github.com/komari-monitor/komari/issues/new?template=general_issue.md)提问。
