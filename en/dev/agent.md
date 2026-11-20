# Agent Development

Komari Agent is a lightweight monitoring client that reports system information to the Komari server and receives server-side events over WebSocket and HTTP.

## Protocol Overview

Agent protocol definitions live in `komari-agent/protocol`:

- `protocol/v2`: the only supported protocol. It uses JSON-RPC 2.0 for reports, tasks, messages, and events.
- `protocol/transport`: shared transport helpers such as gzip compression.

The agent always uses `protocol/v2`. Compression is enabled by default and can be disabled with `--disable-compression` / `AGENT_DISABLE_COMPRESSION` (disabling both HTTP gzip and WebSocket `permessage-deflate`).

## v2 Endpoints

- WebSocket RPC: `GET /api/clients/v2/rpc?token={token}`
- POST fallback RPC: `POST /api/clients/v2/rpc?token={token}`
- Terminal WebSocket: `GET /api/clients/terminal?token={token}&id={request_id}`
- File transfer stream: `GET|POST /api/clients/transfer/:id`
- AutoDiscovery registration: `POST /api/clients/register` (uses `Authorization: Bearer <auto_discovery_key>`)

The WebSocket channel is the preferred full-duplex transport. POST fallback keeps monitoring and event delivery working when WebSocket is blocked by a proxy, CDN, firewall, or hosting environment.

## JSON-RPC Envelope

```json
{
  "jsonrpc": "2.0",
  "method": "agent.report",
  "params": {},
  "id": null
}
```

Agent-to-Server methods:

- `agent.report`
- `agent.basicInfo`
- `agent.pingResult`
- `agent.taskResult`
- `agent.file.result`
- `agent.startupConfig.result`
- `agent.event`
- `agent.pull` (used only in POST fallback / long-polling to fetch queued server events)

Server-to-Agent methods:

- `agent.exec`
- `agent.ping`
- `agent.message`
- `agent.event`
- `agent.terminal.request`
- `agent.file`
- `agent.startupConfig`
- `agent.switchVersion`

## Basic Information Report

The agent reports static system information at startup and periodically thereafter (default every 5 minutes).

Endpoint:

```text
POST /api/clients/v2/rpc?token={token}, method `agent.basicInfo`
```

Example payload:

```json
{
  "jsonrpc": "2.0",
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
      "os": "Windows 11 Home",
      "kernel_version": "26100.4652",
      "swap_total": 51539607552,
      "version": "0.0.1-rust",
      "virtualization": "None"
    }
  },
  "id": "basic-1"
}
```

## Real-time Report

The default report interval is **3.0 seconds** (with a runtime floor of `1.0` second). Use WebSocket when available and POST fallback when WebSocket is unavailable.

Example report:

```json
{
  "jsonrpc": "2.0",
  "method": "agent.report",
  "params": {
    "report": {
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
      "message": "status message",
      "gpu": {
        "count": 1,
        "average_usage": 15.0,
        "detailed_info": []
      }
    }
  },
  "id": null
}
```

All capacity values are in bytes. `gpu` is included only when `--gpu` is enabled. The `message` field may be publicly visible, so never put secrets in it.

## POST Fallback and Long Polling

Recommended transport states:

| State | Description |
| --- | --- |
| `ws_connecting` | The agent is trying to establish WebSocket. |
| `ws_active` | WebSocket is connected and full-duplex features are available. |
| `post_fallback` | WebSocket failed after `--max-retries`; the agent reports through POST. |
| `recovering_ws` | POST fallback is active while the agent periodically retries WebSocket at `--reconnect-interval`. |

During POST fallback:

- `POST /api/clients/v2/rpc` with `agent.report` sends monitoring data and may receive queued events in `result.events[]`.
- `POST /api/clients/v2/rpc` with `agent.pull` long-polls (25s server hold) with `capabilities` and `ack_event_ids` to receive queued `exec`, `ping`, `terminal.request`, `file`, `startupConfig`, and `switchVersion` events.
- The server tracks WebSocket presence (75s read timeout, 30s agent ping) and POST presence (35s TTL), merging them into `online` on `/api/clients`.

## Event Handling

Events arrive as JSON-RPC 2.0 requests (`method` + `params`):

