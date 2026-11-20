# Local Development

Use this page as the English entry point for local Komari development.

## Prerequisites

- Git
- Go (`1.25+` for `komari`, `1.24+` for `komari-agent`)
- Node.js (`22+` recommended)
- `zstd` and a C compiler (`gcc` / `build-essential`, required by `go-sqlite3` with `CGO_ENABLED=1`)

## Typical Workflow

1. Clone the backend repository.
2. Clone and build the frontend theme.
3. Pack the frontend `dist` directory into `dist.tar.zst` in the backend's default theme directory.
4. Run the backend server locally.

Frontend build:

```bash
git clone https://github.com/komari-monitor/komari-web
cd komari-web
npm install
npm run build
```

Backend build:

```bash
git clone https://github.com/komari-monitor/komari
cd komari
mkdir -p web/public/defaultTheme
tar -cf /tmp/komari-dist.tar -C ../komari-web/dist .
zstd -19 -T0 -f /tmp/komari-dist.tar -o web/public/defaultTheme/dist.tar.zst
rm -f /tmp/komari-dist.tar
cp ../komari-web/komari-theme.json web/public/defaultTheme/
CGO_ENABLED=1 go run . server -l 127.0.0.1:25774
```

For frontend hot-reload development, run the Vite dev server against the running backend:

```bash
cd ../komari-web
VITE_API_TARGET=http://127.0.0.1:25774 npm run dev
```

Optional local agent run:

```bash
git clone https://github.com/komari-monitor/komari-agent
cd komari-agent
go run . --disable-auto-update -e http://127.0.0.1:25774 -t <Your Token>
```

For the original Chinese guide, see [Local development](/dev/local).
