# Update Guide

This guide updates the Komari server panel while keeping the existing data directory.

:::warning
Before updating, back up your data from the admin settings or back up the mounted `data` directory directly.
:::

## Docker Update

Pull the latest image:

```bash
docker pull ghcr.io/komari-monitor/komari:latest
```

Stop and remove the old container:

```bash
docker stop komari
docker rm komari
```

Start a new container with the same volume mapping:

```bash
docker run -d \
  -p 25774:25774 \
  -v $(pwd)/data:/app/data \
  --name komari \
  --restart unless-stopped \
  ghcr.io/komari-monitor/komari:latest
```

The container is recreated, but the local `data` directory remains.

## Docker Compose Update

Run these commands in the directory containing `docker-compose.yml`:

```bash
docker compose pull
docker compose up -d
```

Older installations may use:

```bash
docker-compose pull
docker-compose up -d
```

## Binary Update

1. Stop the running Komari process or service.
2. Download the new binary from the [GitHub Releases page](https://github.com/komari-monitor/komari/releases).
3. Replace the old binary.
4. Start Komari again.

For a systemd service:

```bash
sudo systemctl stop komari
# replace the binary
sudo systemctl start komari
sudo systemctl status komari
```

## Agent Updates

- If auto update is enabled, the agent checks for updates periodically.
- If auto update is disabled, rerun the agent install command to update it.

## Verify

Open your Komari dashboard and confirm that nodes, settings, accounts, and historical data are still present.
