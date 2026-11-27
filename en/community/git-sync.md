# Sync Node IPs to Git

:::warning Compatibility notice
`komari-git-sync` reads the `clients` table directly from the local SQLite database (`komari.db`). For newer Komari deployments, prefer using the official API or RPC endpoints rather than reading internal database tables directly.
:::

> Project: [GitHub](https://github.com/constansino/komari-git-sync)
>
> Author: [constansino](https://github.com/constansino)

`komari-git-sync` is a community-maintained utility that automatically syncs node IP information from the Komari database to a Git repository, making it easy to track dynamic IP changes, audit history, or share data within a team.

## Use Cases

- Continuously record IP changes of dynamic hosts such as GCP instances.
- Keep node IP history in Git for auditing.
- Manage the sync script and the real data separately.

## How It Works

1. Read the `clients` table from the Komari SQLite database.
2. Extract `name / ipv4 / ipv6 / updated_at`.
3. Generate `nodes-ip.json`.
4. Export a database snapshot, `komari.db`.
5. Detect file changes and only then run `git add / commit / push`.

## Prerequisites

The target machine (the server running Komari) must have:

- `sqlite3` installed
- `git` installed
- `systemd` in use
- Access to the target Git repository (`PAT`, `SSH key`, or `gh auth` all work)

## Installation

### 1. Get the Project Files

```bash
git clone https://github.com/constansino/komari-git-sync.git
cd komari-git-sync
```

### 2. Install the Script and systemd Units

```bash
sudo install -m 755 komari-git-sync.sh /usr/local/bin/komari-git-sync.sh
sudo install -m 600 komari-git-sync.env.example /etc/komari-git-sync.env
sudo install -m 644 komari-git-sync.service /etc/systemd/system/komari-git-sync.service
sudo install -m 644 komari-git-sync.timer /etc/systemd/system/komari-git-sync.timer
```

### 3. Edit the Environment Variables

```bash
sudo nano /etc/komari-git-sync.env
```

At minimum, set:

```bash
REPO_URL=https://github.com/<your-name>/<your-private-repo>.git
BRANCH=main
```

If your Komari database lives elsewhere, update that too:

```bash
KOMARI_DB=/data/komari-monitor/data/komari.db
```

### 4. Start the Timer

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now komari-git-sync.timer
```

## Manual Test

```bash
sudo systemctl start komari-git-sync.service
sudo systemctl status --no-pager komari-git-sync.service
sudo tail -n 100 /var/log/komari-git-sync.log
```

## FAQ

### Logs show `REPO_URL is empty, skip`

The repository address has not been configured yet:

- Edit `/etc/komari-git-sync.env`.
- Fill in `REPO_URL`.

### Push fails (authentication issue)

Configure Git credentials for the server:

- `HTTPS + PAT`
- or `SSH key`
- or `gh auth login`

### Changing the default sync interval

Edit `OnUnitActiveSec` in `komari-git-sync.timer`, for example:

```ini
OnUnitActiveSec=30min
# or 2h / 6h / 1d
```

Then reload and restart the timer:

```bash
sudo systemctl daemon-reload
sudo systemctl restart komari-git-sync.timer
```

## Security Advice

- Store real node IP data in a private repository.
- Public repositories are better suited to scripts and documentation only.
- Never commit `token`s, keys, or other sensitive information to Git.

## Related Links

- Project repository: [constansino/komari-git-sync](https://github.com/constansino/komari-git-sync)
- Original guide: [README](https://github.com/constansino/komari-git-sync/blob/main/README.md)
