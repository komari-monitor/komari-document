# 通过 HTTP 接入 Komari

当设备无法运行常驻 Agent 或不支持 WebSocket 时，可以通过 HTTP POST 调用 Agent v2 JSON-RPC 接口上报信息。

## 前提条件

- 已在 Komari Server 中创建节点并获取 token
- 设备支持定时 HTTP 请求
- 请求地址为 `POST /api/clients/v2/rpc?token={token}`

Agent v1 的 `/api/clients/report`、`/api/clients/uploadBasicInfo`、`/api/clients/ping/tasks` 和 `/api/clients/ping/result` 接口已移除。

## JSON-RPC 请求

所有请求都使用 JSON-RPC 2.0 envelope：

```json
{
  "jsonrpc": "2.0",
  "id": "request-id",
  "method": "agent.basicInfo",
  "params": {}
}
```

请求头为 `Content-Type: application/json`。请求体可以使用 gzip 压缩，并设置 `Content-Encoding: gzip`。

## 基础信息

调用 `agent.basicInfo`，建议在启动时和之后每隔 5-30 分钟调用一次：

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

## 实时监控数据

调用 `agent.report`，建议每 5-8 秒调用一次。`ack_event_ids` 用于确认已处理的服务端事件：

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
      "message": "状态信息"
    },
    "ack_event_ids": []
  }
}
```

## 拉取事件

不支持 WebSocket 的设备应定时调用 `agent.pull`。服务端会在响应的 `result.events` 中返回待处理的 `agent.ping`、`agent.exec`、`agent.terminal.request`、`agent.file`、`agent.startupConfig` 或 `agent.switchVersion` 等事件：

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

探测结果使用 `agent.pingResult` 上报，远程执行结果使用 `agent.taskResult` 上报。两者都发送到同一个 `/api/clients/v2/rpc` 端点。
