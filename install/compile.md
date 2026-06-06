# 手动编译安装

1. 构建前端静态文件：
   ```bash
   git clone https://github.com/komari-monitor/komari-web
   cd komari-web
   npm install
   npm run build
   ```
2. 构建后端：
   ```bash
   git clone https://github.com/komari-monitor/komari
   cd komari
   ```
   将步骤1中生成的静态文件复制到 `komari` 项目中的 `web/public/defaultTheme/dist` 文件夹，并复制主题配置文件：
   ```bash
   mkdir -p web/public/defaultTheme/dist
   cp -r ../komari-web/dist/* web/public/defaultTheme/dist/
   cp ../komari-web/komari-theme.json web/public/defaultTheme/
   ```
   ```bash 
   CGO_ENABLED=1 go build -o komari
   ```
3. 运行：
   ```bash
   ./komari server -l 0.0.0.0:25774
   ```
   默认监听 `25774` 端口，访问 `http://localhost:25774`。
