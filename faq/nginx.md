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
- 其他 `proxy_set_header` 用于保留客户端真实 IP 和主机信息。

## 3. 常见问题

- **连接失败/断开**：请确认后端服务监听地址与端口正确，且 Nginx 配置已 reload。
- **实在无法处理 ws 反向代理**：1.0.8 版本开始，只有终端强制使用 Websocket，如果无法建立ws连接，会回落到 POST 请求（仅默认主题）。部分第三方主题可能需要 Websocket 支持，此时可以在 `后台-设置-站点` 中打开 `允许跨域请求`，将绕过Origin校验。

## 4. 应用配置

修改完配置后，记得重载 Nginx：

```shell
sudo nginx -s reload
```

如需 HTTPS，请将 `listen 80;` 改为 `listen 443 ssl;` 并补充 SSL 相关配置。

## 5. 兼容哪吒的gRpc代理示例

```nginx
location ^~ /proto.NezhaService/ {
    grpc_set_header Host $host;
    grpc_read_timeout 600s;
    grpc_send_timeout 600s;
    grpc_socket_keepalive on;
    client_max_body_size 10m;
    grpc_buffer_size 4m;
    grpc_pass grpc://127.0.0.1:5555;
}
```

另：

- 若使用了 Cloudflare，请确保在 Cloudflare 的设置中，启用gRPC代理功能。
- 如果使用了 HTTPS，请打开哪吒的TLS支持。
- 兼容哪吒为娱乐功能，并无长期维护打算。
- NTR爱好者狂喜。