# Cloudflared

:::warning Version notice
This feature will be removed in the next major Komari release, `1.3`. Do not rely on this workflow for new production deployments, and plan a replacement for existing setups.
:::

Komari can run behind Cloudflare Tunnel. Make sure both the web dashboard and the agent connection endpoints can reach the Komari server.

## Basic Tunnel

Point your Cloudflare Tunnel service to the Komari HTTP address, usually:

```text
http://127.0.0.1:25774
```

Then access Komari through the public hostname configured in Cloudflare.

## WebSocket Notes

Komari agents and terminal features may use WebSocket connections. If a node cannot connect:

- Confirm that the tunnel route points to the correct local port.
- Confirm that WebSocket traffic is allowed by your proxy and access policy.
- Check the Komari server logs and agent logs.
- If needed, configure the WebSocket Origin allowlist in the admin dashboard.

## Cloudflare Access

If you protect Komari with Cloudflare Access, agents need the Access client ID and client secret in their configuration. See [Cloudflare Access Login](/en/community/cloudflare_access) for the user login side.
