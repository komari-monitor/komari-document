# 使用 Nginx 代理 WebSocket 服务

在实际部署 WebSocket 服务时，常常需要使用 Nginx 作为反向代理。这样可以提升安全性、灵活性，并方便统一管理流量。下面将介绍如何配置 Nginx 以支持 WebSocket 代理。

## 1. 基本配置示例

假设你的 Komari 服务运行在本地 `127.0.0.1:25774`，可以在 Nginx 配置文件中添加如下内容：

```nginx
location ^~ / {
    proxy_pass http://127.0.0.1:25774;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header REMOTE-HOST $remote_addr;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
    proxy_http_version 1.1;
    proxy_ssl_server_name off;
    proxy_ssl_name $proxy_host;
}
```

## 2. 重点参数说明

- `proxy_set_header Upgrade $http_upgrade;` 和 `proxy_set_header Connection $http_connection;` 是 WebSocket 代理的关键，确保协议升级。
- `proxy_http_version 1.1;` 必须设置为 1.1，WebSocket 仅支持 HTTP/1.1。
- 其他 `proxy_set_header` 用于保留客户端真实 IP 和主机信息。

## 3. 常见问题

- **连接失败/断开**：请确认后端服务监听地址与端口正确，且 Nginx 配置已 reload。
- **跨域问题**：如需支持跨域，可在后端或 Nginx 增加 `add_header Access-Control-Allow-Origin *;`。

## 4. 完整配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location ^~ / {
        proxy_pass http://127.0.0.1:25774;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header REMOTE-HOST $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $http_connection;
        proxy_http_version 1.1;
        proxy_ssl_server_name off;
        proxy_ssl_name $proxy_host;
    }
}
```

## 5. 应用配置

修改完配置后，记得重载 Nginx：

```shell
sudo nginx -s reload
```

如需 HTTPS，请将 `listen 80;` 改为 `listen 443 ssl;` 并补充 SSL 相关配置。

