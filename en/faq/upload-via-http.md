# Upload via HTTP

When a device cannot run the persistent Agent binary or WebSocket is unavailable, it can report metrics and poll tasks using HTTP POST requests against the Agent v2 JSON-RPC endpoint.

## Prerequisites

- A node created on the Komari server with its Client Token.
- An environment capable of scheduled HTTP requests.
- Endpoint: `POST /api/clients/v2/rpc?token={token}`

Legacy Agent v1 endpoints (`/api/clients/report`, `/api/clients/uploadBasicInfo`, `/api/clients/task/result`, etc.) have been removed.

## JSON-RPC Envelope

All requests use the JSON-RPC 2.0 envelope:

```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "method": "agent.basicInfo",
  "params": {}
}
```

Set `Content-Type: application/json`. Optional gzip compression is supported with `Content-Encoding: gzip` (pass the Client Token in the URL query parameter when compressing the body).

## Basic Information (`agent.basicInfo`)

Call on startup and periodically (recommended every 5–30 minutes):

```json
{
  "jsonrpc": "2.0",
  "id": "basic-info-1",
  "method": "agent.basicInfo",
  "params": {
    "info": {
      "arch": "amd64",
      "cpu_cores": 12,
      "cpu_physical_cores": 6,
      "cpu_name": "AMD Ryzen 9 9950X3D",
      "disk_total": 1099511627776,
      "gpu_name": "NVIDIA GeForce RTX 5090",
      "ipv4": "1.1.1.1",
      "ipv6": "2606:4700:4700::1111",
      "mem_total": 137438953472,
      "os": "Linux",
      "kernel_version": "6.8.0",
      "swap_total": 51539607552,
      "version": "custom-agent",
      "virtualization": "None"
    }
  }
}
```

## Real-time Monitoring (`agent.report`)

Call periodically (recommended every 5–8 seconds). Use `ack_event_ids` to acknowledge previously handled events:

```json
{
  "jsonrpc": "2.0",
  "id": "report-1",
  "method": "agent.report",
  "params": {
    "report": {
      "cpu": {"usage": 12.5},
      "ram": {"total": 1024, "used": 512},
      "swap": {"total": 1024, "used": 512},
      "load": {"load1": 0.1, "load5": 0, "load15": 0},
      "disk": {"total": 10, "used": 2},
      "network": {"up": 1, "down": 1, "totalUp": 1024, "totalDown": 1024},
      "connections": {"tcp": 12, "udp": 1},
      "uptime": 10000,
      "process": 10,
      "message": "status message"
    },
    "ack_event_ids": []
  }
}
```

## Pulling Server Events (`agent.pull`)

Devices without WebSocket can call `agent.pull` to receive queued `agent.ping`, `agent.exec`, `agent.terminal.request`, `agent.file`, `agent.startupConfig`, and `agent.switchVersion` events in `result.events`:

```json
{
  "jsonrpc": "2.0",
  "id": "pull-1",
  "method": "agent.pull",
  "params": {
    "capabilities": ["ping", "exec"],
    "ack_event_ids": []
  }
}
```

Report ping results with `agent.pingResult` and remote command results with `agent.taskResult` to the same `/api/clients/v2/rpc` endpoint. See [API](/en/dev/api) and [Agent Development](/en/dev/agent) for full schemas.
