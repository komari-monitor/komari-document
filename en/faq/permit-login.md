# Allow Password Login

## TL;DR

If you already know what you are doing, the command is:

```bash
$ ./komari permit-login --help
./komari permit-login

Force permit password login

Usage:
  Komari permit-login [flags]

Flags:
  -h, --help   help for permit-login

Global Flags:
  -d, --database string   SQLite database file path (default "./data/komari.db")
  -t, --db-type string    Database type (sqlite) (default "sqlite")
```

The steps below walk through the same recovery on Windows, Linux, and Docker.

## 1. Before You Start

- Make sure you have the Komari executable:
  - `komari.exe` on Windows;
  - `komari` on Linux/Mac.
- A `data` folder must exist next to it, containing `komari.db` (the database that stores login settings).

## 2. Open a Terminal in the Komari Directory

- **Windows (PowerShell)**

  ```powershell
  cd C:\komari
  ```

- **Linux/Mac**

  ```bash
  cd ~/komari
  ```

## 3. Run the Command

Use this when you turned on **Disable password login** by mistake and have not bound an SSO provider, so you can no longer sign in to the admin panel:

**Binary deployment (Windows and Linux/Mac):**

- Windows:

  ```powershell
  .\komari.exe permit-login
  ```

- Linux/Mac:

  ```bash
  ./komari permit-login
  ```

If the database is not in the default location, specify it with `-d`:

```bash
./komari permit-login -d /path/to/data/komari.db
```

## 4. Docker Deployment

1. Confirm the container is running:

   ```bash
   docker ps
   ```

2. Run the command inside the container:

   ```bash
   docker exec komari /app/komari permit-login
   ```

Back up the data directory before account recovery operations.

## 5. Verify

- On success, the terminal prints `Password login has been permitted.` and `Please restart the server to apply the changes.`
- Restart Komari to apply the change:
  - Binary deployment: restart the `komari server` process or the corresponding systemd service;
  - Docker deployment: run `docker restart komari`.
- Open Komari in your browser (for example `http://localhost:25774` or your server IP) and try signing in with your username and password.

## Tips

- **When to use this**: you disabled password login by mistake, have no SSO bound, and are locked out of the admin panel.
- **Troubleshooting**: check your current directory, the command syntax, and the Docker container name; check the logs if needed (`docker logs komari` for Docker).

## Still Stuck?

- **Where are the logs?**
  - Binary deployment: watch the terminal output while Komari starts.
  - Docker: use `docker logs komari`.
- **Still not working?**
  - Copy the error output from your terminal and ask in [a new issue](https://github.com/komari-monitor/komari/issues/new?template=general_issue.md).
