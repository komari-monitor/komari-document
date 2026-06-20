# Nginx Reverse Proxy

This example proxies `your-domain.com` to a Komari server running on `127.0.0.1:25774`.

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

        proxy_buffering off;
        client_max_body_size 50M;
    }
}
```

## Important Settings

- `proxy_http_version 1.1` is required for WebSocket.
- `Upgrade` and `Connection` headers allow WebSocket upgrades.
- `proxy_buffering off` helps with real-time behavior.
- `client_max_body_size 50M` allows larger uploads.

Reload Nginx after editing:

```bash
sudo nginx -s reload
```

## WebSocket Troubleshooting

Starting with Komari `1.0.8`, the built-in theme can fall back to POST requests for most features when WebSocket is unavailable. The terminal still requires WebSocket. Some third-party themes may also require WebSocket.

If WebSocket fails, check the proxy config and the WebSocket Origin settings in the Komari admin dashboard.

## Nezha-compatible gRPC Proxy Example

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

If you use Cloudflare, enable gRPC proxy support in Cloudflare settings. If you use HTTPS, enable TLS support for the compatible Nezha endpoint.
