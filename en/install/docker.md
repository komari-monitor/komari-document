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
docker logs komari
```

You may set the initial admin account with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

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

## Find the Initial Login

```bash
docker logs komari
```

Look for a line similar to:

```text
Default admin account created. Username: admin , Password: 2ioEnIPwn17a
```

Use that username and password for the first login.

## Open the Dashboard

Open one of these URLs:

- Local machine: `http://localhost:25774`
- Remote server: `http://<your-server-ip>:25774`

If the page does not open, check that the container is running and that your firewall allows access to port `25774`.

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
    environment:
      # Optional initial admin account:
      # ADMIN_USERNAME: admin
      # ADMIN_PASSWORD: yourpassword
    restart: unless-stopped
```

Start it:

```bash
docker compose up -d
docker compose logs komari
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
