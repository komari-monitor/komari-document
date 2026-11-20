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
- `proxy_set_header Host $host` and `X-Forwarded-Proto $scheme` are required for Origin/CORS checks, OAuth callback URL construction, and `Secure` cookies.

Reload Nginx after editing:

```bash
sudo nginx -s reload
```

## WebSocket and Origin Troubleshooting

Starting with Komari `1.0.8`, the built-in theme can fall back to POST requests for most features when WebSocket is unavailable. The terminal still requires WebSocket. Some third-party themes may also require WebSocket.

Komari enables both API CORS Origin checking (`cors_origin_check_enabled`) and WebSocket Origin checking (`ws_origin_check_enabled`) by default. If API or WebSocket requests return `403`, verify `proxy_set_header Host $host;` or configure the allowed origins / origin checks in the admin site settings.
