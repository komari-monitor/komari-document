

# Komari API 文档

Komari 提供了一套 API 接口，供开发者进行二次开发和集成。以下是主要的 API 接口文档。

> HTTP API 基地址：`http(s)://<komari-server>`
>
> JSON-RPC 入口：`GET/POST /api/rpc2`
>
> 本文同时包含 HTTP、WebSocket、JSON-RPC 与 Agent v2 RPC。

## 目录

- [1. 快速开始](#_1-快速开始)
- [2. 通用约定](#_2-通用约定)
- [3. 公开接口](#_3-公开接口)
- [4. Agent 接口](#_4-agent-接口)
- [5. 管理员接口](#_5-管理员接口)
- [6. 引导模式接口](#_6-引导模式接口)
- [7. JSON-RPC 快速开始](#_7-json-rpc-快速开始)
- [8. JSON-RPC 协议约定](#_8-json-rpc-协议约定)
- [9. JSON-RPC 鉴权与权限](#_9-json-rpc-鉴权与权限)
- [10. JSON-RPC 错误码](#_10-json-rpc-错误码)
- [11. Internal RPC](#_11-internal-rpc)
- [12. Common RPC](#_12-common-rpc)
- [13. Public RPC](#_13-public-rpc)
- [14. Admin RPC](#_14-admin-rpc)
- [15. Agent v2 RPC](#_15-agent-v2-rpc)

## 1. 快速开始

### 1.1 Base URL

```text
http(s)://<komari-server>
```

### 1.2 认证

如果你需要操作后台（以 `/api/admin` 开头的地址），需要进行认证。

#### API Key

管理员 API Key 使用 Bearer Authentication：

```http
Authorization: Bearer <api-key>
```

:::warning 注意
仅1.0.3之后(不含)的版本可以使用API Key认证
:::

#### Cookie

浏览器登录后使用 `session_token` Cookie。除登录、退出、OAuth 和 2FA 流程外，本文的管理员示例统一使用 API Key。

### 1.3 使用 Client Token

Agent 接口通过 Client Token 鉴权。支持以下形式：

```text
?token=<client-token>
?Authorization=<client-token>
Authorization: Bearer <client-token>
```

JSON 请求体也可使用：

```json
{
  "token": "<client-token>"
}
```

## 2. 通用约定

### 2.1 Response 包络

大部分 REST 接口返回：

```json
{
  "status": "success",
  "message": "",
  "data": {}
}
```

失败响应：

```json
{
  "status": "error",
  "message": "Invalid request"
}
```

部分接口使用 `raw` 或 `flat` 渲染：

| 渲染方式   | 成功响应                                                     |
| ---------- | ------------------------------------------------------------ |
| `standard` | `{ "status":"success", "message":"", "data":<result> }`      |
| `raw`      | 直接返回 `<result>`                                          |
| `flat`     | `result` 对象字段展开到顶层，并附加 `{ "status":"success" }` |

流式、二进制、重定向和特殊鉴权接口不遵循上述 JSON 包络，后文单独说明。

### 2.2 HTTP 状态码

| 状态码 | 含义                            |
| ------ | ------------------------------- |
| `200`  | 请求成功                        |
| `302`  | 重定向                          |
| `400`  | 请求格式或参数错误              |
| `401`  | 未登录、身份无效或 2FA 校验失败 |
| `403`  | 权限不足或功能关闭              |
| `404`  | 资源不存在                      |
| `409`  | 资源冲突或操作正在进行          |
| `413`  | 上传内容超过限制                |
| `429`  | 请求过于频繁                    |
| `500`  | 服务端错误                      |
| `502`  | Agent 或其他上游响应错误        |
| `503`  | Agent 离线或服务不可用          |
| `504`  | 请求超时                        |

### 2.3 私有站点

启用 `private_site` 后，未登录访客访问非白名单 API 会返回：

```json
{
  "status": "error",
  "message": "Private site is enabled, please login first."
}
```

登录页所需的 `/api/login`、`/api/me`、`/api/public`、`/api/version`、`/api/oauth` 等接口仍可访问。

### 2.4 敏感操作 2FA

以下 HTTP 接口可能要求管理员 2FA：

- `POST /api/admin/task/exec`
- `POST /api/admin/update/user`，仅在修改密码时
- `POST /api/admin/2fa/disable`
- 新建 `GET /api/admin/client/:uuid/terminal` WebSocket 会话时

2FA code 的来源顺序：

1. JSON body 的 `2fa_code`、`two_factor_code` 或 `otp`
2. `X-2FA-Code` 请求头
3. `X-Two-Factor-Code` 请求头
4. Query 参数 `2fa_code`、`two_factor_code` 或 `otp`

使用 API Key 调用时不需要重复提供 2FA code；未启用 2FA 的管理员也不需要。

### 2.5 常用类型

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

管理员接口可能额外返回 `token`、`ipv4`、`ipv6`、`remark`、`version` 等字段。

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

## 3. 公开接口

### 3.1 健康检查

**接口：** `ANY /ping`

**鉴权：** 无。

**返回：** 文本 `pong`。

```bash
curl -s "$BASE/ping"
```

### 3.2 登录

**接口：** `POST /api/login`

**鉴权：** 无。

**请求体：**

| 字段       | 类型     | 必填 | 说明              |
| ---------- | -------- | ---- | ----------------- |
| `username` | `string` | 是   | 管理员用户名      |
| `password` | `string` | 是   | 管理员密码        |
| `2fa_code` | `string` | 否   | 已启用 2FA 时必填 |

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

**响应：**

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

同时写入 `session_token` HttpOnly Cookie。密码登录关闭时返回 `403`。

### 3.3 退出登录

**接口：** `GET /api/logout`

**鉴权：** 可选。

**返回：** `302` 重定向到 `/`，并清除 `session_token` Cookie。

```bash
curl -s -D - "$BASE/api/logout"
```

### 3.4 OAuth 登录

**接口：** `GET /api/oauth`

**返回：** `302` 重定向到当前 OAuth Provider 的授权页面。

```bash
open "$BASE/api/oauth"
```

**接口：** `GET /api/oauth_callback`

OAuth Provider 回调地址。登录成功或绑定成功后重定向到 `/admin/dashboard`。

### 3.5 当前身份

**接口：** `GET /api/me`

**鉴权：** 无；未登录时返回 Guest 信息。

**响应：** raw JSON。

未登录：

```json
{
  "username": "Guest",
  "logged_in": false
}
```

已登录：

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

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/me"
```

### 3.6 节点基础信息

**接口：** `GET /api/nodes`

**鉴权：** Guest。

**响应：** standard 包装，`data` 为 `Client[]`。未登录时过滤 Hidden 节点，并清空 IP、备注、Agent 版本和 Token。

```bash
curl -s "$BASE/api/nodes"
```

### 3.7 公开站点设置

**接口：** `GET /api/public`

**鉴权：** Guest。

**响应：** standard 包装，`data` 为站点公开设置键值对象。

```bash
curl -s "$BASE/api/public"
```

### 3.8 服务端版本

**接口：** `GET /api/version`

**响应：**

```json
{
  "status": "success",
  "message": "",
  "data": {
    "version": "1.0.0",
    "hash": "b11ffd3"
  }
}
```

```bash
curl -s "$BASE/api/version"
```

### 3.9 节点最近上报

**接口：** `GET /api/recent/:uuid`

**鉴权：** Guest；未登录时不能读取 Hidden 节点。

**路径参数：**

| 参数   | 类型     | 说明        |
| ------ | -------- | ----------- |
| `uuid` | `string` | Client UUID |

**响应：** standard 包装，`data` 为内存中的最近上报数组。

```bash
curl -s "$BASE/api/recent/d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
```

### 3.10 节点负载记录

**接口：** `GET /api/records/load`

**鉴权：** Guest；未登录时不能读取 Hidden 节点。

**Query 参数：**

| 参数        | 类型      | 必填 | 默认 | 说明                                                                                              |
| ----------- | --------- | ---- | ---- | ------------------------------------------------------------------------------------------------- |
| `uuid`      | `string`  | 是   | -    | Client UUID                                                                                       |
| `load_type` | `string`  | 否   | 全部 | `cpu`、`ram`、`swap`、`load`、`temp`、`disk`、`network`、`process`、`connections`、`all` 或 `gpu` |
| `hours`     | `integer` | 否   | `4`  | 回溯小时数                                                                                        |

**响应：**

```json
{
  "status": "success",
  "message": "",
  "data": {
    "records": [],
    "count": 0,
    "load_type": "cpu"
  }
}
```

未指定 `load_type` 或指定 `all`、`gpu` 时，响应可能包含 `gpu_devices` 和 `has_gpu_data`。

```bash
curl -s "$BASE/api/records/load?uuid=<uuid>&load_type=cpu&hours=6"
```

### 3.11 节点 Ping 记录

**接口：** `GET /api/records/ping`

**鉴权：** Guest。

**Query 参数：**

| 参数      | 类型      | 必填     | 默认 | 说明                                   |
| --------- | --------- | -------- | ---- | -------------------------------------- |
| `uuid`    | `string`  | 条件必填 | -    | Client UUID；与 `task_id` 至少一个必填 |
| `task_id` | `integer` | 条件必填 | -    | Ping Task ID                           |
| `hours`   | `integer` | 否       | `4`  | 回溯小时数                             |

**响应：**

```json
{
  "status": "success",
  "message": "",
  "data": {
    "count": 2,
    "records": [
      {
        "task_id": 1,
        "time": "2026-09-16T08:30:00Z",
        "value": 32,
        "client": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
      }
    ],
    "tasks": [],
    "basic_info": []
  }
}
```

```bash
curl -s "$BASE/api/records/ping?uuid=<uuid>&hours=4"
```

### 3.12 公开 Ping 任务

**接口：** `GET /api/task/ping`

**响应：** standard 包装，`data` 为公开 Ping Task 列表。

```json
{
  "status": "success",
  "message": "",
  "data": [
    {
      "id": 1,
      "weight": 0,
      "name": "Tokyo -> Cloudflare",
      "clients": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"],
      "default_on": false,
      "type": "icmp",
      "interval": 60
    }
  ]
}
```

```bash
curl -s "$BASE/api/task/ping"
```

### 3.13 客户端实时数据 WebSocket

**接口：** `GET /api/clients`

**鉴权：** Guest；未登录时过滤 Hidden 节点。

建立 WebSocket 后发送：

```text
get
```

获取全部可见节点的在线状态与最近上报；发送：

```text
get <uuid>
```

只获取指定节点。

服务端返回：

```json
{
  "status": "success",
  "data": {
    "online": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"],
    "data": {
      "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d": {
        "cpu": {
          "name": "AMD EPYC 7B13",
          "cores": 4,
          "arch": "x86_64",
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
        "uptime": 86400,
        "process": 132,
        "message": "",
        "updated_at": "2026-09-16T08:30:00Z"
      }
    }
  }
}
```

浏览器示例：

```js
const ws = new WebSocket(
  `${location.origin.replace(/^http/, "ws")}/api/clients`,
);

ws.onopen = () => ws.send("get");
ws.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

### 3.14 公开插件页面

**接口：** `GET /api/plugin/:short/*filepath`

**鉴权：** 无。

仅能访问已启用插件中声明为 `visibility: "public"` 的 iframe 页面及其同目录资源。

```bash
curl -s "$BASE/api/plugin/status-extension/pages/public.html"
```

## 4. Agent 接口

### 4.1 AutoDiscovery 注册

**接口：** `POST /api/clients/register`

**鉴权：** `Authorization: Bearer <auto_discovery_key>`

**Query 参数：**

| 参数   | 类型     | 必填 | 说明                     |
| ------ | -------- | ---- | ------------------------ |
| `name` | `string` | 否   | 节点名称；省略时自动生成 |

```bash
curl -s -X POST "$BASE/api/clients/register?name=web-01" \
  -H "Authorization: Bearer $AUTO_DISCOVERY_KEY"
```

**响应：**

```json
{
  "status": "success",
  "message": "",
  "data": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "token": "<client-token>"
  }
}
```

### 4.2 Agent v2 HTTP JSON-RPC

**接口：** `POST /api/clients/v2/rpc`

**鉴权：** Client Token。

**Content-Type：** `application/json`

请求体为单个 Agent v2 JSON-RPC 请求。支持 `Content-Encoding: gzip`。

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

Agent v2 方法、参数与事件见 [Agent v2 RPC](#_15-agent-v2-rpc)。

### 4.3 Agent v2 WebSocket

**接口：** `GET /api/clients/v2/rpc`

**鉴权：** Client Token。

建立 WebSocket 后，双方按 Agent v2 JSON-RPC 格式收发消息。服务端可主动推送：

- `agent.exec`
- `agent.ping`
- `agent.message`
- `agent.event`
- `agent.terminal.request`
- 文件传输控制事件

浏览器或调试工具可使用：

```js
const token = "<client-token>";
const ws = new WebSocket(
  `${location.origin.replace(/^http/, "ws")}/api/clients/v2/rpc?token=${encodeURIComponent(token)}`,
);

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      jsonrpc: "2.0",
      method: "agent.pull",
      params: {},
      id: 1,
    }),
  );
};

ws.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

### 4.4 Agent 文件流转发

**接口：** `POST /api/clients/transfer/:id`

**备用入口：** `GET /api/clients/transfer/:id`

**鉴权：** Client Token。

该接口不面向普通调用方。服务器通过 Agent RPC 下发 `transfer_id` 与 `transfer_token` 后，Agent 使用此接口在浏览器和 Agent 之间转发文件内容。

请求头：

```http
X-Komari-Transfer-Token: <transfer-token>
X-Komari-Transfer-ID: <transfer-id>
```

`POST` 用于上传或下载数据流；`GET` 仅兼容上传方向。

### 4.5 Agent 终端 WebSocket

**接口：** `GET /api/clients/terminal?id=<request-id>`

**鉴权：** Client Token。

Agent 根据服务器下发的 `agent.terminal.request` 事件，使用 Client Token 和 `request_id` 连接：

```text
GET /api/clients/terminal?token=<client-token>&id=<request-id>
```

终端建立过程见 [Agent v2 RPC](#_15-agent-v2-rpc)。

## 5. 管理员接口

以下接口均要求管理员身份，可通过 session Cookie 或 API Key 调用。

### 5.1 节点管理

#### 5.1.1 新增节点

**接口：** `POST /api/admin/client/add`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/client/add" \
  -H "Content-Type: application/json" \
  -d '{"name":"Tokyo-01"}'
```

**响应：** flat。

```json
{
  "status": "success",
  "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
  "token": "<client-token>"
}
```

#### 5.1.2 节点列表

**接口：** `GET /api/admin/client/list`

**响应：** raw，`Client[]`。

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/client/list"
```

#### 5.1.3 节点详情

**接口：** `GET /api/admin/client/:uuid`

**响应：** raw，单个 `Client`。

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/client/<uuid>"
```

#### 5.1.4 编辑节点

**接口：** `POST /api/admin/client/:uuid/edit`

请求体可包含节点字段的部分更新，`uuid` 从路径参数合并：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/client/<uuid>/edit" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tokyo-01",
    "group": "Tokyo",
    "hidden": false,
    "weight": 10
  }'
```

**响应：**

```json
{
  "status": "success",
  "message": ""
}
```

#### 5.1.5 删除节点

**接口：** `POST /api/admin/client/:uuid/remove`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/client/<uuid>/remove"
```

#### 5.1.6 读取节点 Token

**接口：** `GET /api/admin/client/:uuid/token`

**响应：** flat。

```json
{
  "status": "success",
  "token": "<client-token>"
}
```

#### 5.1.7 调整节点顺序

**接口：** `POST /api/admin/client/order`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/client/order" \
  -H "Content-Type: application/json" \
  -d '{
    "<uuid-a>": 10,
    "<uuid-b>": 20
  }'
```

### 5.2 节点执行任务

#### 5.2.1 查询全部任务

**接口：** `GET /api/admin/task/all`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/task/all"
```

#### 5.2.2 执行命令

**接口：** `POST /api/admin/task/exec`

**敏感操作：** 是，可能要求 2FA。

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/task/exec" \
  -H "Content-Type: application/json" \
  -H "X-2FA-Code: 123456" \
  -d '{
    "command": "uptime",
    "clients": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"]
  }'
```

**响应：**

```json
{
  "status": "success",
  "message": "",
  "data": {
    "task_id": "7cS2QmW8xKp4nA1v",
    "clients": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"],
    "queued_clients": []
  }
}
```

离线节点会直接写入 `Client offline!` 结果；全部节点离线时返回参数错误。

#### 5.2.3 查询任务

| 接口                                        | 说明                   |
| ------------------------------------------- | ---------------------- |
| `GET /api/admin/task/:task_id`              | 查询单个任务及结果     |
| `GET /api/admin/task/:task_id/result`       | 查询任务的全部结果     |
| `GET /api/admin/task/:task_id/result/:uuid` | 查询指定节点的一次结果 |
| `GET /api/admin/task/client/:uuid`          | 查询指定节点的任务     |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/task/<task-id>"
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/task/<task-id>/result"
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/task/<task-id>/result/<uuid>"
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/task/client/<uuid>"
```

### 5.3 设置

#### 5.3.1 读取全部设置

**接口：** `GET /api/admin/settings/`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/settings/"
```

#### 5.3.2 修改设置

**接口：** `POST /api/admin/settings/`

请求体为设置键值对象，仅提交需要修改的字段：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/settings/" \
  -H "Content-Type: application/json" \
  -d '{
    "sitename": "Komari Monitor",
    "private_site": true
  }'
```

若修改 metrics 数据库连接，接口会先测试连接并尝试热加载。结构升级需要重启时返回：

```json
{
  "status": "success",
  "message": "",
  "data": {
    "restart_required": true,
    "guide_path": "/admin/database-migration"
  }
}
```

#### 5.3.3 xterm.js 设置

**接口：**

- `GET /api/admin/settings/xtermjs`
- `POST /api/admin/settings/xtermjs`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/settings/xtermjs"

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/settings/xtermjs" \
  -H "Content-Type: application/json" \
  -d '{
    "terminalOptions": {
      "cursorBlink": true,
      "convertEol": true,
      "fontFamily": "monospace",
      "fontSize": 16,
      "scrollback": 5000
    },
    "terminalPadding": 16,
    "transparentBackground": false,
    "customCss": ""
  }'
```

### 5.4 Provider 配置

#### 5.4.1 消息发送 Provider

**接口：**

- `GET /api/admin/settings/message-sender`
- `POST /api/admin/settings/message-sender`

读取指定 Provider：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/settings/message-sender?provider=telegram"
```

省略 `provider` 时返回可用 Provider 配置模板列表。

保存配置：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/settings/message-sender" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "telegram",
    "addition": "{\"bot_token\":\"...\",\"chat_id\":\"...\"}"
  }'
```

#### 5.4.2 OIDC Provider

**接口：**

- `GET /api/admin/settings/oidc`
- `POST /api/admin/settings/oidc`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/settings/oidc?provider=github"

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/settings/oidc" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "github",
    "addition": "{\"client_id\":\"...\",\"client_secret\":\"...\"}"
  }'
```

### 5.5 会话管理

#### 5.5.1 会话列表

**接口：** `GET /api/admin/session/get`

**响应：** flat。

```json
{
  "status": "success",
  "current": "<current-session-token>",
  "data": []
}
```

#### 5.5.2 删除会话

**接口：**

- `POST /api/admin/session/remove`
- `POST /api/admin/session/remove/all`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/session/remove" \
  -H "Content-Type: application/json" \
  -d '{"session":"<session-token>"}'

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/session/remove/all"
```

### 5.6 审计日志

**接口：** `GET /api/admin/logs`

**Query 参数：**

| 参数    | 类型      | 默认  | 说明     |
| ------- | --------- | ----- | -------- |
| `limit` | `integer` | `100` | 每页数量 |
| `page`  | `integer` | `1`   | 页码     |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/logs?limit=20&page=1"
```

**响应：**

```json
{
  "status": "success",
  "message": "",
  "data": {
    "logs": [],
    "total": 0
  }
}
```

### 5.7 剪贴板

| 方法   | 接口                              | 说明     |
| ------ | --------------------------------- | -------- |
| `GET`  | `/api/admin/clipboard`            | 列表     |
| `POST` | `/api/admin/clipboard`            | 新建     |
| `GET`  | `/api/admin/clipboard/:id`        | 详情     |
| `POST` | `/api/admin/clipboard/:id`        | 更新     |
| `POST` | `/api/admin/clipboard/remove`     | 批量删除 |
| `POST` | `/api/admin/clipboard/:id/remove` | 删除单项 |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/clipboard"

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/clipboard" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Common commands",
    "text": "systemctl status komari",
    "weight": 0,
    "remark": ""
  }'

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/clipboard/remove" \
  -H "Content-Type: application/json" \
  -d '{"ids":[1,2]}'
```

### 5.8 通知规则

#### 5.8.1 负载通知

| 方法   | 接口                                  | 说明 |
| ------ | ------------------------------------- | ---- |
| `GET`  | `/api/admin/notification/load/`       | 列表 |
| `POST` | `/api/admin/notification/load/add`    | 新建 |
| `POST` | `/api/admin/notification/load/edit`   | 编辑 |
| `POST` | `/api/admin/notification/load/delete` | 删除 |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/notification/load/add" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CPU high",
    "clients": ["<uuid>"],
    "metric": "cpu",
    "threshold": 90,
    "ratio": 0.8,
    "interval": 15
  }'
```

`interval` 单位为分钟，范围 `1..240`；`ratio` 范围 `(0,1]`。

#### 5.8.2 离线通知

| 方法   | 接口                                      | 说明       |
| ------ | ----------------------------------------- | ---------- |
| `GET`  | `/api/admin/notification/offline`         | 列表       |
| `POST` | `/api/admin/notification/offline/edit`    | 新建或更新 |
| `POST` | `/api/admin/notification/offline/enable`  | 启用       |
| `POST` | `/api/admin/notification/offline/disable` | 停用       |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/notification/offline/edit" \
  -H "Content-Type: application/json" \
  -d '[{
    "client": "<uuid>",
    "enable": true,
    "grace_period": 180
  }]'

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/notification/offline/enable" \
  -H "Content-Type: application/json" \
  -d '["<uuid>"]'
```

### 5.9 Ping 任务

| 方法   | 接口                     | 说明 |
| ------ | ------------------------ | ---- |
| `GET`  | `/api/admin/ping/`       | 列表 |
| `POST` | `/api/admin/ping/add`    | 新建 |
| `POST` | `/api/admin/ping/edit`   | 编辑 |
| `POST` | `/api/admin/ping/delete` | 删除 |
| `POST` | `/api/admin/ping/order`  | 排序 |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/ping/add" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cloudflare",
    "target": "1.1.1.1",
    "type": "icmp",
    "interval": 60,
    "clients": ["<uuid>"],
    "default_on": false
  }'

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/ping/delete" \
  -H "Content-Type: application/json" \
  -d '{"id":[1]}'
```

### 5.10 主题管理

| 方法   | 接口                                   | 说明               |
| ------ | -------------------------------------- | ------------------ |
| `GET`  | `/api/admin/theme/list`                | 主题列表           |
| `GET`  | `/api/admin/theme/set?theme=`          | 设置当前主题       |
| `POST` | `/api/admin/theme/delete`              | 删除主题           |
| `POST` | `/api/admin/theme/update`              | 更新主题           |
| `POST` | `/api/admin/theme/import?preview=true` | 预览或安装远程主题 |
| `POST` | `/api/admin/theme/settings?theme=`     | 保存主题配置       |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/theme/list"

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/theme/import?preview=true" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/theme.zip"}'
```

### 5.11 主题市场

| 方法     | 接口                                           | 说明       |
| -------- | ---------------------------------------------- | ---------- |
| `GET`    | `/api/admin/theme/market/sources`              | 数据源列表 |
| `POST`   | `/api/admin/theme/market/sources`              | 新建数据源 |
| `PUT`    | `/api/admin/theme/market/sources/:id`          | 更新数据源 |
| `DELETE` | `/api/admin/theme/market/sources/:id`          | 删除数据源 |
| `GET`    | `/api/admin/theme/market/catalog?refresh=true` | 市场目录   |
| `POST`   | `/api/admin/theme/market/install`              | 安装主题   |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/theme/market/catalog?refresh=true"

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/theme/market/install" \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": "official",
    "short": "example-theme"
  }'
```

安装时服务器会重新下载 ZIP、校验 SHA-256，并核对 manifest 的 `short` 与 `version`。

### 5.12 插件管理

| 方法   | 接口                                     | 说明               |
| ------ | ---------------------------------------- | ------------------ |
| `GET`  | `/api/admin/plugin/list`                 | 插件列表           |
| `POST` | `/api/admin/plugin/enabled`              | 启用或停用         |
| `GET`  | `/api/admin/plugin/logs?short=`          | 运行日志           |
| `POST` | `/api/admin/plugin/delete`               | 删除插件           |
| `GET`  | `/api/admin/plugin/configuration?short=` | 配置声明与已保存值 |
| `POST` | `/api/admin/plugin/configuration`        | 保存配置           |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/plugin/enabled" \
  -H "Content-Type: application/json" \
  -d '{
    "short": "status-extension",
    "enabled": true,
    "approved": true
  }'

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/plugin/configuration" \
  -H "Content-Type: application/json" \
  -d '{
    "short": "status-extension",
    "data": {
      "message": "hello"
    }
  }'
```

权限声明发生变化时，启用请求可能返回：

```json
{
  "status": "success",
  "message": "",
  "data": {
    "requires_approval": true
  }
}
```

调用方确认权限后，带 `approved: true` 重试。

### 5.13 插件市场

| 方法     | 接口                                            | 说明       |
| -------- | ----------------------------------------------- | ---------- |
| `GET`    | `/api/admin/plugin/market/sources`              | 数据源列表 |
| `POST`   | `/api/admin/plugin/market/sources`              | 新建数据源 |
| `PUT`    | `/api/admin/plugin/market/sources/:id`          | 更新数据源 |
| `DELETE` | `/api/admin/plugin/market/sources/:id`          | 删除数据源 |
| `GET`    | `/api/admin/plugin/market/catalog?refresh=true` | 市场目录   |
| `POST`   | `/api/admin/plugin/market/install`              | 安装插件   |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/plugin/market/install" \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": "official",
    "short": "status-extension"
  }'
```

### 5.14 通用分片上传

管理员备份恢复、插件安装和主题上传共用以下接口：

| 接口                            | 用途                 |
| ------------------------------- | -------------------- |
| `POST /api/admin/upload/init`   | 初始化上传           |
| `POST /api/admin/upload/chunk`  | 上传分片             |
| `POST /api/admin/upload/merge`  | 合并并执行安装或恢复 |
| `POST /api/admin/upload/cancel` | 取消上传             |

`purpose` 可选：

| 值       | 合并后的动作                  |
| -------- | ----------------------------- |
| `backup` | 校验备份并安排 2 秒后重启恢复 |
| `plugin` | 安装插件 ZIP                  |
| `theme`  | 安装主题 ZIP                  |

初始化：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/upload/init" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "plugin",
    "filename": "status-extension.zip",
    "size": 1234567
  }'
```

响应：

```json
{
  "status": "success",
  "message": "",
  "data": {
    "upload_id": "8b2d8a72-80b7-43c5-a57c-67c7a8f04c10",
    "chunk_size": 5242880
  }
}
```

上传分片：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/upload/chunk" \
  -F "upload_id=<upload-id>" \
  -F "chunk_index=0" \
  -F "chunk_data=@chunk-0.bin"
```

除最后一片外，每片必须恰好为 `5242880` 字节。合并：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/upload/merge" \
  -H "Content-Type: application/json" \
  -d '{"upload_id":"<upload-id>"}'
```

取消：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/upload/cancel" \
  -H "Content-Type: application/json" \
  -d '{"upload_id":"<upload-id>"}'
```

### 5.15 备份

**接口：** `GET /api/admin/download/backup`

**响应：** `application/zip` 文件下载。

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -o backup.zip \
  "$BASE/api/admin/download/backup"
```

恢复使用 `POST /api/admin/upload/*`，并设置 `purpose: "backup"`。

### 5.16 节点文件管理

节点文件功能分为两层：

- 目录、属性和修改操作通过 JSON-RPC 调用，方法位于 `admin:*` 命名空间。
- 文件内容通过 HTTP 流接口上传、下载，避免把大文件放进 JSON-RPC 消息。

#### 5.16.1 操作一览

| 操作               | 调用方式 | 接口或方法                                       | 主要参数                                           |
| ------------------ | -------- | ------------------------------------------------ | -------------------------------------------------- |
| 列出文件系统根目录 | JSON-RPC | `admin:fileListRoots`                            | `uuid`                                             |
| 列出目录           | JSON-RPC | `admin:fileList`                                 | `uuid`、`path`                                     |
| 读取文件或目录属性 | JSON-RPC | `admin:fileStat`                                 | `uuid`、`path`                                     |
| 创建目录           | JSON-RPC | `admin:fileMkdir`                                | `uuid`、`path`、`mode?`                            |
| 删除文件或目录     | JSON-RPC | `admin:fileDelete`                               | `uuid`、`path`                                     |
| 移动或重命名       | JSON-RPC | `admin:fileMove`                                 | `uuid`、`source`、`destination`                    |
| 复制文件           | JSON-RPC | `admin:fileCopy`                                 | `uuid`、`source`、`destination`                    |
| 修改权限           | JSON-RPC | `admin:fileChmod`                                | `uuid`、`path`、`mode`                             |
| 修改属主或属组     | JSON-RPC | `admin:fileChown`                                | `uuid`、`path`、`uid?`、`gid?`、`owner?`、`group?` |
| 搜索路径或文件内容 | JSON-RPC | `admin:fileSearch`                               | `uuid`、`path`、`query`、`content?`                |
| 上传文件内容       | HTTP     | `POST /api/admin/client/:uuid/file/upload`       | `operation`                                        |
| 下载文件内容       | HTTP     | `GET/HEAD /api/admin/client/:uuid/file/download` | `path`                                             |
| 创建预览下载令牌   | HTTP     | `GET /api/admin/client/:uuid/file/preview-token` | `path`                                             |

所有操作都要求目标 Agent 在线，并支持对应的文件操作能力。

#### 5.16.2 列出目录与读取属性

列出 Agent 暴露的文件系统根目录：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "admin:fileListRoots",
    "params": {
      "uuid": "<uuid>"
    },
    "id": 1
  }'
```

列出指定目录：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "admin:fileList",
    "params": {
      "uuid": "<uuid>",
      "path": "/var/log"
    },
    "id": 2
  }'
```

读取单个路径的属性：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "admin:fileStat",
    "params": {
      "uuid": "<uuid>",
      "path": "/var/log/syslog"
    },
    "id": 3
  }'
```

创建目录、移动或删除路径：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "admin:fileMkdir",
    "params": {
      "uuid": "<uuid>",
      "path": "/tmp/releases",
      "mode": "0755"
    },
    "id": 4
  }'

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "admin:fileMove",
    "params": {
      "uuid": "<uuid>",
      "source": "/tmp/package.tar.gz",
      "destination": "/tmp/releases/package.tar.gz"
    },
    "id": 5
  }'

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "admin:fileDelete",
    "params": {
      "uuid": "<uuid>",
      "path": "/tmp/releases/package.tar.gz"
    },
    "id": 6
  }'
```

完整的参数和结果说明见 [Admin RPC 节点文件操作](#_14-12-节点文件操作)。

#### 5.16.3 上传文件内容

**接口：** `POST /api/admin/client/:uuid/file/upload?operation=`

`operation` 可选：

| 值       | 请求                                                                 |
| -------- | -------------------------------------------------------------------- |
| `init`   | JSON：`{"path":"/tmp/file.bin","size":123456,"chunk_size":26214400}` |
| `chunk`  | 二进制请求体；Query：`upload_id`、`chunk_index`                      |
| `merge`  | JSON：`{"upload_id":"<upload-id>"}`                                  |
| `cancel` | Query：`upload_id`，也兼容 JSON：`{"upload_id":"<upload-id>"}`       |

初始化：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/client/<uuid>/file/upload?operation=init" \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/tmp/package.tar.gz",
    "size": 104857600,
    "chunk_size": 26214400
  }'
```

上传分片：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/client/<uuid>/file/upload?operation=chunk&upload_id=<upload-id>&chunk_index=0" \
  --data-binary @chunk-0.bin
```

合并：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/client/<uuid>/file/upload?operation=merge" \
  -H "Content-Type: application/json" \
  -d '{"upload_id":"<upload-id>"}'
```

#### 5.16.4 下载文件内容

**接口：**

- `GET /api/admin/client/:uuid/file/download?path=`
- `HEAD /api/admin/client/:uuid/file/download?path=`

支持单段 `Range` 请求，响应包含 `Accept-Ranges`、`Content-Range`、`ETag` 和 `X-Komari-Transfer-Chunk-Size`。

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -o package.tar.gz \
  "$BASE/api/admin/client/<uuid>/file/download?path=/tmp/package.tar.gz"

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -H "Range: bytes=0-1048575" \
  -o part.bin \
  "$BASE/api/admin/client/<uuid>/file/download?path=/tmp/package.tar.gz"
```

#### 5.16.5 创建预览令牌

**接口：** `GET /api/admin/client/:uuid/file/preview-token?path=`

```json
{
  "status": "success",
  "message": "",
  "data": {
    "token": "fdae3eee-3f4f-4ba8-8dae-5b2238b68a15",
    "expires_in": 600
  }
}
```

公开下载接口：

```text
GET /api/preview/client/:uuid/file/download?preview_token=<token>&filename=<ascii-name>
HEAD /api/preview/client/:uuid/file/download?preview_token=<token>&filename=<ascii-name>
```

```bash
curl -s \
  "$BASE/api/preview/client/<uuid>/file/download?preview_token=<token>&filename=report.docx"
```

### 5.17 节点终端

**接口：** `GET /api/admin/client/:uuid/terminal`

**协议：** WebSocket。

终端由浏览器侧 WebSocket、Agent 侧 WebSocket 和服务器内存中的 `request_id` 会话组成。浏览器侧连接：

```text
GET /api/admin/client/:uuid/terminal
```

Agent 侧反向连接：

```text
GET /api/clients/terminal?id=<request_id>
```

#### 5.17.1 新建会话

新建会话时不能提供 `request_id`，并且需要通过 2FA 校验。2FA code 可放在 Query、`X-2FA-Code` 请求头或 `X-Two-Factor-Code` 请求头中。

```js
const params = new URLSearchParams();
params.set("2fa_code", "123456");

const ws = new WebSocket(
  `${location.origin.replace(/^http/, "ws")}/api/admin/client/${uuid}/terminal?${params}`,
);

ws.onmessage = (event) => {
  console.log(event.data);
};
```

服务端首条 JSON 消息返回：

```json
{
  "request_id": "0e9f95c9f7f34b27a0ec85a818fec2b3"
}
```

后续 WebSocket 文本和二进制帧直接作为终端输入输出转发。

新建流程：

1. 浏览器连接管理员终端接口，服务端生成 `request_id` 并立即返回。
2. 服务端向对应 Agent 下发 `agent.terminal.request` 事件。
3. Agent 使用 Client Token 连接 `/api/clients/terminal?id=<request_id>`。
4. 浏览器和 Agent 两侧都连接后，服务端开始双向转发终端数据。
5. Agent 暂时无法接收请求时，浏览器会收到 `Client offline!` 或等待提示，会话可能被关闭。

#### 5.17.2 浏览器重连

浏览器 WebSocket 断开后，终端会话不会立即销毁。任一侧断开时，服务器会挂起转发并保留会话 5 分钟。

重连时必须复用原来的 `request_id`：

```js
const params = new URLSearchParams();
params.set("request_id", requestId);

const ws = new WebSocket(
  `${location.origin.replace(/^http/, "ws")}/api/admin/client/${uuid}/terminal?${params}`,
);

ws.onmessage = (event) => {
  console.log(event.data);
};
```

重连规则：

- 浏览器重连不要求新的 2FA code。
- 普通管理员只能重连自己创建的会话；API Key 可以重连匹配 `uuid` 的任意会话。
- 重连成功后会再次收到 `{ "request_id": "<request_id>" }`。
- 服务端会重新通知 Agent 回连；Agent 尚未连接时返回 `等待被控端连接 waiting for agent...`。
- 浏览器和 Agent 都重新连接后，取消清理定时器并继续转发。

如果 `request_id` 不存在或已经超过 5 分钟，接口返回 `404` 和 `Terminal session not found`。此时不要继续使用旧 ID，需要重新创建会话并重新完成 2FA。

#### 5.17.3 Agent 重连

Agent WebSocket 断开后，服务器会同时挂起并关闭另一端浏览器连接，整个会话进入 5 分钟保留期。恢复顺序是：

1. 浏览器先使用原 `request_id` 重新连接管理员终端接口。
2. 服务器重新向 Agent 下发 `agent.terminal.request`。
3. Agent 使用相同 Client Token 和原 `request_id` 连接：

```text
GET /api/clients/terminal?id=<request_id>
```

规则：

- Client Token 对应的 UUID 必须与会话目标节点一致。
- 会话必须在 5 分钟保留期内，否则返回 `404 Session not found`。
- Agent 重连不会创建新的终端会话或更换 `request_id`。
- 浏览器尚未重新附加时，Agent 无法单独恢复会话。
- 浏览器和 Agent 都重新连接后立即恢复双向转发。

#### 5.17.4 会话失效

浏览器和 Agent 中任一侧断开后会启动 5 分钟清理计时；两侧在期限内重新连接时取消计时。超过 5 分钟仍未恢复时：

- 删除服务器内存中的终端会话。
- 关闭浏览器和 Agent 两侧连接。
- 原 `request_id` 失效，后续重连返回 `404`。

### 5.18 2FA

#### 5.18.1 生成密钥与二维码

**接口：** `GET /api/admin/2fa/generate`

返回 PNG 二维码，并设置 `2fa_secret` Cookie，有效期 30 分钟。

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -o qr.png \
  "$BASE/api/admin/2fa/generate"
```

#### 5.18.2 启用 2FA

**接口：** `POST /api/admin/2fa/enable?code=`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/2fa/enable?code=123456"
```

#### 5.18.3 停用 2FA

**接口：** `POST /api/admin/2fa/disable`

需要通过敏感操作 2FA 校验。

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/2fa/disable" \
  -H "X-2FA-Code: 123456"
```

### 5.19 OAuth 绑定

| 方法   | 接口                       | 说明                        |
| ------ | -------------------------- | --------------------------- |
| `GET`  | `/api/admin/oauth2/bind`   | `302` 跳转到 OAuth Provider |
| `POST` | `/api/admin/oauth2/unbind` | 解绑外部账号                |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/oauth2/unbind"
```

### 5.20 用户与 GeoIP

#### 5.20.1 更新用户

**接口：** `POST /api/admin/update/user`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/update/user" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "<user-uuid>",
    "username": "admin"
  }'
```

修改密码时额外提供 `password` 与 `2fa_code`：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/update/user" \
  -H "Content-Type: application/json" \
  -d '{
    "uuid": "<user-uuid>",
    "password": "NewPassword123",
    "2fa_code": "123456"
  }'
```

#### 5.20.2 更新 GeoIP 数据库

**接口：** `POST /api/admin/update/mmdb`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/update/mmdb"
```

#### 5.20.3 Favicon

| 方法   | 接口                        | 说明                           |
| ------ | --------------------------- | ------------------------------ |
| `PUT`  | `/api/admin/update/favicon` | 上传 `favicon.ico`，最大 5 MiB |
| `POST` | `/api/admin/update/favicon` | 删除 favicon                   |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X PUT "$BASE/api/admin/update/favicon" \
  --data-binary @favicon.ico

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/update/favicon"
```

### 5.21 数据库维护

#### 5.21.1 数据库容量

**接口：** `GET /api/admin/database/size`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/database/size"
```

**响应：**

```json
{
  "status": "success",
  "message": "",
  "data": {
    "type": "sqlite",
    "size": 1048576,
    "main": {
      "driver": "sqlite",
      "location": "local",
      "size": 1048576,
      "action": "vacuum"
    },
    "monitoring": {
      "driver": "sqlite",
      "location": "local",
      "size": 2097152,
      "action": "vacuum"
    },
    "local_total": 3145728
  }
}
```

#### 5.21.2 压缩数据库

**接口：** `POST /api/admin/database/vacuum`

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/database/vacuum"
```

### 5.22 诊断 pprof

所有接口要求管理员身份。

| 方法  | 接口                                  | 说明                |
| ----- | ------------------------------------- | ------------------- |
| `GET` | `/api/admin/pprof/summary`            | 配置概览            |
| `GET` | `/api/admin/pprof/profile?seconds=10` | CPU profile，二进制 |
| `GET` | `/api/admin/pprof/trace?seconds=10`   | 执行 trace，二进制  |
| `GET` | `/api/admin/pprof/allocs`             | 内存分配 profile    |
| `GET` | `/api/admin/pprof/block`              | 阻塞 profile        |
| `GET` | `/api/admin/pprof/goroutine`          | goroutine profile   |
| `GET` | `/api/admin/pprof/heap`               | 堆 profile          |
| `GET` | `/api/admin/pprof/mutex`              | mutex profile       |
| `GET` | `/api/admin/pprof/threadcreate`       | 线程创建 profile    |

CPU profile 与 trace 支持 `seconds=1..30`；Runtime profile 可使用 `?format=text` 获取文本预览。

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -o cpu.pprof \
  "$BASE/api/admin/pprof/profile?seconds=10"

curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/pprof/goroutine?format=text"
```

## 6. 引导模式接口

这些接口仅在安装、数据库恢复或数据库迁移模式中临时启用。

### 6.1 安装向导

| 方法   | 接口                         | 说明                     |
| ------ | ---------------------------- | ------------------------ |
| `GET`  | `/api/install/status`        | 安装状态                 |
| `POST` | `/api/install/complete`      | 创建管理员并写入初始设置 |
| `POST` | `/api/install/upload/init`   | 初始化备份恢复上传       |
| `POST` | `/api/install/upload/chunk`  | 上传恢复分片             |
| `POST` | `/api/install/upload/merge`  | 合并并安排恢复           |
| `POST` | `/api/install/upload/cancel` | 取消恢复上传             |

完成安装：

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

密码长度为 8 到 256 个字符，且必须同时包含大写字母、小写字母和数字。

### 6.2 数据库恢复

| 方法   | 接口                                  | 说明           |
| ------ | ------------------------------------- | -------------- |
| `GET`  | `/api/admin/database-recovery/auth`   | 可用登录方式   |
| `GET`  | `/api/admin/database-recovery/status` | 恢复状态       |
| `POST` | `/api/admin/database-recovery`        | 提交监控库 DSN |

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/database-recovery" \
  -H "Content-Type: application/json" \
  -d '{
    "dsn": "postgresql://user:pass@db:5432/komari"
  }'
```

### 6.3 数据库迁移向导

| 方法   | 接口                                    | 说明                  |
| ------ | --------------------------------------- | --------------------- |
| `GET`  | `/api/admin/database-migration/auth`    | 登录方式与迁移模式    |
| `GET`  | `/api/admin/database-migration/status`  | 迁移进度              |
| `POST` | `/api/admin/database-migration/start`   | 开始迁移              |
| `POST` | `/api/admin/database-migration/discard` | 丢弃历史 metrics 数据 |

Legacy 监控数据迁移：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/database-migration/start" \
  -H "Content-Type: application/json" \
  -d '{
    "driver": "postgresql",
    "dsn": "postgresql://user:pass@db:5432/komari",
    "confirm_sqlite_risk": false,
    "confirm_large_dataset": false
  }'
```

Metric Store 结构升级模式使用空请求体开始迁移：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  -X POST "$BASE/api/admin/database-migration/start" \
  -H "Content-Type: application/json" \
  -d '{}'
```

轮询进度：

```bash
curl -s \
  -H "Authorization: Bearer $KOMARI_API_KEY" \
  "$BASE/api/admin/database-migration/status"
```

状态字段包括 `mode`、`state`、`phase`、`progress`、`error`，以及对应模式下的行数、指标数、字节数等统计字段。

## 7. JSON-RPC 快速开始

### 7.1 Base URL

```text
http(s)://<komari-server>/api/rpc2
```

### 7.2 发起请求

```bash
export BASE="http://127.0.0.1:8080"

curl -s "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "public:getVersion",
    "params": {},
    "id": 1
  }'
```

响应：

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

### 7.3 使用 Session Cookie

管理员登录成功后，将服务端返回的 `session_token` 作为 Cookie 发送：

```bash
curl -s \
  -H "Cookie: session_token=<session-token>" \
  "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "admin:listClients",
    "params": {},
    "id": "clients"
  }'
```

### 7.4 使用 API Key

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

## 8. JSON-RPC 协议约定

### 8.1 Request

```json
{
  "jsonrpc": "2.0",
  "method": "common:getNodes",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
  },
  "id": 1
}
```

| 字段      | 类型                       | 必填 | 说明                                 |
| --------- | -------------------------- | ---- | ------------------------------------ |
| `jsonrpc` | `string`                   | 是   | 固定为 `"2.0"`                       |
| `method`  | `string`                   | 是   | 完整方法名，例如 `admin:listClients` |
| `params`  | `object \| array`          | 否   | 命名参数或位置参数                   |
| `id`      | `string \| number \| null` | 否   | 请求标识，原样返回                   |

本文默认使用命名参数对象。位置参数也可使用：

```json
{
  "jsonrpc": "2.0",
  "method": "admin:getClient",
  "params": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"],
  "id": 2
}
```

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

### 8.4 Batch Request

POST 请求体可以是数组：

```bash
curl -s "$BASE/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "jsonrpc": "2.0",
      "method": "rpc.ping",
      "id": 1
    },
    {
      "jsonrpc": "2.0",
      "method": "rpc.version",
      "id": 2
    }
  ]'
```

响应也是数组，顺序与请求一致。

### 8.5 WebSocket

`GET /api/rpc2` 升级为 WebSocket。每条消息为单个 JSON-RPC 请求，服务端逐条返回响应。

```js
const ws = new WebSocket(`${location.origin.replace(/^http/, "ws")}/api/rpc2`);

ws.onopen = () => {
  ws.send(
    JSON.stringify({
      jsonrpc: "2.0",
      method: "rpc.ping",
      id: 1,
    }),
  );
};

ws.onmessage = (event) => {
  console.log(JSON.parse(event.data));
};
```

### 8.6 方法发现

```json
{
  "jsonrpc": "2.0",
  "method": "rpc.methods",
  "params": {
    "internal": true
  },
  "id": 1
}
```

## 9. JSON-RPC 鉴权与权限

### 9.1 身份来源

HTTP RPC 使用与 REST 相同的身份识别顺序：

```text
API Key > session_token Cookie > Client Token > 匿名访问
```

Client Token 支持：

```text
?token=<client-token>
?Authorization=<client-token>
Authorization: Bearer <client-token>
body.params.token
```

### 9.2 角色

| 角色     | 等级 | 说明       |
| -------- | ---- | ---------- |
| `guest`  | `0`  | 匿名访客   |
| `client` | `1`  | Agent 节点 |
| `admin`  | `2`  | 管理员     |

默认命名空间权限：

| Pattern    | 最低角色 |
| ---------- | -------- |
| `common:*` | `guest`  |
| `guest:*`  | `guest`  |
| `rpc.*`    | `guest`  |
| `rpc:*`    | `guest`  |
| `public:*` | `guest`  |
| `client:*` | `client` |
| `admin:*`  | `admin`  |
| `*`        | `admin`  |

### 9.3 私有站点限制

启用私有站点后，匿名访客仅能调用：

```text
public:getMe
public:getPublicSettings
public:getVersion
public:recordVisitorEvent
```

持有有效 `temp_key` 的匿名访客可继续调用 `public:*` 方法。

### 9.4 敏感操作

当前敏感方法：

```text
admin:exec
```

管理员调用时还需要有效 2FA code。API Key 调用和未启用 2FA 的管理员账号不需要额外 code。

2FA code 查找顺序：

1. `params.2fa_code`
2. `params.two_factor_code`
3. `params.otp`
4. `X-2FA-Code`
5. `X-Two-Factor-Code`
6. Query 参数 `2fa_code`、`two_factor_code` 或 `otp`

```json
{
  "jsonrpc": "2.0",
  "method": "admin:exec",
  "params": {
    "command": "uptime",
    "clients": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"],
    "2fa_code": "123456"
  },
  "id": 1
}
```

## 10. JSON-RPC 错误码

### 10.1 JSON-RPC 标准错误

| Code     | 名称             | 说明                  |
| -------- | ---------------- | --------------------- |
| `-32700` | `ParseError`     | JSON 解析失败         |
| `-32600` | `InvalidRequest` | JSON-RPC 请求结构无效 |
| `-32601` | `MethodNotFound` | 方法不存在            |
| `-32602` | `InvalidParams`  | 参数缺失或格式错误    |
| `-32603` | `InternalError`  | 服务端内部错误        |

### 10.2 Komari 错误

| Code     | 名称               | 说明               |
| -------- | ------------------ | ------------------ |
| `-32010` | `Cancelled`        | 操作已取消         |
| `-32011` | `DeadlineExceeded` | 操作超时           |
| `-32021` | `Aborted`          | 并发冲突或事务中断 |
| `-32022` | `OutOfRange`       | 数值或索引越界     |
| `-32040` | `Unauthenticated`  | 未认证             |
| `-32041` | `PermissionDenied` | 权限不足           |
| `-32044` | `NotFound`         | 资源不存在         |
| `-32045` | `AlreadyExists`    | 资源已存在         |
| `-32050` | `Unimplemented`    | 尚未实现           |
| `-32051` | `Unavailable`      | 依赖服务不可用     |
| `-32052` | `DataLoss`         | 不可恢复的数据丢失 |

### 10.3 HTTP 状态映射

JSON-RPC 直连始终返回 HTTP `200`；REST 桥接接口按错误码映射：

| JSON-RPC Code                                   | HTTP  |
| ----------------------------------------------- | ----- |
| `InvalidParams`、`InvalidRequest`、`ParseError` | `400` |
| `PermissionDenied`、`Unauthenticated`           | `401` |
| `NotFound`                                      | `404` |
| `AlreadyExists`                                 | `409` |
| `DeadlineExceeded`                              | `504` |
| `Unavailable`                                   | `503` |
| `Unimplemented`                                 | `501` |
| `Cancelled`                                     | `408` |
| 其他                                            | `500` |

## 11. Internal RPC

内部方法使用 `rpc.` 前缀，guest 可访问。

### 11.1 `rpc.ping`

健康检查，返回 `"pong"`。

```json
{
  "jsonrpc": "2.0",
  "method": "rpc.ping",
  "id": 1
}
```

### 11.2 `rpc.version`

返回 JSON-RPC 协议版本 `"2.0"`。

```json
{
  "jsonrpc": "2.0",
  "method": "rpc.version",
  "id": 1
}
```

### 11.3 `rpc.methods`

**参数：**

| 字段       | 类型      | 默认    | 说明                      |
| ---------- | --------- | ------- | ------------------------- |
| `internal` | `boolean` | `false` | 是否包含 `rpc.*` 内部方法 |

```json
{
  "jsonrpc": "2.0",
  "method": "rpc.methods",
  "params": {
    "internal": true
  },
  "id": 1
}
```

### 11.4 `rpc.help`

**参数：**

| 字段     | 类型     | 说明                                 |
| -------- | -------- | ------------------------------------ |
| `method` | `string` | 指定方法名；省略时返回全部方法元数据 |

```json
{
  "jsonrpc": "2.0",
  "method": "rpc.help",
  "params": {
    "method": "admin:addClient"
  },
  "id": 1
}
```

## 12. Common RPC

### 12.1 `common:getNodes`

**参数：**

| 字段   | 类型     | 必填 | 说明                                  |
| ------ | -------- | ---- | ------------------------------------- |
| `uuid` | `string` | 否   | 指定节点 UUID；省略时返回全部可见节点 |

指定节点：

```json
{
  "jsonrpc": "2.0",
  "method": "common:getNodes",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
  },
  "id": 1
}
```

**返回：** 单个 `Client` 或 `{ [uuid]: Client }`。非管理员看不到 Hidden 节点，敏感字段会被清空。

### 12.2 `common:getNodesLatestStatus`

**参数：**

| 字段    | 类型       | 必填 | 说明                       |
| ------- | ---------- | ---- | -------------------------- |
| `uuid`  | `string`   | 否   | 单个节点 UUID              |
| `uuids` | `string[]` | 否   | 多个节点 UUID；`uuid` 优先 |

```json
{
  "jsonrpc": "2.0",
  "method": "common:getNodesLatestStatus",
  "params": {
    "uuids": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"]
  },
  "id": 1
}
```

**返回：** 单个状态对象或 `{ [uuid]: Status }`。状态包含 CPU、内存、磁盘、网络、在线状态及 Ping 统计。

### 12.3 `common:getMe`

返回当前身份的详细状态。

```json
{
  "jsonrpc": "2.0",
  "method": "common:getMe",
  "id": 1
}
```

### 12.4 `common:getPublicInfo`

返回公开站点信息。

```json
{
  "jsonrpc": "2.0",
  "method": "common:getPublicInfo",
  "id": 1
}
```

### 12.5 `common:getVersion`

返回服务端版本与构建 Hash。

```json
{
  "jsonrpc": "2.0",
  "method": "common:getVersion",
  "id": 1
}
```

### 12.6 `common:getNodeRecentStatus`

**参数：**

| 字段   | 类型     | 必填 | 说明        |
| ------ | -------- | ---- | ----------- |
| `uuid` | `string` | 是   | Client UUID |

```json
{
  "jsonrpc": "2.0",
  "method": "common:getNodeRecentStatus",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
  },
  "id": 1
}
```

**返回：** `{ count, records }`，数据来自内存中的最近上报。

### 12.7 `common:getRecords`

**参数：**

| 字段        | 类型      | 默认     | 说明                                                                                            |
| ----------- | --------- | -------- | ----------------------------------------------------------------------------------------------- |
| `type`      | `string`  | `load`   | `load` 或 `ping`                                                                                |
| `uuid`      | `string`  | 全部     | Client UUID                                                                                     |
| `hours`     | `integer` | `1`      | 回溯小时数；未提供 `start`、`end` 时使用                                                        |
| `start`     | `string`  | -        | RFC3339 时间，必须带时区                                                                        |
| `end`       | `string`  | 当前时间 | RFC3339 时间，必须带时区                                                                        |
| `load_type` | `string`  | -        | `cpu`、`gpu`、`ram`、`swap`、`load`、`temp`、`disk`、`network`、`process`、`connections`、`all` |
| `task_id`   | `integer` | `-1`     | Ping Task ID                                                                                    |
| `maxCount`  | `integer` | `4000`   | 最大返回点数；`-1` 表示不限制                                                                   |

负载记录：

```json
{
  "jsonrpc": "2.0",
  "method": "common:getRecords",
  "params": {
    "type": "load",
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "load_type": "cpu",
    "hours": 6,
    "maxCount": 1000
  },
  "id": 1
}
```

Ping 记录：

```json
{
  "jsonrpc": "2.0",
  "method": "common:getRecords",
  "params": {
    "type": "ping",
    "task_id": 1,
    "start": "2026-09-16T00:00:00+08:00",
    "end": "2026-09-16T12:00:00+08:00"
  },
  "id": 2
}
```

## 13. Public RPC

Public 方法对 guest 开放，返回内容会自动过滤 Hidden 节点和敏感字段。

### 13.1 `public:getMe`

未登录返回 Guest 占位；已登录返回用户名、UUID、SSO 和 2FA 状态。

```json
{
  "jsonrpc": "2.0",
  "method": "public:getMe",
  "id": 1
}
```

### 13.2 `public:getNodesInformation`

返回可见节点基础信息。

```json
{
  "jsonrpc": "2.0",
  "method": "public:getNodesInformation",
  "id": 1
}
```

### 13.3 `public:getPublicSettings`

返回公开站点设置。

```json
{
  "jsonrpc": "2.0",
  "method": "public:getPublicSettings",
  "id": 1
}
```

### 13.4 `public:getVersion`

返回公开版本信息。

```json
{
  "jsonrpc": "2.0",
  "method": "public:getVersion",
  "id": 1
}
```

### 13.5 `public:getClientRecentRecords`

**参数：**

| 字段   | 类型     | 必填 | 说明        |
| ------ | -------- | ---- | ----------- |
| `uuid` | `string` | 是   | Client UUID |

```json
{
  "jsonrpc": "2.0",
  "method": "public:getClientRecentRecords",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
  },
  "id": 1
}
```

### 13.6 `public:getRecordsByUUID`

**参数：**

| 字段        | 类型               | 必填 | 默认 | 说明         |
| ----------- | ------------------ | ---- | ---- | ------------ |
| `uuid`      | `string`           | 是   | -    | Client UUID  |
| `load_type` | `string`           | 否   | 全部 | 记录字段投影 |
| `hours`     | `string \| number` | 否   | `4`  | 回溯小时数   |

```json
{
  "jsonrpc": "2.0",
  "method": "public:getRecordsByUUID",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "load_type": "ram",
    "hours": 4
  },
  "id": 1
}
```

**返回：** `{ records, count, load_type? }`，可能附加 `gpu_devices` 与 `has_gpu_data`。

### 13.7 `public:getPingRecords`

**参数：**

| 字段      | 类型               | 必填     | 默认 | 说明         |
| --------- | ------------------ | -------- | ---- | ------------ |
| `uuid`    | `string`           | 条件必填 | -    | Client UUID  |
| `task_id` | `string \| number` | 条件必填 | -    | Ping Task ID |
| `hours`   | `string \| number` | 否       | `4`  | 回溯小时数   |

`uuid` 与 `task_id` 至少提供一个。

```json
{
  "jsonrpc": "2.0",
  "method": "public:getPingRecords",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "hours": 4
  },
  "id": 1
}
```

**返回：** `{ count, basic_info?, records, tasks? }`。

### 13.8 `public:getPublicPingTasks`

```json
{
  "jsonrpc": "2.0",
  "method": "public:getPublicPingTasks",
  "id": 1
}
```

**返回：** `{ id, weight, name, clients, default_on, type, interval }[]`。

### 13.9 `public:recordVisitorEvent`

**参数：**

| 字段        | 类型     | 必填 | 说明                     |
| ----------- | -------- | ---- | ------------------------ |
| `event`     | `string` | 是   | 事件名，例如 `page_view` |
| `action`    | `string` | 否   | `event` 的别名           |
| `operation` | `string` | 否   | `event` 的别名           |
| `path`      | `string` | 否   | 前端路径                 |
| `route`     | `string` | 否   | 路由名                   |
| `target`    | `string` | 否   | 目标标识                 |
| `detail`    | `object` | 否   | 有长度限制的元数据       |

```json
{
  "jsonrpc": "2.0",
  "method": "public:recordVisitorEvent",
  "params": {
    "event": "node_open",
    "path": "/",
    "target": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "detail": {
      "source": "node-card"
    }
  },
  "id": 1
}
```

限流为每 IP 每分钟 30 次，突发 10 次。

### 13.10 `public:listMetricDefinitions`

返回所有指标定义和保留策略。

```json
{
  "jsonrpc": "2.0",
  "method": "public:listMetricDefinitions",
  "id": 1
}
```

### 13.11 `public:queryMetrics`

**参数：**

| 字段                        | 类型       | 默认          | 说明                                                   |
| --------------------------- | ---------- | ------------- | ------------------------------------------------------ |
| `metric_key`                | `string`   | -             | 单个指标名                                             |
| `metric_keys`               | `string[]` | -             | 多个指标名                                             |
| `metrics`                   | `string[]` | -             | `metric_keys` 的别名                                   |
| `entity_id`                 | `string`   | 全部可见节点  | 单个实体 UUID                                          |
| `entity_ids`                | `string[]` | 全部可见节点  | 多个实体 UUID                                          |
| `start` / `start_time`      | `string`   | `end - hours` | RFC3339 时间                                           |
| `end` / `end_time`          | `string`   | 当前时间      | RFC3339 时间                                           |
| `hours`                     | `number`   | `4`           | 回溯小时数                                             |
| `tags`                      | `object`   | -             | 标签过滤                                               |
| `fill_empty`                | `boolean`  | `false`       | 是否插入空点                                           |
| `max_points`                | `integer`  | `500`         | 每个 series 最大点数                                   |
| `points_by_metric`          | `object`   | -             | 按指标覆盖点数                                         |
| `max_points_by_metric`      | `object`   | -             | 按指标覆盖点数                                         |
| `aggregation` / `algorithm` | `string`   | `avg`         | `avg`、`min`、`max`、`last`、`p50`、`p99`、`stddev` 等 |
| `aggregation_by_metric`     | `object`   | -             | 按指标覆盖聚合                                         |
| `algorithm_by_metric`       | `object`   | -             | 按指标覆盖聚合                                         |

```json
{
  "jsonrpc": "2.0",
  "method": "public:queryMetrics",
  "params": {
    "metric_keys": ["cpu", "ram"],
    "entity_ids": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"],
    "hours": 12,
    "max_points": 300,
    "aggregation": "avg",
    "fill_empty": true
  },
  "id": 1
}
```

**返回：**

```json
{
  "start": "2026-09-15T20:30:00Z",
  "end": "2026-09-16T08:30:00Z",
  "server_downsample_default": true,
  "default_points": 500,
  "series": [],
  "count": 0
}
```

### 13.12 `public:getPingMetricStats`

**参数：**

| 字段                   | 类型               | 默认          | 说明           |
| ---------------------- | ------------------ | ------------- | -------------- |
| `uuid` / `entity_id`   | `string`           | 全部可见节点  | 单个节点       |
| `entity_ids`           | `string[]`         | 全部可见节点  | 多个节点       |
| `task_id`              | `string \| number` | 全部任务      | 单个 Ping Task |
| `task_ids`             | `array`            | 全部任务      | 多个 Ping Task |
| `start` / `start_time` | `string`           | `end - hours` | RFC3339 时间   |
| `end` / `end_time`     | `string`           | 当前时间      | RFC3339 时间   |
| `hours`                | `number`           | `4`           | 回溯小时数     |
| `max_points`           | `integer`          | `500`         | 最大聚合点数   |

```json
{
  "jsonrpc": "2.0",
  "method": "public:getPingMetricStats",
  "params": {
    "entity_id": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "task_id": 1,
    "hours": 24
  },
  "id": 1
}
```

**返回：** `{ start, end, interval_seconds, stats, count }`。

## 14. Admin RPC

Admin 方法仅管理员可调用。下列示例均可通过 `/api/rpc2`、session Cookie 或 API Key 调用。

### 14.1 节点管理

#### `admin:addClient`

**参数：**

| 字段   | 类型     | 必填 | 说明     |
| ------ | -------- | ---- | -------- |
| `name` | `string` | 否   | 节点名称 |

```json
{
  "jsonrpc": "2.0",
  "method": "admin:addClient",
  "params": {
    "name": "Tokyo-01"
  },
  "id": 1
}
```

**返回：** `{ uuid, token }`。

#### `admin:editClient`

**参数：** `uuid` 加任意可更新节点字段。

```json
{
  "jsonrpc": "2.0",
  "method": "admin:editClient",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "name": "Tokyo-01",
    "hidden": false,
    "weight": 10
  },
  "id": 1
}
```

#### `admin:removeClient`

```json
{
  "jsonrpc": "2.0",
  "method": "admin:removeClient",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
  },
  "id": 1
}
```

#### `admin:getClient`

```json
{
  "jsonrpc": "2.0",
  "method": "admin:getClient",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
  },
  "id": 1
}
```

#### `admin:listClients`

```json
{
  "jsonrpc": "2.0",
  "method": "admin:listClients",
  "id": 1
}
```

#### `admin:getClientToken`

```json
{
  "jsonrpc": "2.0",
  "method": "admin:getClientToken",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
  },
  "id": 1
}
```

**返回：** `{ token }`。

#### `admin:clearRecords`

清除全部负载记录。

```json
{
  "jsonrpc": "2.0",
  "method": "admin:clearRecords",
  "id": 1
}
```

#### `admin:clearAllRecords`

清除负载记录与 Ping 记录。

```json
{
  "jsonrpc": "2.0",
  "method": "admin:clearAllRecords",
  "id": 1
}
```

#### `admin:orderClients`

```json
{
  "jsonrpc": "2.0",
  "method": "admin:orderClients",
  "params": {
    "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d": 10,
    "f9c41c25-8b87-44bc-99c7-536d36a2cc3a": 20
  },
  "id": 1
}
```

### 14.2 会话与设置

| 方法                       | 参数              | 返回                                         |
| -------------------------- | ----------------- | -------------------------------------------- |
| `admin:getSessions`        | -                 | `{ current, data: Session[] }`               |
| `admin:deleteSession`      | `{ session }`     | `null`                                       |
| `admin:deleteAllSessions`  | -                 | `null`                                       |
| `admin:getSettings`        | -                 | 设置对象                                     |
| `admin:editSettings`       | 部分设置键值      | `null` 或 `{ restart_required, guide_path }` |
| `admin:getXtermjsSettings` | -                 | `XtermJSSettings`                            |
| `admin:setXtermjsSettings` | `XtermJSSettings` | 归一化后的设置                               |

删除会话：

```json
{
  "jsonrpc": "2.0",
  "method": "admin:deleteSession",
  "params": {
    "session": "<session-token>"
  },
  "id": 1
}
```

更新设置：

```json
{
  "jsonrpc": "2.0",
  "method": "admin:editSettings",
  "params": {
    "sitename": "Komari Monitor",
    "private_site": true
  },
  "id": 2
}
```

更新 xterm.js：

```json
{
  "jsonrpc": "2.0",
  "method": "admin:setXtermjsSettings",
  "params": {
    "terminalOptions": {
      "cursorBlink": true,
      "convertEol": true,
      "fontFamily": "monospace",
      "fontSize": 16,
      "scrollback": 5000
    },
    "terminalPadding": 16,
    "transparentBackground": false,
    "customCss": ""
  },
  "id": 3
}
```

### 14.3 远程任务

| 方法                           | 参数                              | 返回                                   |
| ------------------------------ | --------------------------------- | -------------------------------------- |
| `admin:getTasks`               | -                                 | 任务及结果列表                         |
| `admin:getTaskById`            | `{ task_id }`                     | 单条任务                               |
| `admin:getTasksByClientId`     | `{ uuid }`                        | 节点任务列表                           |
| `admin:getTaskResultsByTaskId` | `{ task_id }`                     | 结果列表                               |
| `admin:getSpecificTaskResult`  | `{ task_id, uuid }`               | 单条结果                               |
| `admin:exec`                   | `{ command, clients, 2fa_code? }` | `{ task_id, clients, queued_clients }` |

执行命令：

```json
{
  "jsonrpc": "2.0",
  "method": "admin:exec",
  "params": {
    "command": "uptime",
    "clients": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"],
    "2fa_code": "123456"
  },
  "id": 1
}
```

查询结果：

```json
{
  "jsonrpc": "2.0",
  "method": "admin:getTaskResultsByTaskId",
  "params": {
    "task_id": "7cS2QmW8xKp4nA1v"
  },
  "id": 2
}
```

### 14.4 Ping 任务

| 方法                    | 参数                                                      | 返回          |
| ----------------------- | --------------------------------------------------------- | ------------- |
| `admin:addPingTask`     | `{ name, target, type, interval, clients?, default_on? }` | `{ task_id }` |
| `admin:deletePingTask`  | `{ id: number[] }`                                        | `null`        |
| `admin:editPingTask`    | `{ tasks: PingTask[] }`                                   | `null`        |
| `admin:getAllPingTasks` | -                                                         | `PingTask[]`  |
| `admin:orderPingTask`   | `{ [id]: weight }`                                        | `null`        |

```json
{
  "jsonrpc": "2.0",
  "method": "admin:addPingTask",
  "params": {
    "name": "Cloudflare",
    "target": "1.1.1.1",
    "type": "icmp",
    "interval": 60,
    "clients": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"],
    "default_on": false
  },
  "id": 1
}
```

### 14.5 通知

| 方法                               | 参数                                                     | 返回                    |
| ---------------------------------- | -------------------------------------------------------- | ----------------------- |
| `admin:addLoadNotification`        | `{ clients, metric, threshold, ratio, interval, name? }` | `{ task_id }`           |
| `admin:deleteLoadNotification`     | `{ id: number[] }`                                       | `null`                  |
| `admin:editLoadNotification`       | `{ notifications: LoadNotification[] }`                  | `null`                  |
| `admin:getAllLoadNotifications`    | -                                                        | `LoadNotification[]`    |
| `admin:listOfflineNotifications`   | -                                                        | `OfflineNotification[]` |
| `admin:editOfflineNotification`    | `OfflineNotification[]`                                  | `null`                  |
| `admin:enableOfflineNotification`  | `string[]`                                               | `null`                  |
| `admin:disableOfflineNotification` | `string[]`                                               | `null`                  |
| `admin:sendNotification`           | `{ event: EventMessage }`                                | `null`                  |

新增负载通知：

```json
{
  "jsonrpc": "2.0",
  "method": "admin:addLoadNotification",
  "params": {
    "name": "CPU high",
    "clients": ["d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"],
    "metric": "cpu",
    "threshold": 90,
    "ratio": 0.8,
    "interval": 15
  },
  "id": 1
}
```

发送通知：

```json
{
  "jsonrpc": "2.0",
  "method": "admin:sendNotification",
  "params": {
    "event": {
      "event": "Custom",
      "clients": [],
      "time": "2026-09-16T08:30:00Z",
      "message": "Custom notification",
      "emoji": ""
    }
  },
  "id": 2
}
```

### 14.6 剪贴板

| 方法                         | 参数                               | 返回          |
| ---------------------------- | ---------------------------------- | ------------- |
| `admin:getClipboard`         | `{ id }`                           | `Clipboard`   |
| `admin:listClipboard`        | -                                  | `Clipboard[]` |
| `admin:createClipboard`      | `{ text, name, weight?, remark? }` | `Clipboard`   |
| `admin:updateClipboard`      | `{ id, ...字段 }`                  | `null`        |
| `admin:deleteClipboard`      | `{ id }`                           | `null`        |
| `admin:batchDeleteClipboard` | `{ ids: number[] }`                | `null`        |

```json
{
  "jsonrpc": "2.0",
  "method": "admin:createClipboard",
  "params": {
    "name": "Common commands",
    "text": "systemctl status komari",
    "weight": 0,
    "remark": ""
  },
  "id": 1
}
```

### 14.7 Provider

| 方法                             | 参数                 | 返回                    |
| -------------------------------- | -------------------- | ----------------------- |
| `admin:getMessageSenderProvider` | `{ provider? }`      | Provider 配置或模板列表 |
| `admin:setMessageSenderProvider` | `{ name, addition }` | `{ message }`           |
| `admin:getOidcProvider`          | `{ provider? }`      | Provider 配置或模板列表 |
| `admin:setOidcProvider`          | `{ name, addition }` | `{ message }`           |

```json
{
  "jsonrpc": "2.0",
  "method": "admin:setMessageSenderProvider",
  "params": {
    "name": "telegram",
    "addition": "{\"bot_token\":\"...\",\"chat_id\":\"...\"}"
  },
  "id": 1
}
```

### 14.8 数据库

| 方法                    | 参数                                | 返回             |
| ----------------------- | ----------------------------------- | ---------------- |
| `admin:getDatabaseSize` | -                                   | 主库与监控库容量 |
| `admin:vacuumDatabase`  | -                                   | 回收空间结果     |
| `admin:dbQuery`         | `{ database?, sql, args?, limit? }` | 查询结果         |
| `admin:dbExec`          | `{ database?, sql, args? }`         | 执行结果         |
| `admin:dbTables`        | `{ database? }`                     | 表名列表         |

`database` 可选 `main` 或 `metrics`，默认 `main`。

查询：

```json
{
  "jsonrpc": "2.0",
  "method": "admin:dbQuery",
  "params": {
    "database": "main",
    "sql": "SELECT uuid, name FROM clients WHERE hidden = ? LIMIT ?",
    "args": [false, 10],
    "limit": 100
  },
  "id": 1
}
```

**返回：**

```json
{
  "database": "main",
  "driver": "sqlite",
  "columns": ["uuid", "name"],
  "rows": [],
  "row_count": 0,
  "truncated": false
}
```

### 14.9 系统与诊断

| 方法                    | 参数                           | 返回              |
| ----------------------- | ------------------------------ | ----------------- |
| `admin:getLogs`         | `{ limit?, page?, msg_type? }` | `{ logs, total }` |
| `admin:testSendMessage` | -                              | `null`            |
| `admin:testGeoip`       | `{ ip? }`                      | GeoIP 记录        |

```json
{
  "jsonrpc": "2.0",
  "method": "admin:getLogs",
  "params": {
    "limit": "20",
    "page": "1",
    "msg_type": "login"
  },
  "id": 1
}
```

### 14.10 插件

| 方法                           | 参数                            | 返回                                    |
| ------------------------------ | ------------------------------- | --------------------------------------- |
| `admin:listPlugins`            | -                               | `Plugin[]`                              |
| `admin:setPluginEnabled`       | `{ short, enabled, approved? }` | `null` 或 `{ requires_approval: true }` |
| `admin:getPluginLogs`          | `{ short }`                     | `{ logs }`                              |
| `admin:deletePlugin`           | `{ short }`                     | `null`                                  |
| `admin:getPluginConfiguration` | `{ short }`                     | `{ configuration, data }`               |
| `admin:setPluginConfiguration` | `{ short, data }`               | `null`                                  |

```json
{
  "jsonrpc": "2.0",
  "method": "admin:setPluginEnabled",
  "params": {
    "short": "status-extension",
    "enabled": true,
    "approved": true
  },
  "id": 1
}
```

### 14.11 Metrics 定义与迁移

| 方法                             | 参数                              | 返回                  |
| -------------------------------- | --------------------------------- | --------------------- |
| `admin:listMetricDefinitions`    | -                                 | 指标定义列表          |
| `admin:updateMetricDefinition`   | `{ name, retention_days }`        | 更新后的定义          |
| `admin:getMetricMigrationStatus` | -                                 | 迁移状态              |
| `admin:startMetricMigration`     | `{ source_driver?, source_dsn? }` | `{ status, message }` |
| `admin:cancelMetricMigration`    | -                                 | `{ status, message }` |

```json
{
  "jsonrpc": "2.0",
  "method": "admin:updateMetricDefinition",
  "params": {
    "name": "cpu",
    "retention_days": 30
  },
  "id": 1
}
```

`retention_days: 0` 会异步删除该指标历史数据。

### 14.12 节点文件操作

节点文件功能采用控制面与数据面分离：

- 目录、属性和修改操作通过本节 RPC 提供。
- 文件内容上传与下载通过 HTTP 流接口提供，见 [HTTP 节点文件管理](#_5-16-节点文件管理)。
- 所有 RPC 都要求管理员身份，并要求目标 Agent 在线且支持文件操作。

#### 14.12.1 操作一览

| 方法                  | 参数                                         | 返回               | 说明                    |
| --------------------- | -------------------------------------------- | ------------------ | ----------------------- |
| `admin:fileListRoots` | `{ uuid }`                                   | 文件系统根目录列表 | 获取 Agent 暴露的根目录 |
| `admin:fileList`      | `{ uuid, path }`                             | 目录内容           | 列出指定目录            |
| `admin:fileStat`      | `{ uuid, path }`                             | 文件元数据         | 读取文件或目录属性      |
| `admin:fileMkdir`     | `{ uuid, path, mode? }`                      | Agent 操作结果     | 创建目录                |
| `admin:fileDelete`    | `{ uuid, path }`                             | Agent 操作结果     | 删除文件或目录          |
| `admin:fileMove`      | `{ uuid, source, destination }`              | Agent 操作结果     | 移动或重命名            |
| `admin:fileCopy`      | `{ uuid, source, destination }`              | Agent 操作结果     | 复制文件                |
| `admin:fileChmod`     | `{ uuid, path, mode }`                       | Agent 操作结果     | 修改权限                |
| `admin:fileChown`     | `{ uuid, path, uid?, gid?, owner?, group? }` | Agent 操作结果     | 修改属主或属组          |
| `admin:fileSearch`    | `{ uuid, path, query, content? }`            | 搜索结果           | 搜索路径或文件内容      |

参数约束：

| 方法                  | 约束                                                                  |
| --------------------- | --------------------------------------------------------------------- |
| `admin:fileListRoots` | `uuid` 必填                                                           |
| `admin:fileList`      | `uuid`、非空 `path` 必填                                              |
| `admin:fileStat`      | `uuid`、非空 `path` 必填                                              |
| `admin:fileMkdir`     | `uuid`、非空 `path` 必填；`mode` 可选                                 |
| `admin:fileDelete`    | `uuid`、非空 `path` 必填                                              |
| `admin:fileMove`      | `uuid`、非空 `source`、非空 `destination` 必填                        |
| `admin:fileCopy`      | `uuid`、非空 `source`、非空 `destination` 必填                        |
| `admin:fileChmod`     | `uuid`、非空 `path`、非空 `mode` 必填                                 |
| `admin:fileChown`     | `uuid`、非空 `path` 必填；`uid`、`gid`、`owner`、`group` 至少提供一个 |
| `admin:fileSearch`    | `uuid`、非空 `path`、非空 `query` 必填；`content` 可选                |

#### 14.12.2 列出根目录

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileListRoots",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d"
  },
  "id": 1
}
```

不同 Agent 平台返回的根目录结构可能不同。Windows Agent 通常返回盘符，Unix Agent 通常返回根目录或可用挂载点。

#### 14.12.3 列出目录

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

返回内容由 Agent 定义，通常包含目录项的名称、路径、目录标记、大小、权限和修改时间。

#### 14.12.4 读取属性

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileStat",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "path": "/var/log/syslog"
  },
  "id": 1
}
```

下载接口在读取内容前也通过同类元数据操作确认目标是文件、大小和修改时间。

#### 14.12.5 创建目录

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileMkdir",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "path": "/tmp/releases",
    "mode": "0755"
  },
  "id": 1
}
```

`mode` 是否生效取决于 Agent 平台和文件系统。省略时由 Agent 使用默认权限。

#### 14.12.6 删除路径

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileDelete",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "path": "/tmp/releases/old-package.tar.gz"
  },
  "id": 1
}
```

删除目录时是否递归、目录是否必须为空等行为由 Agent 的文件操作实现决定。

#### 14.12.7 移动或重命名

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileMove",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "source": "/tmp/package.tar.gz",
    "destination": "/tmp/releases/package.tar.gz"
  },
  "id": 1
}
```

目标路径与被移动路径同目录时，可作为重命名使用。

#### 14.12.8 复制文件

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileCopy",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "source": "/tmp/package.tar.gz",
    "destination": "/tmp/package.backup.tar.gz"
  },
  "id": 1
}
```

#### 14.12.9 修改权限

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileChmod",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "path": "/tmp/releases/package.tar.gz",
    "mode": "0644"
  },
  "id": 1
}
```

权限语义由 Agent 平台决定；Windows Agent 可能不支持该操作。

#### 14.12.10 修改属主或属组

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileChown",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "path": "/tmp/releases/package.tar.gz",
    "owner": "www-data",
    "group": "www-data"
  },
  "id": 1
}
```

可以传 `uid`、`gid`、`owner`、`group` 的任意组合，但至少提供一个。Unix Agent 支持该操作；Windows Agent 可能返回 `Unimplemented`。

#### 14.12.11 搜索路径或文件内容

```json
{
  "jsonrpc": "2.0",
  "method": "admin:fileSearch",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "path": "/var/log",
    "query": "error",
    "content": true
  },
  "id": 1
}
```

- `content: false` 或省略时搜索路径名。
- `content: true` 时同时搜索文件内容，由 Agent 决定匹配方式和结果上限。
- 搜索超时为 90 秒，超时返回 `DeadlineExceeded`。

#### 14.12.12 错误

文件方法可能返回：

| Code               | 场景                                   |
| ------------------ | -------------------------------------- |
| `InvalidParams`    | `uuid`、路径、模式、查询条件等参数无效 |
| `NotFound`         | 节点、远端路径或文件传输会话不存在     |
| `PermissionDenied` | Agent 拒绝读取或修改目标路径           |
| `Unimplemented`    | Agent 不支持该文件操作或平台能力       |
| `Unavailable`      | Agent 离线                             |
| `DeadlineExceeded` | Agent 操作超时                         |
| `Cancelled`        | 调用取消                               |

文件内容上传、下载与预览令牌使用 HTTP 接口，见 [HTTP 节点文件管理](#_5-16-节点文件管理)。

## 15. Agent v2 RPC

Agent v2 使用 `POST /api/clients/v2/rpc` 或 `GET /api/clients/v2/rpc` WebSocket。其 JSON-RPC 包络与 `/api/rpc2` 相同，但方法属于 Agent 协议，不是 `admin:*` 或 `public:*` ACL 命名空间。

> 行为基线：`komari-monitor/komari-agent` `1.5.10`，提交 `9e532e0429cd049571e35cf344654181879b33c7`。

### 15.1 传输模式

Agent 优先连接：

```text
GET /api/clients/v2/rpc?token=<client-token>
```

WebSocket 连接方式：

- Agent 每隔 `interval` 秒发送一次无 `id` 的 `agent.report` notification。
- Agent 每 30 秒发送 WebSocket Ping。
- 服务端下发事件时，可以直接通过当前 WebSocket 推送；回复型请求则要求 Agent 单独上报结果。

WebSocket 建立失败并达到最大重试次数后，Agent 进入 POST fallback：

- 使用 `POST /api/clients/v2/rpc?token=<client-token>` 定期发送带 `id` 的 `agent.report`。
- 并行运行 `agent.pull` 长轮询，在 HTTP 下最长等待 25 秒。
- `agent.report` 和 `agent.pull` 都有 `Content-Encoding: gzip`，除非 Agent 使用 `--disable-compression`。
- 网络测试事件在 Agent `1.5.10` 中未实现。

### 15.2 Agent 主动上报

| 方法                | 参数                                                | 成功返回                               |
| ------------------- | --------------------------------------------------- | -------------------------------------- |
| `agent.report`      | `{ report, ack_event_ids? }`                        | `{ status:"success", events:Event[] }` |
| `agent.basicInfo`   | `{ info }`                                          | `{ status:"success" }`                 |
| `agent.pingResult`  | `{ task_id, ping_type, value, finished_at }`        | `{ status:"success" }`                 |
| `agent.taskResult`  | `{ task_id, result, exit_code, finished_at }`       | `{ status:"success" }`                 |
| `agent.pull`        | `{ capabilities?, ack_event_ids?, last_event_id? }` | `{ events:Event[] }`                   |
| `agent.file.result` | `FileResult`                                        | `{ status:"success" }`                 |

WebSocket 下 Agent 的 `agent.report`、`agent.basicInfo`、`agent.pingResult` 和 `agent.taskResult` 通常是无 `id` 的 notification；HTTP POST 模式下则可能带 `id` 并等待 JSON-RPC 响应。

即使主连接已经使用 WebSocket，`agent.basicInfo` 和 `agent.taskResult` 也固定通过 `POST /api/clients/v2/rpc` 发送；`agent.pingResult` 在 WebSocket 可用时通过当前连接发送，否则回退到 POST。

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

Agent 的实际 `report` 字段：

| 字段                              | 类型     | 说明                                |
| --------------------------------- | -------- | ----------------------------------- |
| `cpu.usage`                       | `number` | CPU 使用率百分比                    |
| `ram.total` / `ram.used`          | `number` | 内存总容量与已用量，单位字节        |
| `swap.total` / `swap.used`        | `number` | Swap 总容量与已用量，单位字节       |
| `load.load1` / `load5` / `load15` | `number` | 1、5、15 分钟负载                   |
| `disk.total` / `disk.used`        | `number` | 磁盘总容量与已用量，单位字节        |
| `network.up` / `down`             | `number` | 当前上传、下载速率，单位字节/秒     |
| `network.totalUp` / `totalDown`   | `number` | 累计上传、下载流量                  |
| `connections.tcp` / `udp`         | `number` | TCP、UDP 连接数                     |
| `gpu`                             | `object` | 可选；未启用详细 GPU 监控时通常省略 |
| `uptime`                          | `number` | 系统运行时间，单位秒                |
| `process`                         | `number` | 进程数量                            |
| `message`                         | `string` | Agent 采集过程中的警告信息          |

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

`value` 是毫秒整数；`-1` 表示丢包或测量失败。

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

Agent 执行命令后上报。即使主连接是 WebSocket，`agent.taskResult` 仍通过 `POST /api/clients/v2/rpc` 发送。

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

结果字符串会合并 stdout 与 stderr，并将 CRLF 转为 LF。远程控制关闭时返回：

```json
{
  "task_id": "7cS2QmW8xKp4nA1v",
  "result": "Remote control is disabled.",
  "exit_code": -1,
  "finished_at": "2026-09-16T08:30:00.123456789Z"
}
```

空命令返回 `No command provided`，退出码为 `0`。

#### `agent.pull`

HTTP fallback 下由 Agent 发起：

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

响应：

```json
{
  "jsonrpc": "2.0",
  "result": {
    "events": []
  },
  "id": "pull-1789547400123456789"
}
```

`events` 中每个事件的真实结构：

| 字段         | 类型     | 说明                          |
| ------------ | -------- | ----------------------------- |
| `id`         | `string` | 事件 ID，用于 `ack_event_ids` |
| `method`     | `string` | 事件方法名                    |
| `params`     | `any`    | 方法参数                      |
| `created_at` | `string` | 创建时间                      |
| `expires_at` | `string` | 过期时间                      |

### 15.3 服务端下发事件

Server 下发的普通通知通常不带 `id`；需要结果的事件由 Agent 另外发起 RPC 上报。

| 方法                     | 参数                                       | Agent 行为                                          | 结果上报              |
| ------------------------ | ------------------------------------------ | --------------------------------------------------- | --------------------- |
| `agent.exec`             | `{ task_id, command }`                     | Unix 使用 `sh -s`；Windows 使用临时 PowerShell 脚本 | `agent.taskResult`    |
| `agent.ping`             | `{ ping_task_id, ping_type, ping_target }` | 执行 `icmp`、`tcp` 或 `http` 探测                   | `agent.pingResult`    |
| `agent.terminal.request` | `{ request_id }`                           | 连接 `/api/clients/terminal?...&id=<request_id>`    | 通过终端 WebSocket 流 |
| `agent.file`             | `{ uuid, request_id, op, args? }`          | 执行文件控制操作                                    | `agent.file.result`   |
| `agent.message`          | `{ type, message, data? }`                 | 记录日志，不产生 RPC 回包                           | 无                    |
| `agent.event`            | `{ type, data? }`                          | 记录日志，不产生 RPC 回包                           | 无                    |
| `networkTest.*`          | 见协议定义                                 | Agent `1.5.10` 未实现                               | 无                    |

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

Ping 类型行为：

| `ping_type` | 实现                                                                        |
| ----------- | --------------------------------------------------------------------------- |
| `icmp`      | 解析目标后执行单包 ICMP                                                     |
| `tcp`       | TCP 建连耗时；目标未写端口时默认 `80`                                       |
| `http`      | HTTP GET 耗时；目标无 Scheme 时补 `http://`，状态码 `2xx` 或 `3xx` 视为成功 |

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

### 15.4 Agent 文件控制面

文件元数据与修改操作通过 `agent.file` 下发。Agent 执行后始终通过 `agent.file.result` 回报。

#### `agent.file`

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

支持的 `op`：

| `op`              | `args`                                                                                                              | `result`                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `list_roots`      | `{}`                                                                                                                | `FileInfo[]`                                     |
| `list`            | `{ path }`                                                                                                          | `FileInfo[]`                                     |
| `stat`            | `{ path }`                                                                                                          | `FileInfo`                                       |
| `create`          | `{ path }`                                                                                                          | `{ created:true, size:0 }`                       |
| `mkdir`           | `{ path, mode? }`                                                                                                   | `{ created:true }`                               |
| `delete`          | `{ path }`                                                                                                          | `{ deleted:true }`                               |
| `move`            | `{ source, destination }`                                                                                           | `{ moved:true }`                                 |
| `copy`            | `{ source, destination }`                                                                                           | `{ copied:true }`                                |
| `chmod`           | `{ path, mode }`                                                                                                    | `{ mode:"0644" }`                                |
| `chown`           | `{ path, uid?, gid?, owner?, group? }`                                                                              | `{ uid, gid }`                                   |
| `search`          | `{ path, query, content? }`                                                                                         | `{ matches:SearchMatch[], limited:boolean }`     |
| `download_stream` | `{ transfer_id, transfer_token, path, offset, length, file_size?, modified_at? }`                                   | `{ sent:number }`                                |
| `upload_stream`   | `{ transfer_id, transfer_token, path, upload_id, offset, chunk_index, chunk_count, total_size, chunk_size, first }` | `{ received:number, offset:number }`             |
| `upload_commit`   | `{ path, upload_id, chunk_count, total_size, chunk_size, offset }`                                                  | `{ received:number, final:true, offset:number }` |
| `upload_cancel`   | `{ path?, upload_id }`                                                                                              | `{ cancelled:true }`                             |

Windows 文件路径是虚拟路径：

```text
/C/Users/Administrator
```

这与 Server 对外展示的路径一致；Unix 继续使用原生的 `/var/log` 形式。

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

符号链接会额外返回 `target`。

#### `SearchMatch`

```json
{
  "path": "/var/log/syslog",
  "line": 42,
  "text": "2026-09-16 error: example",
  "is_dir": false
}
```

`search` 最多返回 500 条；达到上限时 `limited` 为 `true`。

#### `agent.file.result`

成功：

```json
{
  "jsonrpc": "2.0",
  "method": "agent.file.result",
  "params": {
    "uuid": "d4c8d9a1-4ec5-4c1b-9b95-4c1c8f930b0d",
    "request_id": "f4f2f0d5-4bb3-4da4-9ec5-2ca778d31b12",
    "ok": true,
    "result": [
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
        "modified_at": "2026-09-16T08:30:00Z"
      }
    ]
  }
}
```

失败：

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

### 15.5 Agent 文件数据面

`download_stream` 与 `upload_stream` 只在 Agent 和 Server 之间转发原始字节，实际地址为：

```text
POST /api/clients/transfer/:id?token=<client-token>&transfer_token=<transfer-token>
```

下载时：

1. Server 建立一次性 transfer，并向 Agent 发送 `agent.file`。
2. Agent 校验 `transfer_id`、`transfer_token`、文件大小和修改时间。
3. Agent 使用请求体把指定 byte range 推送给 `/api/clients/transfer/:id`。
4. Agent 收到 2xx 后回报 `agent.file.result`，`result.sent` 为发送字节数。

上传时：

1. Server 建立 transfer 后发送 `agent.file`。
2. Agent 向 `/api/clients/transfer/:id` 发起 `POST`，请求体为空。
3. Server 把浏览器上传分片作为响应体流式返回。
4. Agent 校验响应长度，将分片写入临时 `.part` 文件。
5. 所有分片完成后，Server 再通过 `upload_commit` 触发原子替换。

文件流操作具备以下限制：

| 项目              | 值      |
| ----------------- | ------- |
| Agent 并发流数量  | 8       |
| 单流超时          | 30 分钟 |
| 默认下载/上传分片 | 25 MiB  |
| 最大分片          | 128 MiB |

### 15.6 Agent 终端帧

Agent 连接终端 WebSocket 后，浏览器与 Agent 之间的数据帧如下。

浏览器发送二进制帧：

```text
直接写入 PTY
```

浏览器发送 JSON 控制帧：

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

Agent 返回终端输出时统一使用 WebSocket 二进制帧，不包装为 JSON。

断线处理：

- Agent 侧保留同一 `request_id` 的 PTY 5 分钟。
- Agent 重连同一 `request_id` 时重附着原 PTY，并关闭旧连接。
- 浏览器侧断开后也会保留同一 `request_id` 5 分钟。
- 浏览器恢复时先重连，Server 重新下发 `agent.terminal.request`，之后 Agent 才重连终端 WebSocket。
- `heartbeat` 只用于保活，不写入终端；`close` 会触发会话关闭和 PTY 清理。

### 15.7 网络测试支持状态

Server 已定义以下网络测试协议：

| 方法                          | Agent `1.5.10` 状态 |
| ----------------------------- | ------------------- |
| `networkTest.nextTrace`       | 未实现              |
| `networkTest.iperf3`          | 未实现              |
| `networkTest.meshTrace`       | 未实现              |
| `networkTest.getMeshTraceJob` | 未实现              |

Agent 的 `server/websocket.go` 目前没有上述事件分支。收到这些方法时会记录 `unknown v2 event method`，并且不会产生 `agent.taskResult`、`agent.file.result` 或其他回复。

因此这些方法只能视为 Server 端预留协议。在 Agent 实现并发布对应版本前，不应将其视为可用功能。
