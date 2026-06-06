# Komari Agent 信息上报与事件处理文档

## 概述

Komari Agent 是一个轻量级的系统监控代理程序，通过 WebSocket 和 HTTP 协议与服务器进行双向通信。本文档详细描述了 agent 如何向服务器上报系统信息以及如何处理服务器下发的各种事件。

## 架构概览

```text
┌─────────────────┐    WebSocket     ┌─────────────────┐
│   Komari Agent  │ ←──────────────→ │  Komari Server  │
│                 │                  │                 │
│  ┌─────────────┐│    HTTP POST     │                 │
│  │ Monitoring  ││ ──────────────→  │                 │
│  │   Module    ││                  │                 │
│  └─────────────┘│                  │                 │
│                 │                  │                 │
│  ┌─────────────┐│                  │                 │
│  │   Server    ││                  │                 │
│  │   Module    ││                  │                 │
│  └─────────────┘│                  │                 │
└─────────────────┘                  └─────────────────┘
```

## 信息上报机制

### 协议版本与目录约定

Agent 侧协议定义归档在 `komari-agent/protocol`：

- `protocol/v1`：旧版兼容协议。实时上报直接发送 report JSON；基础信息、任务结果等仍使用独立 HTTP API。
- `protocol/v2`：服务端版本 >= `1.2.1` 可用，当前默认协议，基于 JSON-RPC 2.0，统一承载上报、任务、消息与事件。
- `protocol/transport`：传输辅助能力，例如 gzip 压缩。

默认 `--protocol-version=2`。可通过 `AGENT_PROTOCOL_VERSION` 或配置文件中的 `protocol_version` 指定版本。v2 默认开启压缩；如需禁用可使用 `--disable-compression` / `AGENT_DISABLE_COMPRESSION`。

v2 主通道：

- WebSocket：`GET /api/clients/v2/rpc?token={token}`
- POST：`POST /api/clients/v2/rpc?token={token}`

v2 传输策略：

- 首选 WebSocket。WebSocket 是完整双向模式，Agent 可持续上报状态，也可实时接收服务器下发的远程执行、Ping 探测、消息事件和终端请求。
- WebSocket 不可用时可回退 POST。POST 使用相同的 JSON-RPC2 envelope 和相同的 `/api/clients/v2/rpc` 端点，主要用于 Agent -> Server 的单向上报。
- POST fallback 不等价于完整双向连接。没有长连接时，服务器无法主动推送 `agent.exec`、`agent.ping`、`agent.message`、`agent.event`、`agent.terminal.request`，这些能力必须通过额外轮询接口补齐，或者在 fallback 状态下标记为不可用。
- Agent 应持续尝试恢复 WebSocket。进入 POST fallback 后，仍按 `--reconnect-interval` 周期性尝试重新建立 WebSocket；一旦成功，应切回 WebSocket 并停止实时状态的 POST 循环。
- POST fallback 下服务端下发事件通过响应体返回。单个 JSON-RPC 请求仍只返回单个 JSON-RPC response；多个下发事件放入 response 的 `result.events[]` 数组。

v2 JSON-RPC2 envelope：

```json
{
  "jsonrpc": "2.0",
  "method": "agent.report",
  "params": {},
  "id": null
}
```

当前方法：

- Agent -> Server：`agent.report`、`agent.basicInfo`、`agent.pingResult`、`agent.taskResult`、`agent.event`
- Agent -> Server：`agent.pull`，仅 POST fallback / 长轮询场景使用，用于拉取服务器待下发事件
- Server -> Agent：`agent.exec`、`agent.ping`、`agent.message`、`agent.event`、`agent.terminal.request`

实时终端流量不走 v2 主 RPC 通道；`agent.terminal.request` 仅用于请求 Agent 建立独立终端 WebSocket。

### v2 POST fallback 设计

POST fallback 的目标是保证 WebSocket 被代理、CDN、防火墙或虚拟主机环境阻断时，节点仍能保持基础在线状态和监控数据上报。

#### 状态机

Agent v2 传输建议使用以下状态：

