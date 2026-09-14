# Build from Source

Build the frontend theme first, then build the Komari backend.

## Build the Frontend

```bash
git clone https://github.com/komari-monitor/komari-web
cd komari-web
npm install
npm run build
```

## Build the Backend

```bash
git clone https://github.com/komari-monitor/komari
cd komari
```

Pack the frontend `dist` directory with `tar + zstd -19`, then copy the theme metadata. The backend decompresses this archive into memory at startup:

```bash
mkdir -p web/public/defaultTheme
tar -cf /tmp/komari-dist.tar -C ../komari-web/dist .
zstd -19 -T0 -f /tmp/komari-dist.tar -o web/public/defaultTheme/dist.tar.zst
rm -f /tmp/komari-dist.tar
cp ../komari-web/komari-theme.json web/public/defaultTheme/
```

Install the `zstd` package first if it is not already available on your system.

Build Komari:

```bash
CGO_ENABLED=1 go build -o komari
```

## Run

```bash
./komari server -l 0.0.0.0:25774
```

The default port is `25774`. Open `http://localhost:25774` to access the dashboard.
