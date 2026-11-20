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

### 协议与目录约定

Agent 侧协议定义归档在 `komari-agent/protocol`：

- `protocol/v2`：当前唯一协议，基于 JSON-RPC 2.0，统一承载上报、任务、消息与事件。
- `protocol/transport`：传输辅助能力，例如 gzip 压缩。

Agent 始终使用 v2。v2 默认开启压缩；如需禁用可使用 `--disable-compression` / `AGENT_DISABLE_COMPRESSION`。

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

- Agent -> Server：`agent.report`、`agent.basicInfo`、`agent.pingResult`、`agent.taskResult`、`agent.file.result`、`agent.startupConfig.result`、`agent.event`
- Agent -> Server：`agent.pull`，仅 POST fallback / 长轮询场景使用，用于拉取服务器待下发事件
- Server -> Agent：`agent.exec`、`agent.ping`、`agent.message`、`agent.event`、`agent.terminal.request`、`agent.file`、`agent.startupConfig`、`agent.switchVersion`

实时终端流量不走 v2 主 RPC 通道；`agent.terminal.request` 仅用于请求 Agent 建立独立终端 WebSocket。文件字节流同样走独立 HTTP 通道 `/api/clients/transfer/:id`。

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
| `agent.basicInfo` 基础信息上报      | 支持 POST / WS                               | 支持                                                |
| `agent.pingResult` 探测结果上报     | 支持 WS / POST                               | 支持                                                |
| `agent.taskResult` 远程执行结果上报 | 支持 POST / WS                               | 支持                                                |
| `agent.exec` / `agent.ping` / `agent.file` / `agent.startupConfig` / `agent.switchVersion` | 服务器主动推送 | 通过 `agent.pull` 长轮询与 `agent.report` 响应顺带拉取 |
| `agent.terminal.request`            | 服务器主动推送请求，终端流量走独立 WebSocket | 可通过 `agent.pull` / `agent.report` 触发回连，但终端流量本身仍依赖 WebSocket |

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
    "capabilities": [
      "exec",
      "ping",
      "message",
      "event",
      "terminal",
      "file",
      "startup_config",
      "switch_version"
    ],
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
| `created_at` | string | 事件创建时间，UTC RFC3339Nano。              |
| `expires_at` | string | 事件过期时间，UTC RFC3339Nano；过期事件不应继续下发。 |

服务端需要保证事件下发至少一次，Agent 需要按 `id` 去重并保持处理幂等。网络错误、响应丢失或 ack 丢失时，Agent 可能重复收到同一个事件。

#### 在线状态与重试机制

服务端分别跟踪 WebSocket 连接状态（读超时 `75s`，Agent 每 `30s` 发送 WS Ping）与 POST 在线租约（`35s` TTL），前端公开 `/api/clients` 会统一返回合并后的 `online` 在线列表。

- WebSocket 首次连接失败：按 `--reconnect-interval` 重试，最多 `--max-retries` 次后进入 `post_fallback`。
- fallback 上报与拉取：`post_fallback` 期间按 `--interval` 发送 `agent.report`、按 `--reconnect-interval` 尝试恢复 WebSocket；`agent.pull` 发生错误时按 `--reconnect-interval` 重试，单次失败不会退出 Agent。
- 切回 WebSocket 前后避免重复上报：同一采样周期只通过一种传输发送 `agent.report`。

### 1. 基础信息上报 (Basic Info Upload)

#### 上报时机

- Agent 启动时立即上报一次
- 之后每隔指定时间间隔（默认 5 分钟）上报一次

#### 接口

- **v2 端点**: `POST /api/clients/v2/rpc?token={token}`，method 为 `agent.basicInfo`
- **频率**: 不建议太高，5-30分钟最佳

#### 上报内容

基础信息放在 JSON-RPC `params.info` 对象中：

其中 `cpu_physical_cores` 为可选的物理核心数；当 Agent 或兼容接入方无法提供该值时 `0` 表示未上报或未知。

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

### 2. 实时监控数据上报 (Real-time Monitoring)

#### 监控数据上报时机

默认间隔 **3.0 秒**（`--interval` 最小保底为 `1.0` 秒）。v2 首选通过 WebSocket 持续上报；当 WebSocket 不可用并进入 POST fallback 时，按相同采样间隔通过 POST 上报。

