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

### 1. 基础信息上报 (Basic Info Upload)

#### 上报时机

- Agent 启动时立即上报一次
- 之后每隔指定时间间隔（默认 5 分钟）上报一次

#### 接口

- **端点**: `POST /api/clients/uploadBasicInfo?token={token}`
- **频率**: 不建议太高，5-30分钟最佳

#### 上报内容

基础信息包含以下静态系统信息：

```json
{
  "arch": "amd64",
  "cpu_cores": 12,
  "cpu_name": "AMD Ryzen 9 9950X3D",
  "disk_total": 1099511627776,
  "gpu_name": "NVIDIA GeForce RTX 5090",
  "ipv4": "1.1.1.1",
  "ipv6": "2606:4700:4700::1111",
  "mem_total": 137438953472,
  "os": "Windows 11 Home",
  "swap_total": 51539607552,
  "version": "0.0.1",
  "virtualization": "None"
}
```


### 2. 实时监控数据上报 (Real-time Monitoring)

#### 监控数据上报时机

通过 WebSocket 连接持续上报，默认间隔 1 秒

#### 接口 

- **协议**: WebSocket
- **端点**: `ws://server/api/clients/report?token={token}` (或wss)

#### 监控数据内容

实时监控数据包含以下动态系统信息：

> 所有数据容量单位均为字节

```json
{
  "cpu": {
    "usage": 0.125 // 12.5%
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
    "total":10, //总磁盘空间
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
  "value": "延迟毫秒数 (-1表示失败)", // 推荐测试失败时直接不上报
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
- 支持最大重试次数限制

#### 断线重连

- 定时检查连接状态
- 连接断开时自动重连
- 重连间隔可配置（`--reconnect-interval`）

#### 线程安全

使用 `SafeConn` 包装器确保并发访问安全：

- 写操作使用互斥锁保护
- 读操作针对单一消费者优化
- 支持超时设置

### 2. 错误处理与重试

#### HTTP 请求重试

- 基础信息上报失败时记录日志
- 任务结果上报支持重试机制
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
