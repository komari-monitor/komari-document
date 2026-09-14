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
   将步骤1中生成的 `dist` 打包为 `tar + zstd -19`，并复制主题配置文件。后端启动时会将归档解压到内存中使用：
   ```bash
   mkdir -p web/public/defaultTheme
   tar -cf /tmp/komari-dist.tar -C ../komari-web/dist .
   zstd -19 -T0 -f /tmp/komari-dist.tar -o web/public/defaultTheme/dist.tar.zst
   rm -f /tmp/komari-dist.tar
   cp ../komari-web/komari-theme.json web/public/defaultTheme/
   ```
   如果系统尚未安装 `zstd`，请先安装对应发行版的软件包。
   ```bash 
   CGO_ENABLED=1 go build -o komari
   ```
3. 运行：
   ```bash
   ./komari server -l 0.0.0.0:25774
   ```
   默认监听 `25774` 端口，访问 `http://localhost:25774`。