| 状态            | 说明                                                                            |
| --------------- | ------------------------------------------------------------------------------- |
| `ws_connecting` | 尝试建立 WebSocket。启动时首先进入该状态。                                      |
| `ws_active`     | WebSocket 已连接，使用 WebSocket 上报并接收服务器事件。                         |
| `post_fallback` | WebSocket 连接失败或断开超过重试阈值，使用 POST 上报。                          |
| `recovering_ws` | fallback 运行中，同时按重连间隔尝试恢复 WebSocket。恢复成功后切回 `ws_active`。 |

推荐流程：

1. 启动后立即上传 `agent.basicInfo`。
2. 尝试连接 WebSocket `/api/clients/v2/rpc?token={token}`。
3. WebSocket 成功后，按 `--interval` 发送 `agent.report`，并监听服务器下发事件。
4. WebSocket 连接失败时，先按 `--max-retries` 和 `--reconnect-interval` 重试。
5. 超过重试阈值后进入 `post_fallback`，按 `--interval` POST `agent.report`。
6. fallback 期间继续定期尝试 WebSocket，成功后切回 WebSocket。

#### POST 请求格式

POST 请求体仍为 JSON-RPC2：

```json
{
  "jsonrpc": "2.0",
  "method": "agent.report",
  "params": {
    "report": {}
  },
  "id": null
}
```

请求头：

- `Content-Type: application/json`
- `Content-Encoding: gzip`：可选。v2 默认允许 gzip 压缩；禁用压缩时不发送该头。
- Cloudflare Access 场景下继续携带 `CF-Access-Client-Id` 与 `CF-Access-Client-Secret`。

POST 响应表示本次 JSON-RPC 请求是否处理成功，也可以携带服务器待下发事件。POST fallback 需要承载事件下发时，Agent 必须设置非空 `id` 并读取 JSON-RPC response；`id` 为 `null` 是 JSON-RPC notification，服务端不应依赖 response 向 Agent 下发事件。

带事件的响应格式：

```json
{
  "jsonrpc": "2.0",
  "id": "report-1",
  "result": {
    "status": "success",
    "events": [
      {
        "id": "evt-1",
        "method": "agent.exec",
        "params": {
          "task_id": "task-id",
          "command": "echo ok"
        }
      },
      {
        "id": "evt-2",
        "method": "agent.ping",
        "params": {
          "ping_task_id": 1,
          "ping_type": "tcp",
          "ping_target": "example.com:443"
        }
      }
    ]
  }
}
```

这里的复数事件是 `result.events[]`，不是多个 JSON-RPC response。只有批量 JSON-RPC 请求才能返回批量 JSON-RPC response；单个 `agent.report` 或 `agent.pull` 请求必须对应单个 response。

#### 能力分层

| 能力                                | WebSocket 模式                               | POST fallback 模式                                  |
| ----------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| `agent.report` 实时状态上报         | 支持                                         | 支持                                                |
| `agent.basicInfo` 基础信息上报      | 支持 POST                                    | 支持                                                |
| `agent.pingResult` 探测结果上报     | 支持                                         | 支持                                                |
| `agent.taskResult` 远程执行结果上报 | 支持 POST                                    | 支持                                                |
| `agent.exec` 远程执行下发           | 服务器主动推送                               | 需要轮询补齐，否则不可用                            |
| `agent.ping` 探测任务下发           | 服务器主动推送                               | 可复用 `/api/clients/ping/tasks` 轮询或新增 v2 pull |
| `agent.message` / `agent.event`     | 服务器主动推送                               | 需要轮询补齐，否则不可用                            |
| `agent.terminal.request`            | 服务器主动推送请求，终端流量走独立 WebSocket | fallback 下不可实时推送；终端本身仍依赖 WebSocket   |

#### 下发任务的 fallback 方案

POST fallback 下，服务端无法真正主动给 Agent 发消息，只能在 Agent 的 HTTP 请求响应中返回待处理事件。推荐采用“定时 report 顺带事件 + pull 长轮询”的组合：

1. `agent.report`：负责定时状态上报，服务端可在 response 的 `result.events[]` 中顺带返回少量待处理事件。
2. `agent.pull`：负责 fallback 下接近实时的事件下发，Agent 发起 POST 后服务端可短暂挂起请求；有事件立即返回，超时返回空数组。

