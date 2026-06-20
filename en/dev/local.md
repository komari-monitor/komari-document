# Local Development

Use this page as the English entry point for local Komari development.

## Typical Workflow

1. Clone the backend repository.
2. Clone and build the frontend theme.
3. Copy the built theme assets into the backend's default theme directory.
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
mkdir -p web/public/defaultTheme/dist
cp -r ../komari-web/dist/* web/public/defaultTheme/dist/
cp ../komari-web/komari-theme.json web/public/defaultTheme/
go run . server -l 127.0.0.1:25774
```

For the original Chinese guide, see [Local development](/dev/local).
