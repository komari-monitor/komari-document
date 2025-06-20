# 强制取消2FA

## TLDR

```bash
Force disable 2FA

Usage:
  Komari disable-2fa [flags]

Flags:
  -h, --help   help for disable-2fa

Global Flags:
  -d, --database string   SQLite database file path [env: KOMARI_DB_FILE] (default "./data/komari.db")
      --db-host string    MySQL/Other database host address [env: KOMARI_DB_HOST] (default "localhost")
      --db-name string    MySQL/Other database name [env: KOMARI_DB_NAME] (default "komari")
      --db-pass string    MySQL/Other database password [env: KOMARI_DB_PASS]
      --db-port string    MySQL/Other database port [env: KOMARI_DB_PORT] (default "3306")
  -t, --db-type string    Database type (sqlite, mysql) [env: KOMARI_DB_TYPE] (default "sqlite")
      --db-user string    MySQL/Other database username [env: KOMARI_DB_USER] (default "root")
```