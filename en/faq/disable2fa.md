# Disable 2FA

Use this command when you need to forcibly disable two-factor authentication for the local Komari database.

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

## Binary Deployment

```bash
./komari disable-2fa
```

With a custom database path:

```bash
./komari disable-2fa -d /path/to/data/komari.db
```

## Docker Deployment

```bash
docker exec komari /app/komari disable-2fa
```

Back up the data directory before making account recovery changes.
