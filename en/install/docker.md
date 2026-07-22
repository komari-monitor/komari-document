# Docker Deployment

This guide starts Komari with Docker and stores all persistent data in a local `data` directory.

## TLDR

```bash
mkdir -p ./data
docker run -d \
  -p 25774:25774 \
  -v $(pwd)/data:/app/data \
  --name komari \
  --restart unless-stopped \
  ghcr.io/komari-monitor/komari:latest
```

:::tip
If no external database options are provided, Komari uses SQLite by default. Run the container with `--help` to inspect supported startup flags.
:::

## Install Docker

If Docker is not installed yet, install it first:

```bash
bash <(curl -sL get.docker.com)
docker --version
```

## Create a Data Directory

```bash
mkdir -p ./data
```

The mounted `data` directory stores Komari settings, accounts, and monitoring records. Back it up regularly.

## Start Komari

```bash
docker run -d \
  -p 25774:25774 \
  -v $(pwd)/data:/app/data \
  --name komari \
  --restart unless-stopped \
  ghcr.io/komari-monitor/komari:latest
```

This command:

- Pulls the latest Komari image.
- Publishes Komari on port `25774`.
- Mounts `./data` into `/app/data`.
- Restarts the container automatically unless it was stopped manually.

## Open the Dashboard and Complete Setup

Open one of these URLs:

- Local machine: `http://localhost:25774`
- Remote server: `http://<your-server-ip>:25774`

On first access, the installation guide creates the administrator account and site settings. If the page does not open, check that the container is running and that your firewall allows access to port `25774`.

## Docker Compose

Create `docker-compose.yml`:

```yaml
services:
  komari:
    image: ghcr.io/komari-monitor/komari:latest
    container_name: komari
    ports:
      - "25774:25774"
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

Start it:

```bash
docker compose up -d
```

Older installations may use `docker-compose` instead of `docker compose`.

## Common Commands

```bash
docker stop komari
docker start komari
docker restart komari
docker logs -f komari
```

With Docker Compose:

```bash
docker compose down
docker compose restart
docker compose ps
docker compose logs -f komari
```
