# Komari API Reference

Komari exposes HTTP, WebSocket, JSON-RPC, and Agent v2 interfaces for integrations and custom tooling.

> HTTP API base URL: `http(s)://<komari-server>`
>
> JSON-RPC endpoint: `GET/POST /api/rpc2`
>
> This page covers HTTP and WebSocket APIs, JSON-RPC, and the Agent v2 protocol.

## Contents

- [1. Quick Start](#_1-quick-start)
- [2. Conventions](#_2-conventions)
- [3. Public API](#_3-public-api)
- [4. Agent API](#_4-agent-api)
- [5. Admin API](#_5-admin-api)
- [6. Setup and Recovery APIs](#_6-setup-and-recovery-apis)
- [7. JSON-RPC Quick Start](#_7-json-rpc-quick-start)
- [8. JSON-RPC Protocol](#_8-json-rpc-protocol)
- [9. Authentication and Permissions](#_9-authentication-and-permissions)
- [10. Error Codes](#_10-error-codes)
- [11. Internal RPC](#_11-internal-rpc)
- [12. Common RPC](#_12-common-rpc)
- [13. Public RPC](#_13-public-rpc)
- [14. Admin RPC](#_14-admin-rpc)
- [15. Agent v2 RPC](#_15-agent-v2-rpc)

## 1. Quick Start

### 1.1 Base URL

```text
http(s)://<komari-server>
```

### 1.2 Authentication

Admin endpoints under `/api/admin` require administrator authentication.

#### API Key

Send the API key as a Bearer token:

```http
Authorization: Bearer <api-key>
```

```bash
export BASE="http://127.0.0.1:8080"
export KOMARI_API_KEY="<api-key>"

curl -s "$BASE/api/admin/settings/" \
  -H "Authorization: Bearer $KOMARI_API_KEY"
```

::: warning
API key authentication requires Komari 1.0.3 or later.
:::

#### Session Cookie

Browser clients use the `session_token` cookie returned by `/api/login`. Unless an endpoint specifically handles login, logout, OAuth, or 2FA, examples in this document use API key authentication.

### 1.3 Client Token

Agent endpoints accept a node's Client Token in any of these forms:

```text
?token=<client-token>
?Authorization=<client-token>
Authorization: Bearer <client-token>
```

The token can also be included in a JSON request body:

```json
{
  "token": "<client-token>"
}
```

## 2. Conventions

### 2.1 Response Envelope

Most REST endpoints return:

```json
{
  "status": "success",
  "message": "",
  "data": {}
}
```

Errors use:

```json
{
  "status": "error",
  "message": "Invalid request"
}
```

Some endpoints use raw or flattened responses:

| Mode | Successful response |
| --- | --- |
| `standard` | `{ "status":"success", "message":"", "data":<result> }` |
| `raw` | The result is returned directly. |
| `flat` | Object fields are promoted to the top level and `status: "success"` is added. |

Streaming, binary, redirect, and custom-auth endpoints do not use this envelope.

### 2.2 HTTP Status Codes

| Status | Meaning |
| --- | --- |
| `200` | Success |
| `302` | Redirect |
| `400` | Invalid request or parameters |
| `401` | Not signed in, invalid identity, or failed 2FA |
| `403` | Permission denied or feature disabled |
| `404` | Resource not found |
| `409` | Resource conflict or operation already running |
| `413` | Upload exceeds the allowed size |
| `429` | Rate limit exceeded |
| `500` | Internal server error |
| `502` | Agent or upstream service error |
| `503` | Agent offline or service unavailable |
| `504` | Request timeout |

### 2.3 Private Sites

When `private_site` is enabled, unauthenticated visitors receive:

```json
{
  "status": "error",
  "message": "Private site is enabled, please login first."
}
```

The login flow can still use `/api/login`, `/api/me`, `/api/public`, `/api/version`, and `/api/oauth`.

### 2.4 Two-Factor Authentication

These endpoints may require an administrator 2FA code:

- `POST /api/admin/task/exec`
- `POST /api/admin/update/user` when changing a password
- `POST /api/admin/2fa/disable`
- Creating a new terminal session with `GET /api/admin/client/:uuid/terminal`

Komari reads the code in this order:

1. `2fa_code`, `two_factor_code`, or `otp` in the JSON body
2. The `X-2FA-Code` header
3. The `X-Two-Factor-Code` header
4. The `2fa_code`, `two_factor_code`, or `otp` query parameter

API key requests do not require a separate 2FA code. Accounts without 2FA are also exempt.

### 2.5 Common Types

#### Client

```json
{
  "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
  "name": "Tokyo-01",
  "cpu_name": "AMD EPYC 7B13",
  "virtualization": "kvm",
  "arch": "x86_64",
  "cpu_cores": 4,
  "cpu_physical_cores": 2,
  "os": "Ubuntu 24.04",
  "kernel_version": "6.8.0",
  "gpu_name": "",
  "ipv4": "203.0.113.10",
  "ipv6": "",
  "region": "JP",
  "public_remark": "",
  "mem_total": 8589934592,
  "swap_total": 2147483648,
  "disk_total": 107374182400,
  "weight": 0,
  "price": 0,
  "billing_cycle": 30,
  "auto_renewal": false,
  "currency": "USD",
  "expired_at": null,
  "group": "Tokyo",
  "tags": "production;ssd",
  "hidden": false,
  "traffic_limit": 1099511627776,
  "traffic_limit_type": "max"
}
```

#### Record

```json
{
  "client": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
  "time": "2026-09-16T08:30:00Z",
  "cpu": 12.5,
  "gpu": 0,
  "ram": 1073741824,
  "ram_total": 8589934592,
  "swap": 0,
  "swap_total": 2147483648,
  "load": 0.42,
  "temp": 45.5,
  "disk": 21474836480,
  "disk_total": 107374182400,
  "net_in": 102400,
  "net_out": 204800,
  "net_total_up": 10737418240,
  "net_total_down": 21474836480,
  "process": 132,
  "connections": 28,
  "connections_udp": 3
}
```

## 3. Public API

### 3.1 Health Check

**Endpoint:** `ANY /ping`

**Authentication:** None.

**Response:** Plain text `pong`.

```bash
curl -s "$BASE/ping"
```

### 3.2 Login

**Endpoint:** `POST /api/login`

**Authentication:** None.

**Request body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `username` | `string` | Yes | Administrator username. |
| `password` | `string` | Yes | Administrator password. |
| `2fa_code` | `string` | No | Required when the account has 2FA enabled. |

```bash
curl -s -D - \
  -X POST "$BASE/api/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourPassword123",
    "2fa_code": "123456"
  }'
```

The response sets `session_token` as an HttpOnly cookie:

```json
{
  "status": "success",
  "message": "",
  "data": {
    "set-cookie": {
      "session_token": "<session-token>"
    }
  }
}
```

Password login returns `403` when disabled.

### 3.3 Logout

**Endpoint:** `GET /api/logout`

**Authentication:** Optional.

**Response:** `302` redirect to `/`. The `session_token` cookie is cleared.

```bash
curl -s -D - "$BASE/api/logout"
```

### 3.4 OAuth

**Endpoint:** `GET /api/oauth`

Redirects to the configured OAuth provider.

**Endpoint:** `GET /api/oauth_callback`

OAuth callback. On success, redirects to `/admin/dashboard`.

### 3.5 Current Identity

**Endpoint:** `GET /api/me`

**Authentication:** Optional. Returns Guest information when signed out.

```bash
curl -s "$BASE/api/me"
```

```json
{
  "username": "admin",
  "logged_in": true,
  "uuid": "8b55e7f0-6f9c-4b1a-a5f2-63f09c04bca4",
  "sso_type": "",
  "sso_id": "",
  "2fa_enabled": true
}
```

### 3.6 Node Information

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/nodes` | Visible node information. |
| `GET` | `/api/recent/:uuid` | Recent reports for one node. |
| `GET` | `/api/records/load` | Load records. |
| `GET` | `/api/records/ping` | Ping records. |
| `GET` | `/api/task/ping` | Public ping tasks. |

```bash
curl -s "$BASE/api/nodes"
curl -s "$BASE/api/recent/<uuid>"
curl -s "$BASE/api/records/load?uuid=<uuid>&load_type=cpu&hours=6"
curl -s "$BASE/api/records/ping?uuid=<uuid>&hours=4"
curl -s "$BASE/api/task/ping"
```

### 3.7 Public Settings and Version

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/public` | Public site settings. |
| `GET` | `/api/version` | Server version and build hash. |

```bash
curl -s "$BASE/api/public"
curl -s "$BASE/api/version"
```

### 3.8 Live Client WebSocket

**Endpoint:** `GET /api/clients`

Send `get` to retrieve all visible nodes, or `get <uuid>` to retrieve one node.

```js
const ws = new WebSocket(`${location.origin.replace(/^http/, "ws")}/api/clients`);

ws.onopen = () => ws.send("get");
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

### 3.9 Public Plugin Pages

**Endpoint:** `GET /api/plugin/:short/*filepath`

**Authentication:** None.

Only files declared as public plugin pages and files in the same directory are accessible.

## 4. Agent API

### 4.1 AutoDiscovery Registration

**Endpoint:** `POST /api/clients/register`

**Authentication:** `Authorization: Bearer <auto-discovery-key>`

| Query parameter | Required | Description |
| --- | --- | --- |
| `name` | No | Node name. A random name is generated when omitted. |

```bash
curl -s -X POST "$BASE/api/clients/register?name=web-01" \
  -H "Authorization: Bearer $AUTO_DISCOVERY_KEY"
```

### 4.2 Agent v2 HTTP JSON-RPC

**Endpoint:** `POST /api/clients/v2/rpc`

**Authentication:** Client Token.

The body contains one Agent v2 JSON-RPC request. Gzip-compressed request bodies are supported through `Content-Encoding: gzip`.

```bash
curl -s -X POST "$BASE/api/clients/v2/rpc?token=$CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "agent.pull",
    "params": {
      "capabilities": ["file", "terminal"],
      "ack_event_ids": []
    },
    "id": 1
  }'
```

See [Agent v2 RPC](#_15-agent-v2-rpc) for method details.

### 4.3 Agent v2 WebSocket

**Endpoint:** `GET /api/clients/v2/rpc?token=<client-token>`

The server can push these methods:

- `agent.exec`
- `agent.ping`
- `agent.message`
- `agent.event`
- `agent.terminal.request`
- `agent.file`

### 4.4 File Transfer Relay

**Endpoint:** `POST /api/clients/transfer/:id`

**Alias:** `GET /api/clients/transfer/:id`

The server creates a short-lived transfer and includes its ID and token in an `agent.file` event. File bytes are streamed through this endpoint.

```http
X-Komari-Transfer-Token: <transfer-token>
X-Komari-Transfer-ID: <transfer-id>
```

### 4.5 Agent Terminal WebSocket

**Endpoint:** `GET /api/clients/terminal?token=<client-token>&id=<request-id>`

The Agent opens this connection after receiving `agent.terminal.request`.

## 5. Admin API

All endpoints in this section require administrator authentication.

### 5.1 Client Management

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/client/add` | Create a client. |
| `GET` | `/api/admin/client/list` | List clients. |
| `GET` | `/api/admin/client/:uuid` | Get one client. |
| `POST` | `/api/admin/client/:uuid/edit` | Update a client. |
| `POST` | `/api/admin/client/:uuid/remove` | Delete a client. |
| `GET` | `/api/admin/client/:uuid/token` | Read a client token. |
| `POST` | `/api/admin/client/order` | Update client weights. |

```bash
curl -s "$BASE/api/admin/client/list" \
  -H "Authorization: Bearer $KOMARI_API_KEY"

curl -s -X POST "$BASE/api/admin/client/add" \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tokyo-01"}'
```

### 5.2 Remote Tasks

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/task/all` | List tasks and results. |
| `POST` | `/api/admin/task/exec` | Execute a command. |
| `GET` | `/api/admin/task/:task_id` | Get a task. |
| `GET` | `/api/admin/task/:task_id/result` | List task results. |
| `GET` | `/api/admin/task/:task_id/result/:uuid` | Get one result. |
| `GET` | `/api/admin/task/client/:uuid` | List tasks for a client. |

```bash
curl -s -X POST "$BASE/api/admin/task/exec" \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -H "X-2FA-Code: 123456" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "uptime",
    "clients": ["<uuid>"]
  }'
```

### 5.3 Settings and Providers

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET/POST` | `/api/admin/settings/` | Read or update settings. |
| `GET/POST` | `/api/admin/settings/xtermjs` | Read or update xterm.js settings. |
| `GET/POST` | `/api/admin/settings/message-sender` | Read or update message providers. |
| `GET/POST` | `/api/admin/settings/oidc` | Read or update OIDC providers. |

```bash
curl -s "$BASE/api/admin/settings/" \
  -H "Authorization: Bearer $KOMARI_API_KEY"
```

### 5.4 Sessions, Logs, and Clipboard

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/session/get` | List sessions. |
| `POST` | `/api/admin/session/remove` | Remove one session. |
| `POST` | `/api/admin/session/remove/all` | Remove all sessions. |
| `GET` | `/api/admin/logs` | Read audit logs. |
| `GET` | `/api/admin/clipboard` | List clipboard entries. |
| `POST` | `/api/admin/clipboard` | Create an entry. |
| `GET` | `/api/admin/clipboard/:id` | Get an entry. |
| `POST` | `/api/admin/clipboard/:id` | Update an entry. |
| `POST` | `/api/admin/clipboard/remove` | Batch delete entries. |
| `POST` | `/api/admin/clipboard/:id/remove` | Delete one entry. |

### 5.5 Notifications and Ping Tasks

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/notification/load/` | List load notifications. |
| `POST` | `/api/admin/notification/load/add` | Create a load notification. |
| `POST` | `/api/admin/notification/load/edit` | Edit load notifications. |
| `POST` | `/api/admin/notification/load/delete` | Delete load notifications. |
| `GET` | `/api/admin/notification/offline` | List offline notifications. |
| `POST` | `/api/admin/notification/offline/edit` | Edit offline notifications. |
| `POST` | `/api/admin/notification/offline/enable` | Enable offline notifications. |
| `POST` | `/api/admin/notification/offline/disable` | Disable offline notifications. |
| `GET` | `/api/admin/ping/` | List ping tasks. |
| `POST` | `/api/admin/ping/add` | Create a ping task. |
| `POST` | `/api/admin/ping/edit` | Edit ping tasks. |
| `POST` | `/api/admin/ping/delete` | Delete ping tasks. |
| `POST` | `/api/admin/ping/order` | Update ping task weights. |

### 5.6 Themes, Markets, and Plugins

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/theme/list` | List themes. |
| `GET` | `/api/admin/theme/set?theme=` | Set the active theme. |
| `POST` | `/api/admin/theme/delete` | Delete a theme. |
| `POST` | `/api/admin/theme/update` | Update a theme. |
| `POST` | `/api/admin/theme/import` | Import or preview a theme. |
| `POST` | `/api/admin/theme/settings?theme=` | Save theme settings. |
| `GET/POST/PUT/DELETE` | `/api/admin/theme/market/sources/:id?` | Manage theme market sources. |
| `GET` | `/api/admin/theme/market/catalog?refresh=` | Read the theme market catalog. |
| `POST` | `/api/admin/theme/market/install` | Install a theme from the market. |
| `GET` | `/api/admin/plugin/list` | List plugins. |
| `POST` | `/api/admin/plugin/enabled` | Enable or disable a plugin. |
| `GET` | `/api/admin/plugin/logs?short=` | Read plugin logs. |
| `POST` | `/api/admin/plugin/delete` | Delete a plugin. |
| `GET/POST` | `/api/admin/plugin/configuration` | Read or save plugin configuration. |
| `GET/POST/PUT/DELETE` | `/api/admin/plugin/market/sources/:id?` | Manage plugin market sources. |
| `GET` | `/api/admin/plugin/market/catalog?refresh=` | Read the plugin market catalog. |
| `POST` | `/api/admin/plugin/market/install` | Install a plugin from the market. |

### 5.7 Archive Upload

Backups, plugins, and themes use the same chunked upload flow:

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/upload/init` | Initialize an upload. |
| `POST` | `/api/admin/upload/chunk` | Upload a chunk. |
| `POST` | `/api/admin/upload/merge` | Merge and finalize the upload. |
| `POST` | `/api/admin/upload/cancel` | Cancel the upload. |

Use `purpose: "backup"`, `"plugin"`, or `"theme"`. Chunks are 5 MiB except for the final chunk.

```bash
curl -s -X POST "$BASE/api/admin/upload/init" \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "plugin",
    "filename": "status-extension.zip",
    "size": 123456
  }'
```

### 5.8 Node Files

File metadata and mutation operations use RPC. File contents use streaming HTTP endpoints.

| Operation | Interface |
| --- | --- |
| List roots | `admin:fileListRoots` |
| List directory | `admin:fileList` |
| Read metadata | `admin:fileStat` |
| Create directory | `admin:fileMkdir` |
| Delete path | `admin:fileDelete` |
| Move or rename | `admin:fileMove` |
| Copy | `admin:fileCopy` |
| Change mode | `admin:fileChmod` |
| Change owner or group | `admin:fileChown` |
| Search paths or contents | `admin:fileSearch` |
| Upload content | `POST /api/admin/client/:uuid/file/upload` |
| Download content | `GET/HEAD /api/admin/client/:uuid/file/download` |
| Create preview token | `GET /api/admin/client/:uuid/file/preview-token` |

### 5.9 Terminal

**Endpoint:** `GET /api/admin/client/:uuid/terminal`

**Protocol:** WebSocket.

Creating a new terminal session requires 2FA. Reconnecting with the existing `request_id` is authorized against the original session owner.

See [Terminal Reconnection](#_15-6-terminal-frames) for the frame protocol and reconnection flow.

The new session returns:

```json
{
  "request_id": "0e9f95c9f7f34b27a0ec85a818fec2b3"
}
```

### 5.10 2FA and OAuth

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/2fa/generate` | Generate a TOTP secret and QR PNG. |
| `POST` | `/api/admin/2fa/enable?code=` | Enable 2FA. |
| `POST` | `/api/admin/2fa/disable` | Disable 2FA. |
| `GET` | `/api/admin/oauth2/bind` | Bind an external account. |
| `POST` | `/api/admin/oauth2/unbind` | Unbind an external account. |

### 5.11 User, GeoIP, and Favicon

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/admin/update/user` | Update the administrator account. |
| `POST` | `/api/admin/update/mmdb` | Update the GeoIP database. |
| `PUT` | `/api/admin/update/favicon` | Upload a favicon. |
| `POST` | `/api/admin/update/favicon` | Delete the favicon. |

### 5.12 Database and Diagnostics

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/database/size` | Read database storage usage. |
| `POST` | `/api/admin/database/vacuum` | Reclaim database space. |
| `GET` | `/api/admin/pprof/summary` | Read runtime profile metadata. |
| `GET` | `/api/admin/pprof/profile?seconds=` | Download a CPU profile. |
| `GET` | `/api/admin/pprof/trace?seconds=` | Download an execution trace. |
| `GET` | `/api/admin/pprof/:profile` | Download a runtime profile. |

Runtime profiles accept `?format=text` for a text preview. CPU profiles and traces are always binary.

## 6. Setup and Recovery APIs

These routes are available only in the corresponding restricted startup mode.

### 6.1 Installation

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/install/status` | Read installation state. |
| `POST` | `/api/install/complete` | Create the administrator and save initial settings. |
| `POST` | `/api/install/upload/init` | Initialize backup restore upload. |
| `POST` | `/api/install/upload/chunk` | Upload a restore chunk. |
| `POST` | `/api/install/upload/merge` | Merge and apply the backup. |
| `POST` | `/api/install/upload/cancel` | Cancel the restore upload. |

```bash
curl -s -X POST "$BASE/api/install/complete" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "StrongPassword123",
    "sitename": "Komari",
    "description": "Server status",
    "metric_dsn": "./data/metrics.db"
  }'
```

### 6.2 Database Recovery

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/database-recovery/auth` | Read available login methods. |
| `GET` | `/api/admin/database-recovery/status` | Read recovery state. |
| `POST` | `/api/admin/database-recovery` | Apply a monitoring database DSN. |

```bash
curl -s -X POST "$BASE/api/admin/database-recovery" \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"dsn":"postgresql://user:pass@db:5432/komari"}'
```

### 6.3 Database Migration

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/admin/database-migration/auth` | Read login methods and migration mode. |
| `GET` | `/api/admin/database-migration/status` | Read migration progress. |
| `POST` | `/api/admin/database-migration/start` | Start migration. |
| `POST` | `/api/admin/database-migration/discard` | Discard historical metric data. |

## 7. JSON-RPC Quick Start

### 7.1 Endpoint

```text
http(s)://<komari-server>/api/rpc2
```

### 7.2 Sending a Request

```bash
curl -s "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "public:getVersion",
    "params": {},
    "id": 1
  }'
```

```json
{
  "jsonrpc": "2.0",
  "result": {
    "version": "1.0.0",
    "hash": "b11ffd3"
  },
  "id": 1
}
```

### 7.3 Session Cookie

Send the session issued by `/api/login` as a cookie:

```bash
curl -s "$BASE/api/rpc2" \
  -H "Cookie: session_token=<session-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "admin:listClients",
    "id": 1
  }'
```

### 7.4 API Key

```bash
curl -s "$BASE/api/rpc2" \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "admin:getSettings",
    "id": 1
  }'
```

## 8. JSON-RPC Protocol

### 8.1 Request

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `jsonrpc` | `string` | Yes | Must be `"2.0"`. |
| `method` | `string` | Yes | Fully qualified method name. |
| `params` | `object \| array` | No | Named or positional parameters. |
| `id` | `string \| number \| null` | No | Echoed in the response. |

### 8.2 Success Response

```json
{
  "jsonrpc": "2.0",
  "result": {},
  "id": 1
}
```

### 8.3 Error Response

```json
{
  "jsonrpc": "2.0",
  "error": {
    "code": -32602,
    "message": "UUID is required",
    "data": "optional detail"
  },
  "id": 1
}
```

### 8.4 Batch Requests

The POST body may be an array of requests. The response is an array in the same order.

### 8.5 WebSocket

`GET /api/rpc2` upgrades to WebSocket. Each frame contains one request, and the server returns one response per request.

### 8.6 Method Discovery

Use `rpc.methods` to list methods and `rpc.help` to read method metadata.

## 9. Authentication and Permissions

HTTP RPC uses the same identity order as REST:

```text
API Key > session_token cookie > Client Token > anonymous
```

### 9.1 Roles

| Role | Level |
| --- | --- |
| `guest` | `0` |
| `client` | `1` |
| `admin` | `2` |

### 9.2 Default ACL

| Pattern | Minimum role |
| --- | --- |
| `common:*` | `guest` |
| `guest:*` | `guest` |
| `rpc.*` | `guest` |
| `rpc:*` | `guest` |
| `public:*` | `guest` |
| `client:*` | `client` |
| `admin:*` | `admin` |
| `*` | `admin` |

### 9.3 Private Site Whitelist

Anonymous visitors may call:

```text
public:getMe
public:getPublicSettings
public:getVersion
public:recordVisitorEvent
```

A valid temporary share cookie also allows anonymous `public:*` calls.

### 9.4 Sensitive Methods

`admin:exec` is sensitive. Administrators must provide a valid 2FA code unless they authenticate with an API key or do not have 2FA enabled.

## 10. Error Codes

| Code | Name | Meaning |
| --- | --- | --- |
| `-32700` | `ParseError` | Invalid JSON. |
| `-32600` | `InvalidRequest` | Invalid JSON-RPC request. |
| `-32601` | `MethodNotFound` | Unknown method. |
| `-32602` | `InvalidParams` | Missing or invalid parameters. |
| `-32603` | `InternalError` | Internal server error. |
| `-32010` | `Cancelled` | Operation cancelled. |
| `-32011` | `DeadlineExceeded` | Operation timed out. |
| `-32021` | `Aborted` | Concurrency or transaction conflict. |
| `-32022` | `OutOfRange` | Index or value out of range. |
| `-32040` | `Unauthenticated` | Authentication required. |
| `-32041` | `PermissionDenied` | Permission denied. |
| `-32044` | `NotFound` | Resource not found. |
| `-32045` | `AlreadyExists` | Resource already exists. |
| `-32050` | `Unimplemented` | Not implemented. |
| `-32051` | `Unavailable` | Dependency unavailable. |
| `-32052` | `DataLoss` | Unrecoverable data loss. |

## 11. Internal RPC

### 11.1 `rpc.ping`

Returns `"pong"`.

### 11.2 `rpc.version`

Returns the JSON-RPC protocol version, `"2.0"`.

### 11.3 `rpc.methods`

Parameters:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `internal` | `boolean` | `false` | Include `rpc.*` methods. |

### 11.4 `rpc.help`

Parameters:

| Field | Type | Description |
| --- | --- | --- |
| `method` | `string` | Method name. Omit to return all metadata. |

## 12. Common RPC

| Method | Parameters | Result |
| --- | --- | --- |
| `common:getNodes` | `{ uuid? }` | A `Client` or a map keyed by UUID. |
| `common:getNodesLatestStatus` | `{ uuid?, uuids? }` | One status object or a map keyed by UUID. |
| `common:getMe` | None | Current identity. |
| `common:getPublicInfo` | None | Public site information. |
| `common:getVersion` | None | Version and build hash. |
| `common:getNodeRecentStatus` | `{ uuid }` | `{ count, records }`. |
| `common:getRecords` | See below | Load or ping records. |

`common:getRecords` parameters:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `string` | `load` | `load` or `ping`. |
| `uuid` | `string` | All clients | Client UUID. |
| `hours` | `integer` | `1` | Lookback window. |
| `start` / `end` | `string` | - | RFC3339 timestamps with a timezone. |
| `load_type` | `string` | - | Load projection. |
| `task_id` | `integer` | `-1` | Ping task ID. |
| `maxCount` | `integer` | `4000` | Maximum points; `-1` disables downsampling. |

## 13. Public RPC

| Method | Parameters | Result |
| --- | --- | --- |
| `public:getMe` | None | Current user or Guest placeholder. |
| `public:getNodesInformation` | None | Visible nodes. |
| `public:getPublicSettings` | None | Public site settings. |
| `public:getVersion` | None | Version and build hash. |
| `public:getClientRecentRecords` | `{ uuid }` | Recent in-memory reports. |
| `public:getRecordsByUUID` | `{ uuid, load_type?, hours? }` | Projected load records. |
| `public:getPingRecords` | `{ uuid?, task_id?, hours? }` | Ping records and task summaries. |
| `public:getPublicPingTasks` | None | Public ping tasks. |
| `public:recordVisitorEvent` | `{ event, path?, route?, target?, detail? }` | Visitor audit status. |
| `public:listMetricDefinitions` | None | Metric definitions. |
| `public:queryMetrics` | Metric query object | Metric series. |
| `public:getPingMetricStats` | Ping metric query object | Aggregated ping statistics. |

## 14. Admin RPC

All methods in this section require the `admin` role.

### 14.1 Client Management

| Method | Parameters |
| --- | --- |
| `admin:addClient` | `{ name? }` |
| `admin:editClient` | `{ uuid, ...fields }` |
| `admin:removeClient` | `{ uuid }` |
| `admin:getClient` | `{ uuid }` |
| `admin:listClients` | None |
| `admin:getClientToken` | `{ uuid }` |
| `admin:clearRecords` | None |
| `admin:clearAllRecords` | None |
| `admin:orderClients` | `{ [uuid]: weight }` |

### 14.2 Sessions and Settings

| Method | Parameters |
| --- | --- |
| `admin:getSessions` | None |
| `admin:deleteSession` | `{ session }` |
| `admin:deleteAllSessions` | None |
| `admin:getSettings` | None |
| `admin:editSettings` | Partial settings object |
| `admin:getXtermjsSettings` | None |
| `admin:setXtermjsSettings` | xterm.js settings object |

### 14.3 Tasks

| Method | Parameters |
| --- | --- |
| `admin:getTasks` | None |
| `admin:getTaskById` | `{ task_id }` |
| `admin:getTasksByClientId` | `{ uuid }` |
| `admin:getTaskResultsByTaskId` | `{ task_id }` |
| `admin:getSpecificTaskResult` | `{ task_id, uuid }` |
| `admin:exec` | `{ command, clients, 2fa_code? }` |

### 14.4 Ping Tasks

| Method | Parameters |
| --- | --- |
| `admin:addPingTask` | `{ name, target, type, interval, clients?, default_on? }` |
| `admin:deletePingTask` | `{ id: number[] }` |
| `admin:editPingTask` | `{ tasks: PingTask[] }` |
| `admin:getAllPingTasks` | None |
| `admin:orderPingTask` | `{ [id]: weight }` |

### 14.5 Notifications

| Method | Parameters |
| --- | --- |
| `admin:addLoadNotification` | `{ clients, metric, threshold, ratio, interval, name? }` |
| `admin:deleteLoadNotification` | `{ id: number[] }` |
| `admin:editLoadNotification` | `{ notifications: LoadNotification[] }` |
| `admin:getAllLoadNotifications` | None |
| `admin:listOfflineNotifications` | None |
| `admin:editOfflineNotification` | `OfflineNotification[]` |
| `admin:enableOfflineNotification` | `string[]` |
| `admin:disableOfflineNotification` | `string[]` |
| `admin:sendNotification` | `{ event: EventMessage }` |

### 14.6 Clipboard

| Method | Parameters |
| --- | --- |
| `admin:getClipboard` | `{ id }` |
| `admin:listClipboard` | None |
| `admin:createClipboard` | `{ text, name, weight?, remark? }` |
| `admin:updateClipboard` | `{ id, ...fields }` |
| `admin:deleteClipboard` | `{ id }` |
| `admin:batchDeleteClipboard` | `{ ids: number[] }` |

### 14.7 Providers

| Method | Parameters |
| --- | --- |
| `admin:getMessageSenderProvider` | `{ provider? }` |
| `admin:setMessageSenderProvider` | `{ name, addition }` |
| `admin:getOidcProvider` | `{ provider? }` |
| `admin:setOidcProvider` | `{ name, addition }` |

### 14.8 Database and Maintenance

| Method | Parameters |
| --- | --- |
| `admin:getDatabaseSize` | None |
| `admin:vacuumDatabase` | None |
| `admin:dbQuery` | `{ database?, sql, args?, limit? }` |
| `admin:dbExec` | `{ database?, sql, args? }` |
| `admin:dbTables` | `{ database? }` |
| `admin:getLogs` | `{ limit?, page?, msg_type? }` |
| `admin:testGeoip` | `{ ip? }` |
| `admin:testSendMessage` | None |

### 14.9 Plugins and Metrics

| Method | Parameters |
| --- | --- |
| `admin:listPlugins` | None |
| `admin:setPluginEnabled` | `{ short, enabled, approved? }` |
| `admin:getPluginLogs` | `{ short }` |
| `admin:deletePlugin` | `{ short }` |
| `admin:getPluginConfiguration` | `{ short }` |
| `admin:setPluginConfiguration` | `{ short, data }` |
| `admin:listMetricDefinitions` | None |
| `admin:updateMetricDefinition` | `{ name, retention_days }` |
| `admin:getMetricMigrationStatus` | None |
| `admin:startMetricMigration` | `{ source_driver?, source_dsn? }` |
| `admin:cancelMetricMigration` | None |

### 14.10 Node File Operations

| Method | Parameters | Result |
| --- | --- | --- |
| `admin:fileListRoots` | `{ uuid }` | File roots. |
| `admin:fileList` | `{ uuid, path }` | Directory entries. |
| `admin:fileStat` | `{ uuid, path }` | File metadata. |
| `admin:fileMkdir` | `{ uuid, path, mode? }` | `{ created: true }` |
| `admin:fileDelete` | `{ uuid, path }` | `{ deleted: true }` |
| `admin:fileMove` | `{ uuid, source, destination }` | `{ moved: true }` |
| `admin:fileCopy` | `{ uuid, source, destination }` | `{ copied: true }` |
| `admin:fileChmod` | `{ uuid, path, mode }` | `{ mode }` |
| `admin:fileChown` | `{ uuid, path, uid?, gid?, owner?, group? }` | `{ uid, gid }` |
| `admin:fileSearch` | `{ uuid, path, query, content? }` | `{ matches, limited }` |

Example:

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileList",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "path": "/var/log"
  },
  "id": 1
}
```

File contents use the HTTP upload, download, and preview endpoints described in [Node Files](#_5-8-node-files).

## 15. Agent v2 RPC

Agent v2 uses:

```text
GET /api/clients/v2/rpc?token=<client-token>
POST /api/clients/v2/rpc?token=<client-token>
```

> Behavior baseline: `komari-monitor/komari-agent` `1.5.10`, commit `9e532e0429cd049571e35cf344654181879b33c7`.

### 15.1 Transport

The Agent prefers WebSocket. It sends an `agent.report` notification every reporting interval and a WebSocket Ping every 30 seconds.

If WebSocket cannot be established, the Agent enters POST fallback:

- It POSTs `agent.report` with an `id`.
- It runs `agent.pull` long polling, waiting up to 25 seconds per request.
- Request bodies use gzip unless `--disable-compression` is set.

### 15.2 Agent-to-Server Methods

| Method | Parameters | Result |
| --- | --- | --- |
| `agent.report` | `{ report, ack_event_ids? }` | `{ status, events }` |
| `agent.basicInfo` | `{ info }` | `{ status }` |
| `agent.pingResult` | `{ task_id, ping_type, value, finished_at }` | `{ status }` |
| `agent.taskResult` | `{ task_id, result, exit_code, finished_at }` | `{ status }` |
| `agent.pull` | `{ capabilities?, ack_event_ids?, last_event_id? }` | `{ events }` |
| `agent.file.result` | File result object | `{ status }` |

On WebSocket, reports, basic info, ping results, and task results are normally sent as notifications without an `id`.

`agent.basicInfo` and `agent.taskResult` always use HTTP POST. `agent.pingResult` uses the active WebSocket when available and falls back to POST.

#### `agent.report`

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
        "total": 8589934592,
        "used": 1073741824
      },
      "swap": {
        "total": 2147483648,
        "used": 0
      },
      "load": {
        "load1": 0.42,
        "load5": 0.38,
        "load15": 0.31
      },
      "disk": {
        "total": 107374182400,
        "used": 21474836480
      },
      "network": {
        "up": 204800,
        "down": 102400,
        "totalUp": 10737418240,
        "totalDown": 21474836480
      },
      "connections": {
        "tcp": 25,
        "udp": 3
      },
      "gpu": {
        "count": 1,
        "average_usage": 10.5,
        "detailed_info": [
          {
            "name": "NVIDIA GeForce RTX 4090",
            "memory_total": 25769803776,
            "memory_used": 2147483648,
            "utilization": 10.5,
            "temperature": 45
          }
        ]
      },
      "uptime": 86400,
      "process": 132,
      "message": ""
    },
    "ack_event_ids": []
  }
}
```

#### `agent.basicInfo`

```json
{
  "jsonrpc": "2.0",
  "method": "agent.basicInfo",
  "params": {
    "info": {
      "cpu_name": "AMD EPYC 7B13",
      "cpu_cores": 4,
      "cpu_physical_cores": 2,
      "arch": "amd64",
      "os": "Ubuntu 24.04",
      "kernel_version": "6.8.0",
      "ipv4": "203.0.113.10",
      "ipv6": "",
      "mem_total": 8589934592,
      "swap_total": 2147483648,
      "disk_total": 107374182400,
      "gpu_name": "NVIDIA GeForce RTX 4090",
      "virtualization": "kvm",
      "version": "1.5.10"
    }
  }
}
```

#### `agent.pingResult`

`value` is a millisecond integer. `-1` means packet loss or measurement failure.

```json
{
  "jsonrpc": "2.0",
  "method": "agent.pingResult",
  "params": {
    "task_id": 1,
    "ping_type": "icmp",
    "value": 32,
    "finished_at": "2026-09-16T08:30:00.123456789Z"
  }
}
```

#### `agent.taskResult`

```json
{
  "jsonrpc": "2.0",
  "method": "agent.taskResult",
  "params": {
    "task_id": "7cS2QmW8xKp4nA1v",
    "result": " 08:30:00 up 1 day\n",
    "exit_code": 0,
    "finished_at": "2026-09-16T08:30:00.123456789Z"
  }
}
```

The Agent combines stdout and stderr and normalizes CRLF to LF. When remote control is disabled:

```json
{
  "task_id": "7cS2QmW8xKp4nA1v",
  "result": "Remote control is disabled.",
  "exit_code": -1,
  "finished_at": "2026-09-16T08:30:00.123456789Z"
}
```

An empty command returns `No command provided` with exit code `0`.

#### `agent.pull`

```json
{
  "jsonrpc": "2.0",
  "method": "agent.pull",
  "params": {
    "capabilities": ["exec", "ping", "message", "event", "terminal", "file"],
    "ack_event_ids": []
  },
  "id": "pull-1789547400123456789"
}
```

```json
{
  "jsonrpc": "2.0",
  "result": {
    "events": []
  },
  "id": "pull-1789547400123456789"
}
```

Each event contains `id`, `method`, `params`, `created_at`, and `expires_at`.

### 15.3 Server-to-Agent Events

| Method | Parameters | Agent behavior | Result method |
| --- | --- | --- | --- |
| `agent.exec` | `{ task_id, command }` | Runs `sh -s` on Unix or a temporary PowerShell script on Windows. | `agent.taskResult` |
| `agent.ping` | `{ ping_task_id, ping_type, ping_target }` | Runs an `icmp`, `tcp`, or `http` probe. | `agent.pingResult` |
| `agent.terminal.request` | `{ request_id }` | Opens `/api/clients/terminal` with the Client Token. | Terminal WebSocket |
| `agent.file` | `{ uuid, request_id, op, args? }` | Runs a file control operation. | `agent.file.result` |
| `agent.message` | `{ type, message, data? }` | Logs the message. | None |
| `agent.event` | `{ type, data? }` | Logs the event. | None |
| `networkTest.*` | Protocol-defined | Not implemented by Agent 1.5.10. | None |

#### `agent.exec`

```json
{
  "jsonrpc": "2.0",
  "method": "agent.exec",
  "params": {
    "task_id": "7cS2QmW8xKp4nA1v",
    "command": "uptime"
  }
}
```

#### `agent.ping`

```json
{
  "jsonrpc": "2.0",
  "method": "agent.ping",
  "params": {
    "ping_task_id": 1,
    "ping_type": "icmp",
    "ping_target": "1.1.1.1"
  }
}
```

Ping behavior:

| Type | Behavior |
| --- | --- |
| `icmp` | Resolves the target and sends one ICMP request. |
| `tcp` | Measures TCP connection time. Port `80` is used when no port is specified. |
| `http` | Measures an HTTP GET. `http://` is added when no scheme is present. `2xx` and `3xx` are successful. |

#### `agent.terminal.request`

```json
{
  "jsonrpc": "2.0",
  "method": "agent.terminal.request",
  "params": {
    "request_id": "0e9f95c9f7f34b27a0ec85a818fec2b3"
  }
}
```

### 15.4 File Control Operations

```json
{
  "jsonrpc": "2.0",
  "method": "agent.file",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "request_id": "f4f2f0d5-4bb3-4da4-9ec5-2ca778d31b12",
    "op": "list",
    "args": {
      "path": "/var/log"
    }
  }
}
```

Supported operations:

| `op` | Arguments | Result |
| --- | --- | --- |
| `list_roots` | `{}` | `FileInfo[]` |
| `list` | `{ path }` | `FileInfo[]` |
| `stat` | `{ path }` | `FileInfo` |
| `create` | `{ path }` | `{ created: true, size: 0 }` |
| `mkdir` | `{ path, mode? }` | `{ created: true }` |
| `delete` | `{ path }` | `{ deleted: true }` |
| `move` | `{ source, destination }` | `{ moved: true }` |
| `copy` | `{ source, destination }` | `{ copied: true }` |
| `chmod` | `{ path, mode }` | `{ mode }` |
| `chown` | `{ path, uid?, gid?, owner?, group? }` | `{ uid, gid }` |
| `search` | `{ path, query, content? }` | `{ matches, limited }` |
| `download_stream` | Transfer metadata | `{ sent }` |
| `upload_stream` | Transfer metadata | `{ received, offset }` |
| `upload_commit` | Upload metadata | `{ received, final, offset }` |
| `upload_cancel` | `{ upload_id, path? }` | `{ cancelled: true }` |

#### `FileInfo`

```json
{
  "name": "syslog",
  "path": "/var/log/syslog",
  "is_dir": false,
  "is_symlink": false,
  "size": 1048576,
  "mode": "-rw-r-----",
  "mode_octal": "0640",
  "uid": 0,
  "gid": 4,
  "owner": "root",
  "group": "adm",
  "modified_at": "2026-09-16T08:30:00Z",
  "target": ""
}
```

#### `SearchMatch`

```json
{
  "path": "/var/log/syslog",
  "line": 42,
  "text": "2026-09-16 error: example",
  "is_dir": false
}
```

Search returns at most 500 matches. When the limit is reached, `limited` is `true`.

#### `agent.file.result`

Success:

```json
{
  "jsonrpc": "2.0",
  "method": "agent.file.result",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "request_id": "f4f2f0d5-4bb3-4da4-9ec5-2ca778d31b12",
    "ok": true,
    "result": []
  }
}
```

Failure:

```json
{
  "jsonrpc": "2.0",
  "method": "agent.file.result",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "request_id": "f4f2f0d5-4bb3-4da4-9ec5-2ca778d31b12",
    "ok": false,
    "error": "permission denied"
  }
}
```

### 15.5 File Data Plane

File bytes use:

```text
POST /api/clients/transfer/:id?token=<client-token>&transfer_token=<transfer-token>
```

Downloads:

1. The server creates a one-shot transfer and sends `agent.file`.
2. The Agent validates the transfer token, file size, and modification time.
3. The Agent sends the requested byte range to the transfer endpoint.
4. A 2xx response completes the transfer and the Agent reports `agent.file.result`.

Uploads:

1. The server creates a transfer and sends `agent.file`.
2. The Agent POSTs to the transfer endpoint with an empty request body.
3. The server streams the browser's request body to the Agent.
4. The Agent writes the chunk to a temporary `.part` file.
5. When all chunks arrive, the server calls `upload_commit` to replace the target atomically.

| Limit | Value |
| --- | --- |
| Concurrent Agent streams | 8 |
| Stream timeout | 30 minutes |
| Default chunk size | 25 MiB |
| Maximum chunk size | 128 MiB |

### 15.6 Terminal Frames

Binary browser frames are written directly to the PTY. Text control frames use JSON:

```json
{
  "type": "input",
  "input": "uptime\n"
}
```

```json
{
  "type": "resize",
  "cols": 120,
  "rows": 40
}
```

```json
{
  "type": "heartbeat"
}
```

```json
{
  "type": "close"
}
```

Terminal output is always sent back as WebSocket binary frames.

Reconnection behavior:

- Both the server and Agent retain a terminal session for 5 minutes.
- Reconnect with the original `request_id`. Do not create a new session.
- The browser reconnects first; the server sends `agent.terminal.request` again.
- The Agent then reconnects to `/api/clients/terminal` with the same `request_id`.
- Reusing the ID reattaches the existing PTY. After the retention window, the session returns `404`.

### 15.7 Network Test Support

The server defines these methods:

| Method | Agent 1.5.10 status |
| --- | --- |
| `networkTest.nextTrace` | Not implemented |
| `networkTest.iperf3` | Not implemented |
| `networkTest.meshTrace` | Not implemented |
| `networkTest.getMeshTraceJob` | Not implemented |

Agent `server/websocket.go` has no handlers for these methods. It logs `unknown v2 event method` and returns no result. Treat them as reserved server-side protocol methods until an Agent release implements them.