#### `agent.report` 携带确认

Agent 处理完事件后，应在后续 `agent.report` 或 `agent.pull` 中携带确认信息：

```json
{
  "jsonrpc": "2.0",
  "method": "agent.report",
  "params": {
    "report": {},
    "ack_event_ids": ["evt-1", "evt-2"]
  },
  "id": "report-2"
}
```

`ack_event_ids` 用于告诉服务端这些事件已被 Agent 接收并处理。服务端应允许重复 ack。

#### `agent.pull` 长轮询

Agent 请求：

```json
{
  "jsonrpc": "2.0",
  "method": "agent.pull",
  "params": {
    "capabilities": ["exec", "ping", "message", "event"],
    "ack_event_ids": ["evt-1", "evt-2"],
    "last_event_id": ""
  },
  "id": "pull-1"
}
```

Server response：

```json
{
  "jsonrpc": "2.0",
  "id": "pull-1",
  "result": {
    "events": [
      {
        "id": "evt-3",
        "method": "agent.exec",
        "params": {
          "task_id": "task-id",
          "command": "echo ok"
        }
      }
    ]
  }
}
```

长轮询建议：

- 服务端最长 hold 20-30 秒。
- 有事件时立即返回。
- 无事件时返回 `events: []`。
- Agent 收到响应后立即发起下一次 `agent.pull`。
- 每个 Agent 同一时间只保留一个活跃 `agent.pull`，避免乱序和重复派发。
- `agent.report` 与 `agent.pull` 可并行，但事件下发优先由 `agent.pull` 承担。

事件结构：

| 字段         | 类型   | 说明                                        |
| ------------ | ------ | ------------------------------------------- |
| `id`         | string | 服务端生成的事件 ID，用于 ack 和去重。      |
| `method`     | string | 下发方法，例如 `agent.exec`、`agent.ping`。 |
| `params`     | object | 方法参数，结构与 WebSocket 下发保持一致。   |
| `created_at` | string | 可选，事件创建时间。                        |
| `expires_at` | string | 可选，事件过期时间。过期事件不应继续下发。  |

服务端需要保证事件下发至少一次，Agent 需要按 `id` 去重并保持处理幂等。网络错误、响应丢失或 ack 丢失时，Agent 可能重复收到同一个事件。

#### 兼容方案

如果短期不实现 `agent.pull`，可先使用现有独立接口：

- Ping 任务：Agent 周期性请求 `GET /api/clients/ping/tasks?token={token}`，本地按任务 interval 调度，结果通过 `agent.pingResult` 或 `POST /api/clients/ping/result` 上报。
- 远程执行：当前没有 Agent 侧拉取接口；fallback 状态下应在管理端标记远程执行不可用，或新增拉取接口。

如果短期只需要“WebSocket 不可用时仍上报监控数据”，可以先实现兼容方案，并明确 fallback 下远程执行和终端不可用。

#### 在线状态与 UI 表示

服务端应区分以下状态，避免 POST fallback 节点被误判为完全离线：

- `online_ws`：存在 WebSocket 连接，完整在线。
- `online_post`：最近收到 POST `agent.report`，基础在线但能力降级。
- `offline`：超过离线阈值未收到 WebSocket 心跳或 POST 上报。

推荐离线阈值为 `max(3 * interval, 30s)`，并可设置上限避免异常配置导致节点长期显示在线。

管理端在 `online_post` 时应提示：

- 实时状态上报可用。
- 远程执行、服务端主动消息、终端请求可能不可用。
- WebSocket 恢复后会自动切回完整在线。

#### 重试与退避

- WebSocket 首次连接失败：按 `--reconnect-interval` 重试，最多 `--max-retries` 次后进入 fallback。
- fallback 上报失败：按指数退避重试，建议从 `--reconnect-interval` 开始，最大不超过 60 秒；不要因为单次 POST 失败退出 Agent。
- WebSocket 恢复探测：fallback 期间可每 `max(--reconnect-interval, 10s)` 尝试一次，失败不影响 POST 上报循环。
- 切回 WebSocket 前后避免重复上报：同一采样周期只通过一种传输发送 `agent.report`。

