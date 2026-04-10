# 通过 HTTP 接口上报信息

在某些情况下，您的设备可能不具备标准程序运行环境，或者无法部署常驻进程来安装 Agent 上报信息（例如 Mikrotik RouterOS 路由器）。针对这种情况，可以通过 HTTP 接口来上报信息。

本文档将指导您调用相关接口，并对相关接口字段加以解释。

## 前提条件

- `Komari` Server 端版本号 >= 1.1.8
- 您的设备可以通过 `脚本` 或其他编程形式获取设备、网络相关信息
- 您的设备支持通过 `HTTP` 接口同 `Server` 端进行通讯
- 您的设备支持通过 `定时任务` 来执行脚本
- 您需要拥有编程基础，了解 HTTP 以及如何在您的设备上进行编程

> 接口信息也可参考 [Agent 开发](/dev/agent.html#信息上报机制)

> 如果您的设备支持 WebSocket，建议使用 WebSocket 接口，具体信息参见上方链接

## 获取 Token

在管理后台添加一个新的节点，并从节点对应的 Agent 命令中复制 token 参数（即 -t 参数）。

![dev-http-token](/assets/dev-http-token.png)

## 使用介绍

通过 HTTP 协议来调用如下接口，详细调用方式和字段见后续章节。

- 基础信息上报接口(必须)
  + 上传设备基础信息，如硬件规格、IP、系统版本等
  + 建议 `5-30分钟` 调用一次

- 实时监控数据上报接口(必须)
  + 上传设备实时状态，如 CPU、内存、磁盘占用率、网速、已开机时间等
  + 建议 `5-8秒` 调用一次

- Ping 任务列表获取接口(可选)
  + 获取当前节点需要执行的任务列表
  + 建议 `30秒-1分钟` 调用一次

- Ping 任务执行结果上传接口(可选)
  + 根据前一个接口获取的任务列表，执行对应的 Ping 任务，然后上报执行结果
  + 和获取 Ping 任务接口串行执行

> 所有接口的数据单位均为 Byte

## 1. 基础信息上报接口

- 端点： `POST /api/clients/uploadBasicInfo?token={token}`

- Payload：

```json
{
  "arch": "amd64", // 系统架构
  "cpu_cores": 12, // CPU 核心数
  "cpu_name": "AMD Ryzen 9 9950X3D", // CPU 名称
  "disk_total": 1099511627776, // 磁盘空间
  "gpu_name": "NVIDIA GeForce RTX 5090", // 显卡名称
  "ipv4": "1.1.1.1", // IPv4 地址
  "ipv6": "2606:4700:4700::1111", // IPv6 地址
  "mem_total": 137438953472, // 内存空间
  "os": "Windows 11 Home", // 操作系统名称
  "kernel_version": "26100.4652", // 内核版本号
  "swap_total": 51539607552, // SWAP 空间
  "version": "0.0.1-rust", //版本信息无校验，可随意填入
  "virtualization": "None" // 虚拟化类型，可随意填入
}
```

## 2. 实时监控数据上报接口

- 端点： `POST /api/clients/report?token={token}`

- Payload：

```json
{
  "cpu": {
    "usage": 12.5 // CPU 占用率
  },
  "ram": {
    "total": 1024, // 内存总空间
    "used": 512 // 已用内存空间
  },
  "swap": {
    "total": 1024, // SWAP 总空间
    "used": 512 // 已用 SWAP 空间
  },
  "load": {
    "load1": 0.1, // 即时负载
    "load5": 0,
    "load15": 0
  },
  "disk": {
    "total":10, // 总磁盘空间
    "used": 2 // 已用磁盘空间
  },
  "network": {
    "up": 1, // 上传速度
    "down": 1, // 下载速度
    "totalUp": 1024, //总上传流量
    "totalDown": 1024 // 总下载流量
  },
  "connections": {
    "tcp": 12, // TCP 连接数
    "udp": 1 // UDP 连接数
  },
  "uptime": 10000, // 已开机时长，单位：秒
  "process": 10, // 进程数量
  "message": "错误或状态信息" // 将会显示在主页，可公开访问，请勿携带敏感信息
}
```

## 3. Ping 任务列表获取接口

- 端点： `GET /api/clients/ping/tasks?token={token}`

- 响应值：
```json
[
  {
    "id": 1, // Ping Task ID
    "name": "Ping CF", // 任务名称
    "clients": [
      "866fb297-20db-46fd-882f-57f73810ad12",
      "eb735cf1-1a4b-47c6-ba00-bde261fde09e"
    ], // 分配了该任务的节点，该字段可忽略
    "type": "icmp", // Ping 类型， ICMP / TCP / HTTP
    "target": "1.1.1.1", // Ping 目标 1.1.1.1 | 1.1.1.1:80 | https://1.1.1.1
    "interval": 2 // 循环执行任务间隔
  }
]
```

## 4. Ping 任务执行结果上传接口

- 端点： `POST /api/clients/ping/result?token={token}`

- Payload:

```json
{
  "task_id": 1, // Ping Task ID
  "value": 22, // Ping 值，单位 ms
  "ping_type": "icmp", // Ping 类型
  "finished_at": "2026-02-21T23:29:10+08:00" // Ping 时间
}
```
