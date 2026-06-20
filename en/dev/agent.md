# Agent Development

Komari Agent is a lightweight monitoring client that reports system information to the Komari server and receives server-side events.

## Protocol Overview

Agent protocol definitions live in `komari-agent/protocol`:

- `protocol/v1`: compatibility protocol. Real-time reports are sent as report JSON, while basic information and task results use separate HTTP APIs.
- `protocol/v2`: default protocol for server versions `1.2.1` and later. It uses JSON-RPC 2.0 for reports, tasks, messages, and events.
- `protocol/transport`: shared transport helpers such as gzip compression.

The default is `--protocol-version=2`. It can also be set with `AGENT_PROTOCOL_VERSION` or the configuration file.

## v2 Endpoints

- WebSocket: `GET /api/clients/v2/rpc?token={token}`
- POST fallback: `POST /api/clients/v2/rpc?token={token}`

The WebSocket channel is the preferred full-duplex transport. POST fallback keeps basic monitoring online when WebSocket is blocked by a proxy, CDN, firewall, or hosting environment.

## JSON-RPC Envelope

```json
{
  "jsonrpc": "2.0",
  "method": "agent.report",
  "params": {},
  "id": null
}
```

Common Agent-to-Server methods:

- `agent.report`
- `agent.basicInfo`
- `agent.pingResult`
- `agent.taskResult`
- `agent.event`
- `agent.pull`

Common Server-to-Agent methods:

- `agent.exec`
- `agent.ping`
- `agent.message`
- `agent.event`
- `agent.terminal.request`

## Basic Information Report

The agent reports static system information at startup and then periodically.

v1 endpoint:

```text
POST /api/clients/uploadBasicInfo?token={token}
```

v2 endpoint:

```text
POST /api/clients/v2/rpc?token={token}
```

Example payload:

```json
{
  "arch": "amd64",
  "cpu_cores": 12,
  "cpu_physical_cores": 6,
  "cpu_name": "AMD Ryzen 9 9950X3D",
  "disk_total": 1099511627776,
  "gpu_name": "NVIDIA GeForce RTX 5090",
  "ipv4": "1.1.1.1",
  "ipv6": "2606:4700:4700::1111",
  "mem_total": 137438953472,
  "os": "Windows 11 Home",
  "kernel_version": "26100.4652",
  "swap_total": 51539607552,
  "version": "0.0.1-rust",
  "virtualization": "None"
}
```

## Real-time Report

Default report interval is 1 second. In v2, use WebSocket when possible and POST fallback when WebSocket is unavailable.

Example report:

```json
{
  "cpu": {
    "usage": 12.5
  },
  "ram": {
    "total": 1024,
    "used": 512
  },
  "swap": {
    "total": 1024,
    "used": 512
  },
  "load": {
    "load1": 0.1,
    "load5": 0,
    "load15": 0
  },
  "disk": {
    "total": 10,
    "used": 2
  },
  "network": {
    "up": 1,
    "down": 1,
    "totalUp": 1024,
    "totalDown": 1024
  },
  "connections": {
    "tcp": 12,
    "udp": 1
  },
  "uptime": 10000,
  "process": 10,
  "message": "status message"
}
```

All capacity values are in bytes. The `message` field may be publicly visible, so do not put secrets in it.

## POST Fallback States

Recommended transport states:

| State | Description |
| --- | --- |
| `ws_connecting` | The agent is trying to establish WebSocket. |
| `ws_active` | WebSocket is connected and full-duplex features are available. |
| `post_fallback` | WebSocket failed; the agent reports through POST. |
| `recovering_ws` | POST fallback is active while the agent periodically retries WebSocket. |

POST fallback should continue reporting basic monitoring data and keep trying to recover WebSocket.

## Event Handling

The server may ask the agent to:

- Execute a remote command.
- Run a ping task.
- Show a message or event.
- Open a separate terminal WebSocket.

Remote control features must respect `--disable-web-ssh`.

## Configuration Flags

- `--endpoint`: server endpoint.
- `--token`: node token.
- `--ignore-unsafe-cert`: ignore TLS certificate errors.
- `--interval`: monitoring report interval in seconds.
- `--info-report-interval`: basic information report interval in minutes.
- `--reconnect-interval`: reconnect interval in seconds.
- `--max-retries`: maximum retry count.
- `--disable-auto-update`: disable automatic updates.
- `--disable-web-ssh`: disable remote control.
- `--memory-mode-available`: memory reporting mode.

The Chinese document contains a longer protocol design note and compatibility discussion: [Agent development](/dev/agent).