### 1. 基础信息上报 (Basic Info Upload)

#### 上报时机

- Agent 启动时立即上报一次
- 之后每隔指定时间间隔（默认 5 分钟）上报一次

#### 接口

- **v1 端点**: `POST /api/clients/uploadBasicInfo?token={token}`
- **v2 端点**: `POST /api/clients/v2/rpc?token={token}`，method 为 `agent.basicInfo`
- **频率**: 不建议太高，5-30分钟最佳

#### 上报内容

基础信息包含以下静态系统信息：

其中 `cpu_physical_cores` 为可选的物理核心数；当 Agent 或兼容接入方无法提供该值时 `0` 表示未上报或未知。

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
  "version": "0.0.1-rust", //版本信息无校验，可随意填入
  "virtualization": "None"
}
```

### 2. 实时监控数据上报 (Real-time Monitoring)

#### 监控数据上报时机

默认间隔 1 秒。v2 首选通过 WebSocket 持续上报；当 WebSocket 不可用并进入 POST fallback 时，按相同采样间隔通过 POST 上报。

#### 接口

- **v1 WebSocket 端点**: `ws://server/api/clients/report?token={token}` (或 wss)
- **v1 POST 端点**: `POST /api/clients/report?token={token}`
- **v2 WebSocket 端点**: `ws://server/api/clients/v2/rpc?token={token}` (或 wss)，method 为 `agent.report`
- **v2 POST fallback 端点**: `POST /api/clients/v2/rpc?token={token}`，method 为 `agent.report`

#### 监控数据内容

实时监控数据包含以下动态系统信息：

> 所有数据容量单位均为字节

```json
{
  "cpu": {
    "usage": 12.5 // 12.5%
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
    "load1": 0.1, // 即时负载
    "load5": 0,
    "load15": 0
  },
  "disk": {
    "total": 10, //总磁盘空间
    "used": 2 //已用磁盘空间
  },
  "network": {
    "up": 1, //上传速度
    "down": 1, // 下载速度
    "totalUp": 1024, //总上传流量
    "totalDown": 1024 // 总下载流量
  },
  "connections": {
    "tcp": 12,
    "udp": 1
  },
  "uptime": 10000, //单位：秒
  "process": 10,
  "message": "错误或状态信息" // 将会显示在主页，可公开访问，请勿携带敏感信息
}
```

#### 监控数据实现细节

## 事件处理机制

Agent 通过 WebSocket 连接接收服务器下发的事件，通过message字段指定事件类型，支持以下三种类型的事件：

### 1. 远程命令执行 (Remote Exec)

#### 远程执行消息格式

```json
{
  "message": "exec",
  "task_id": "任务ID",
  "command": "要执行的命令"
}
```

#### 远程执行处理流程

1. **命令验证**: 检查 `task_id` 和 `command` 是否有效
2. **权限检查**: 验证是否禁用了远程执行功能（`--disable-web-ssh`）
3. **命令执行**:
   - Windows: 使用 PowerShell 执行
   - Linux/Unix: 使用 sh 执行
4. **结果收集**: 捕获标准输出、标准错误和退出码
5. **结果上报**: 通过 HTTP POST 上报执行结果

**重要**

请验证是否禁用远程控制(`--disable-web-ssh`参数)

#### 远程执行结果格式

```json
{
  "task_id": "任务ID",
  "result": "命令输出结果",
  "exit_code": 0, // 进程退出码
  "finished_at": "完成时间 RFC3339 格式（或其他通用格式，请务必带上时区）"
}
```

#### 远程执行上报端点

`POST /api/clients/task/result?token={token}`

### 2. 网络探测任务 (Ping Task)

#### 网络探测消息格式

```json
{
  "message": "ping",
  "ping_task_id": 123,
  "ping_type": "icmp|tcp|http",
  "ping_target": "目标地址"
}
```

#### 支持的探测类型

##### ICMP Ping

- 发送 ICMP 回显请求包
- 测量往返时延

##### TCP Ping

- 建立 TCP 连接测试
- 默认端口 80，可指定其他端口
- 测量连接建立时间

