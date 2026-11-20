# Allow Password Login

If password login has been disabled and you cannot sign in through another method, use the recovery command from the Komari executable.

## Binary Deployment

Run the command in the directory that contains the Komari executable and data directory:

```bash
./komari permit-login
```

On Windows:

```powershell
.\komari.exe permit-login
```

If the database is not in the default location, specify it with `-d`:

```bash
./komari permit-login -d /path/to/data/komari.db
```

## Docker Deployment

```bash
docker exec komari /app/komari permit-login
```

Restart Komari to apply the change:

```bash
docker restart komari
```

Back up the data directory before account recovery operations.