#### 接口

- **v2 WebSocket 端点**: `ws://server/api/clients/v2/rpc?token={token}` (或 wss)，method 为 `agent.report`
- **v2 POST fallback 端点**: `POST /api/clients/v2/rpc?token={token}`，method 为 `agent.report`

#### 监控数据内容

实时监控数据放在 JSON-RPC `params.report` 对象中（所有容量单位均为字节）：

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
      "message": "错误或状态信息",
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

`gpu` 为可选字段（仅在启用 `--gpu` 详细 GPU 监控时附带）；`message` 会显示在公开页面，请勿携带敏感信息。

## 事件处理机制

Agent 通过 WebSocket 推送或 POST `agent.pull` / `agent.report` 响应接收服务器下发的 JSON-RPC 2.0 事件（通过 `method` 指定事件类型，`params` 携带参数）。主要包括以下事件：

### 1. 远程命令执行 (`agent.exec`)

#### 远程执行消息格式

```json
{
  "jsonrpc": "2.0",
  "method": "agent.exec",
  "params": {
    "task_id": "任务ID",
    "command": "要执行的命令"
  },
  "id": "evt-1"
}
```

#### 远程执行处理流程

1. **命令验证**: 检查 `task_id` 和 `command` 是否有效
2. **权限检查**: 验证是否禁用了远程执行功能（`--disable-web-ssh`）
3. **命令执行**:
   - Windows: 使用 PowerShell 执行
   - Linux/Unix: 使用 sh 执行
4. **结果收集**: 捕获标准输出、标准错误和退出码
5. **结果上报**: 通过 JSON-RPC `agent.taskResult` 上报执行结果

**重要**

请验证是否禁用远程控制(`--disable-web-ssh`参数)

#### 远程执行结果格式

```json
{
  "jsonrpc": "2.0",
  "method": "agent.taskResult",
  "params": {
    "task_id": "任务ID",
    "result": "命令输出结果",
    "exit_code": 0,
    "finished_at": "2026-07-17T01:30:00Z"
  },
  "id": null
}
```

`finished_at` 必须为带时区的 RFC3339 格式。

#### 远程执行上报端点

`POST /api/clients/v2/rpc?token={token}`（也支持通过已建立的 v2 WebSocket 上报），method 为 `agent.taskResult`。

### 2. 网络探测任务 (`agent.ping`)

#### 网络探测消息格式