##### HTTP Ping

- 发送 HTTP GET 请求
- 支持 HTTP/HTTPS 协议
- 测量 HTTP 响应时间

#### 网络探测结果上报

通过 WebSocket 连接实时返回探测结果：

```json
{
  "type": "ping_result",
  "task_id": 123,
  "ping_type": "icmp",
  "value": 13, //延迟毫秒数 (-1表示失败,将会被视为丢包)
  "finished_at": "完成时间"
}
```

### 3. 远程终端连接 (Terminal Connection)

#### 终端连接消息格式

```json
{
  "message": "terminal",
  "request_id": "终端会话ID"
}
```

#### 终端连接处理流程

1. **会话创建**: 使用 `request_id` 建立独立的 WebSocket 终端连接
2. **终端启动**: 根据操作系统启动相应的终端程序
3. **数据转发**: 双向转发终端输入输出数据
4. **会话管理**: 处理终端会话的生命周期

**重要**

1. 请在会话结束（连接断开）时，终止子进程
2. 请验证是否禁用远程控制(`--disable-web-ssh`参数)

#### 终端连接端点

`ws://server/api/clients/terminal?token={token}&id={request_id}`

## 连接管理与容错机制

以下内容为komari-agent的一些实现细节，你可以参考。

### 1. WebSocket 连接管理

#### 连接建立

- 启动时尝试建立 WebSocket 连接
- 连接失败时按配置的间隔重试
- v1 或未启用 fallback 时，超过最大重试次数后可退出主连接循环
- v2 启用 POST fallback 时，超过最大重试次数后进入 `post_fallback`，并在后台继续尝试恢复 WebSocket

#### 断线重连

- 定时检查连接状态
- 连接断开时自动重连
- 重连间隔可配置（`--reconnect-interval`）
- v2 fallback 模式下，POST 上报循环不应阻塞 WebSocket 恢复探测

#### 线程安全

使用 `SafeConn` 包装器确保并发访问安全：

- 写操作使用互斥锁保护
- 读操作针对单一消费者优化
- 支持超时设置

### 2. 错误处理与重试

#### HTTP 请求重试

- 基础信息上报失败时记录日志
- 任务结果上报支持重试机制
- v2 POST fallback 上报失败时记录日志并退避重试，不应因为单次失败退出 Agent
- 可配置最大重试次数

#### 消息解析容错

- JSON 解析失败时记录错误日志
- 跳过无效消息继续处理
- 保持连接稳定性

## 配置参数

### 连接配置

- `--endpoint`: 服务器端点地址
- `--token`: 认证令牌
- `--ignore-unsafe-cert`: 忽略不安全的 SSL 证书

### 时间间隔配置

- `--interval`: 监控数据上报间隔（秒，默认 1.0）
- `--info-report-interval`: 基础信息上报间隔（分钟，默认 5）
- `--reconnect-interval`: 重连间隔（秒，默认 5）

### 重试配置

- `--max-retries`: 最大重试次数（默认 3）

### 功能开关

- `--disable-auto-update`: 禁用自动更新
- `--disable-web-ssh`: 禁用远程控制功能
- `--memory-mode-available`: 内存报告模式

## 安全考虑

### 1. 认证机制

- 所有 API 请求都需要携带有效的 token
- token 通过 URL 参数传递

### 2. 权限控制

- 远程执行功能可以通过参数禁用
- 终端访问需要明确的会话 ID

### 3. 数据传输

- 支持 HTTPS/WSS 加密传输
- 可配置忽略不安全证书（仅用于测试环境）

## 运行流程总结

1. **启动阶段**:
   - 解析命令行参数
   - 检查并执行自动更新
   - 上报基础系统信息

2. **运行阶段**:
   - 建立 WebSocket 连接
   - 定时上报监控数据
   - 监听并处理服务器事件
   - 定时上报基础信息

3. **事件处理**:
   - 接收 WebSocket 消息
   - 根据消息类型分发处理
   - 执行相应的任务或操作
   - 上报处理结果

4. **容错恢复**:
   - 监控连接状态
   - 自动重连断开的连接
   - 重试失败的请求
   - 记录错误日志