- `agent.exec` → executes shell/PowerShell command if `--disable-web-ssh` is `false`, then reports `agent.taskResult`.
- `agent.ping` → runs ICMP/TCP/HTTP probe, then reports `agent.pingResult` (`value: -1` indicates failure/packet loss).
- `agent.terminal.request` → if `--disable-web-ssh` is `false`, opens `GET /api/clients/terminal?token={token}&id={request_id}` WebSocket.
- `agent.file` / `agent.startupConfig` / `agent.switchVersion` → remote file operations, startup config inspection, and version switching (see [Agent v2 RPC](/en/dev/api#_15-agent-v2-rpc)).

## Configuration Flags

Configuration precedence from lowest to highest: **Defaults < CLI flags < Environment variables < JSON config (`--config`)** (an AutoDiscovery token acquired at startup overrides `token`).

### Connection & Transport

- `-e, --endpoint` (`AGENT_ENDPOINT`): server endpoint URL.
- `-t, --token` (`AGENT_TOKEN`): node token.
- `--auto-discovery` (`AGENT_AUTO_DISCOVERY_KEY`): AutoDiscovery key.
- `-u, --ignore-unsafe-cert` (`AGENT_IGNORE_UNSAFE_CERT`): ignore TLS certificate errors (default `false`).
- `--custom-dns` (`AGENT_CUSTOM_DNS`): custom DNS server (e.g. `8.8.8.8`).
- `--prefer-ip-version` (`AGENT_PREFER_IP_VERSION`): prefer IPv4 or IPv6 (`4` or `6`).
- `--disable-compression` (`AGENT_DISABLE_COMPRESSION`): disable v2 gzip and `permessage-deflate` compression (default `false`).
- `--config` (`AGENT_CONFIG_FILE`): path to JSON configuration file.

### Intervals & Retries

- `-i, --interval` (`AGENT_INTERVAL`): monitoring report interval in seconds (default `3.0`, floor `1.0`).
- `--info-report-interval` (`AGENT_INFO_REPORT_INTERVAL`): basic information report interval in minutes (default `5`).
- `-c, --reconnect-interval` (`AGENT_RECONNECT_INTERVAL`): reconnect interval in seconds (default `5`).
- `-r, --max-retries` (`AGENT_MAX_RETRIES`): maximum WebSocket connection retries before fallback (default `3`).

### Collection & Feature Switches

- `--disable-auto-update` (`AGENT_DISABLE_AUTO_UPDATE`): disable automatic updates (default `false`).
- `--disable-web-ssh` (`AGENT_DISABLE_WEB_SSH`): disable remote control (Web SSH, remote exec, version switch; default `false`).
- `--memory-include-cache` (`AGENT_MEMORY_INCLUDE_CACHE`): include cache/buffers in memory usage (default `false`).
- `--memory-exclude-bcf` (`AGENT_MEMORY_REPORT_RAW_USED`): calculate used memory as `Total - Free - Buffers - Cached` (default `false`; `--memory-mode-available` was deprecated in `1.0.70` and removed).
- `--include-nics` / `--exclude-nics` (`AGENT_INCLUDE_NICS` / `AGENT_EXCLUDE_NICS`): comma-separated NIC allow/deny patterns.
- `--include-mountpoint` (`AGENT_INCLUDE_MOUNTPOINTS`): semicolon-separated disk mountpoints to include.
- `--month-rotate` (`AGENT_MONTH_ROTATE`): monthly traffic reset day (`0` to disable, default `0`).
- `--gpu` (`AGENT_ENABLE_GPU`): enable detailed GPU monitoring (default `false`).
- `--custom-ipv4` / `--custom-ipv6` (`AGENT_CUSTOM_IPV4` / `AGENT_CUSTOM_IPV6`): override reported IPv4 / IPv6 addresses.
- `--get-ip-addr-from-nic` (`AGENT_GET_IP_ADDR_FROM_NIC`): read IP addresses from network interfaces (default `false`).
- `HOST_PROC` (env var or JSON key `host_proc` only): host `/proc` mountpoint inside containers.

Helper subcommands: `komari-agent check-mem`, `komari-agent list-disk`.

The Chinese document contains additional protocol and state-machine details: [Agent development](/dev/agent).
