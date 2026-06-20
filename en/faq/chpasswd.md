# Reset Password

Use the `chpasswd` command to reset the Komari admin password.

## TLDR

```bash
./komari chpasswd -p <password>
```

Command help:

```text
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
  -t, --db-type string    Database type (sqlite) [env: KOMARI_DB_TYPE] (default "sqlite")
```

## Binary Deployment

Run the command from the directory that contains the Komari executable and the `data` directory.

Windows:

```powershell
.\komari.exe chpasswd -p MySecurePass123
```

Linux and macOS:

```bash
./komari chpasswd -p MySecurePass123
```

If the database is not at the default path, pass `-d`:

```bash
./komari chpasswd -p MySecurePass123 -d /path/to/data/komari.db
```

## Docker Deployment

```bash
docker exec komari /app/komari chpasswd -p MySecurePass123
```

If needed, specify the database path:

```bash
docker exec komari /app/komari chpasswd -p MySecurePass123 -d /app/data/komari.db
```

## Verify

After the command succeeds, sign in with username `admin` and the new password. Restart Komari if your deployment requires it:

```bash
docker restart komari
```

Back up the `data` directory before modifying the database.
