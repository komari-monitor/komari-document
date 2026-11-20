# 强制取消 2FA

当无法通过两步验证登录管理后台时，可以使用 `disable-2fa` 命令强制清空本地数据库中的 2FA 绑定。

## TLDR

```bash
./komari disable-2fa
```

命令帮助：

```text
Force disable 2FA

Usage:
  Komari disable-2fa [flags]

Flags:
  -h, --help   help for disable-2fa

Global Flags:
  -d, --database string   SQLite database file path (default "./data/komari.db")
  -t, --db-type string    Database type (sqlite) (default "sqlite")
```

## 二进制部署

在包含 Komari 可执行文件与 `data` 目录的路径下执行：

- Linux / macOS：
  ```bash
  ./komari disable-2fa
  ```
- Windows：
  ```powershell
  .\komari.exe disable-2fa
  ```

如数据库不在默认路径，可用 `-d` 指定：

```bash
./komari disable-2fa -d /path/to/data/komari.db
```

## Docker 部署

```bash
docker exec komari /app/komari disable-2fa
```

## 验证与生效

成功执行后终端会输出 `2FA has been disabled.` 和 `Please restart the server to apply the changes.`。请重启 Komari 服务或容器（`docker restart komari`）使修改生效。修改数据库前建议先备份 `data` 目录。
