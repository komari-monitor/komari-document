# 使用 Nginx 反向代理

## 1. 基本配置示例

假设你的 Komari 服务运行在本地 `127.0.0.1:25774`，可以在 Nginx 配置文件中使用如下内容：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:25774;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";

        # 禁用代理缓冲
        proxy_buffering off;

        # 允许大文件上传（50M）
        client_max_body_size 50M;
    }
}
```

## 2. 重点参数说明

- `proxy_set_header Upgrade $http_upgrade;` 和 `proxy_set_header Connection "Upgrade";` 确保启用 WebSocket
- `proxy_http_version 1.1;` 必须设置为 1.1，WebSocket 仅支持 HTTP/1.1。
- `proxy_set_header Host $host;` 与 `proxy_set_header X-Forwarded-Proto $scheme;` 用于保留真实访问域名与协议，服务端会基于 `Host` 校验 HTTP API 与 WebSocket 的 `Origin` 请求头，并据此拼接 OAuth 回调地址与 Cookie `Secure` 属性。

## 3. 常见问题

- **连接失败/断开**：请确认后端服务监听地址与端口正确，且 Nginx 配置已 reload。
- **HTTP API / WebSocket 报 `403`（Origin 校验失败）**：服务端默认开启 `cors_origin_check_enabled`（校验所有 `/api/*` 请求的 `Origin` 与 `Host`）和 `ws_origin_check_enabled`（校验 WebSocket 的 `Origin`）。如通过反代或独立域名访问出现跨域拦截，请检查 `proxy_set_header Host $host;` 是否正确透传，或在 `后台-设置-站点` 中调整对应的 `CORS` / `WebSocket Origin` 校验与允许列表。
- **实在无法处理 ws 反向代理**：1.0.8 版本开始，只有终端强制使用 WebSocket，如果无法建立 ws 连接，会回落到 POST 请求（仅默认主题）。部分第三方主题可能需要 WebSocket 支持。

## 4. 应用配置

修改完配置后，记得重载 Nginx：

```shell
sudo nginx -s reload
```

如需 HTTPS，请将 `listen 80;` 改为 `listen 443 ssl;` 并补充 SSL 相关配置。