```json
{
  "jsonrpc": "2.0",
  "method": "agent.ping",
  "params": {
    "ping_task_id": 123,
    "ping_type": "icmp|tcp|http",
    "ping_target": "目标地址"
  },
  "id": "evt-2"
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

优先通过当前 WebSocket 连接发送 JSON-RPC `agent.pingResult`（若 WebSocket 不可用则回退到 `POST /api/clients/v2/rpc?token={token}`）：

```json
{
  "jsonrpc": "2.0",
  "method": "agent.pingResult",
  "params": {
    "task_id": 123,
    "ping_type": "icmp",
    "value": 13,
    "finished_at": "2026-07-17T01:30:00.123456789Z"
  },
  "id": null
}
```

`value` 为延迟毫秒数，`-1` 表示探测失败（将被视为丢包）。

### 3. 远程终端连接 (`agent.terminal.request`)

#### 终端连接消息格式

```json
{
  "jsonrpc": "2.0",
  "method": "agent.terminal.request",
  "params": {
    "request_id": "终端会话ID"
  },
  "id": "evt-3"
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

### 4. 文件操作、配置读取与版本切换

除了上述三类核心事件外，Agent v2 还支持：

- `agent.file` / `agent.file.result`：远程文件管理控制面，大文件字节流通过 `/api/clients/transfer/:id` 传输。
- `agent.startupConfig` / `agent.startupConfig.result`：读取 Agent 当前生效的启动配置。
- `agent.switchVersion`：切换或更新 Agent 版本（需要未设置 `--disable-web-ssh`，且未禁用自动更新）。

详细参数与返回结构见 [API 文档 - Agent v2 RPC](/dev/api#_15-agent-v2-rpc)。

## 连接管理与容错机制

以下内容为komari-agent的一些实现细节，你可以参考。

### 1. WebSocket 连接管理

#### 连接建立

- 启动时尝试建立 WebSocket 连接
- 连接失败时按配置的间隔重试
- 超过最大重试次数后进入 `post_fallback`，并在后台继续尝试恢复 WebSocket

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

Agent 参数支持命令行参数、环境变量与 `--config` JSON 配置文件三种来源，优先级从低到高为：**默认值 < 命令行参数 < 环境变量 < JSON 配置文件**（自动发现成功后获取的 Token 会覆盖当前运行配置中的 Token）。

### 连接配置

- `-e, --endpoint` (`AGENT_ENDPOINT`)：服务器端点地址
- `-t, --token` (`AGENT_TOKEN`)：认证令牌
- `--auto-discovery` (`AGENT_AUTO_DISCOVERY_KEY`)：自动发现密钥
- `-u, --ignore-unsafe-cert` (`AGENT_IGNORE_UNSAFE_CERT`)：忽略不安全的 SSL 证书（默认 `false`）
- `--custom-dns` (`AGENT_CUSTOM_DNS`)：自定义 DNS 服务器（如 `8.8.8.8`）
- `--prefer-ip-version` (`AGENT_PREFER_IP_VERSION`)：优先使用的 IP 版本（`4` 或 `6`）
- `--disable-compression` (`AGENT_DISABLE_COMPRESSION`)：禁用 v2 gzip 与 WebSocket `permessage-deflate` 压缩（默认 `false`）
- `--config` (`AGENT_CONFIG_FILE`)：JSON 配置文件路径

### 时间间隔与重试配置

- `-i, --interval` (`AGENT_INTERVAL`)：监控数据上报间隔，单位秒（默认 `3.0`，运行下限 `1.0`）
- `--info-report-interval` (`AGENT_INFO_REPORT_INTERVAL`)：基础信息上报间隔，单位分钟（默认 `5`）
- `-c, --reconnect-interval` (`AGENT_RECONNECT_INTERVAL`)：重连间隔，单位秒（默认 `5`）
- `-r, --max-retries` (`AGENT_MAX_RETRIES`)：最大重试次数（默认 `3`）

### 采集与功能开关

- `--disable-auto-update` (`AGENT_DISABLE_AUTO_UPDATE`)：禁用自动更新（默认 `false`）
- `--disable-web-ssh` (`AGENT_DISABLE_WEB_SSH`)：禁用远程控制（Web SSH、远程执行、版本切换等，默认 `false`）
- `--memory-include-cache` (`AGENT_MEMORY_INCLUDE_CACHE`)：内存统计包含缓存/缓冲区（默认 `false`）
- `--memory-exclude-bcf` (`AGENT_MEMORY_REPORT_RAW_USED`)：使用 `Total - Free - Buffers - Cached` 计算已用内存（默认 `false`；旧参数 `--memory-mode-available` 已自 `1.0.70` 起弃用并移除）
- `--include-nics` / `--exclude-nics` (`AGENT_INCLUDE_NICS` / `AGENT_EXCLUDE_NICS`)：按逗号分隔包含或排除指定网卡（支持通配符）
- `--include-mountpoint` (`AGENT_INCLUDE_MOUNTPOINTS`)：按分号分隔仅统计指定磁盘挂载点
- `--month-rotate` (`AGENT_MONTH_ROTATE`)：流量统计每月重置日期（`0` 为禁用，默认 `0`）
- `--gpu` (`AGENT_ENABLE_GPU`)：启用详细 GPU 监控（默认 `false`）
- `--custom-ipv4` / `--custom-ipv6` (`AGENT_CUSTOM_IPV4` / `AGENT_CUSTOM_IPV6`)：覆盖上报的 IPv4 / IPv6 地址
- `--get-ip-addr-from-nic` (`AGENT_GET_IP_ADDR_FROM_NIC`)：从网卡直接获取 IP 地址（默认 `false`）
- `HOST_PROC`（仅环境变量或 JSON 字段 `host_proc`）：容器环境下挂载宿主机 `/proc` 的路径

辅助调试子命令：`komari-agent check-mem`、`komari-agent list-disk`。

## 安全考虑

### 1. 认证机制

- 所有 API 请求都需要携带有效的 Client Token
- 可通过 Query 参数 `?token=` / `?Authorization=` 或未压缩非 GET 请求顶层 JSON `{"token": ...}` 传递（WebSocket 与 gzip 请求请使用 Query 参数）

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
