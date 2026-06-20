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

Copy the frontend output and theme metadata into the backend project:

```bash
mkdir -p web/public/defaultTheme/dist
cp -r ../komari-web/dist/* web/public/defaultTheme/dist/
cp ../komari-web/komari-theme.json web/public/defaultTheme/
```

Build Komari:

```bash
CGO_ENABLED=1 go build -o komari
```

## Run

```bash
./komari server -l 0.0.0.0:25774
```

The default port is `25774`. Open `http://localhost:25774` to access the dashboard.
