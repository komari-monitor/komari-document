# API 接口

Komari 提供了一套 API 接口，供开发者进行二次开发和集成。以下是主要的 API 接口文档。

::: warning 注意
推荐优先使用 [RPC2接口](./rpc.md) ,后续的新功能和改动会优先在 RPC2 接口中实现。
:::

## 认证

如果你需要操作后台（以 `/api/admin` 开头的地址），需要进行认证。

### Cookie

验证 `session_token` 字段

### API Key

方式： Bearer Authentication

:::warning 注意
仅1.0.3之后(不含)的版本可以使用API Key认证
:::

## 用户信息接口

### GET `/api/me`

获取当前用户信息，用于检查登录状态。

**请求参数:**
- `session_token` (Cookie) - 会话令牌

**响应示例:**
```json
{
    "2fa_enabled": false,
    "logged_in": true,
    "sso_id": "",
    "sso_type": "",
    "username": "admin",
    "uuid": "dba6c900-0b7f-4513-b0c5-45e21acb64a0"
}
```

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `logged_in` | boolean | 是否已登录 |
| `username` | string | 用户名 |
| `2fa_enabled` | boolean | 是否启用两步验证（仅登录时返回） |
| `sso_id` | string | SSO ID（仅登录时返回） |
| `sso_type` | string | SSO 类型（仅登录时返回） |
| `uuid` | string | 用户 UUID（仅登录时返回） |

## 服务端公开属性

### GET `/api/public`

获取站点的公开设置属性，适用于主题自定义和展示。

**响应示例:**
```json
{
    "status": "success",
    "message": "",
    "data": {
        "cors_origin_check_enabled": true,
        "custom_body": "",
        "custom_head": "\n    \u003Cstyle\u003E\n      body { /* 自定义样式省略 */ }\n    \u003C/style\u003E",
        "description": "Komari Monitor, a simple server monitoring tool.",
        "disable_password_login": false,
        "oauth_enable": true,
        "oauth_provider": "github",
        "ping_record_preserve_time": 48,
        "private_site": false,
        "record_enabled": true,
        "record_preserve_time": 720,
        "sitename": "Komari",
        "theme": "Mochi",
        "theme_settings": {
            "number_A": 99,
            "select_A": "选项3",
            "string_A": "测试文本",
            "switch_A": true
        }
    }
}
```

:::warning 注意
如果你遵守了主题 [index.html的要求](./theme.md#主页面模板)，服务端会自动处理 `sitename` 、 `description` 、 `custom_head` 和 `custom_body` 的内容。无需在主题中手动处理这些内容。
:::

::: tip 动态主题配置
`theme_settings` 与主题包中 `komari-theme.json` 的 `configuration.data` 相对应（仅服务器版本 >= 1.0.5 支持）。它是公开可读的，任何访问者都能通过此接口获取。
对于已安装且非 `default` 的 `managed` 主题，后端会把管理员保存的值与主题声明中的默认值合并后返回；已保存的值优先。`select` 未声明默认值时会使用第一个选项，`number` 默认为 `0`，`switch` 默认为 `false`，其他类型默认为空字符串。
`redirect` 的目标按站点根目录解析，而不是按 `/admin` 解析。
:::

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `cors_origin_check_enabled` | boolean | 是否启用 CORS 跨域请求校验；开启后 API 请求只允许同源或允许列表中的地址，API Key 请求会绕过该校验 |
| `custom_body` | string | 用户自定义 body 内容（HTML片段） |
| `custom_head` | string | 用户自定义 head 内容（HTML片段） |
| `description` | string | 站点描述 |
| `disable_password_login` | boolean | 是否禁用密码登录 |
| `oauth_enable` | boolean | 是否启用 OAuth 登录 |
| `oauth_provider` | string | OAuth 提供商标识（如 `github`；未启用 OAuth 时也可能返回当前配置值） |
| `ping_record_preserve_time` | number | 最大 ping 记录保留时间（小时） |
| `private_site` | boolean | 是否为私有站点（私有时未登录访问可能受限） |
| `record_enabled` | boolean | 是否启用历史记录功能 |
| `record_preserve_time` | number | 最大负载记录保留时间（小时） |
| `sitename` | string | 站点名称 |
| `theme` | string | 当前启用的主题 `short` 名称 |
| `theme_settings` | object | 主题动态配置值映射；没有配置时为空对象 `{}` |

这些属性可用于主题的自定义展示，例如动态设置页面标题、描述、样式等。

::: tip 私有站点临时访问
如果用户通过有效的临时访问链接进入站点，服务端会设置 `temp_key` Cookie；此时 `/api/public` 会把 `private_site` 临时返回为 `false`，方便主题按公开访问状态渲染。
:::

### GET `/api/version`

获取当前 Komari 服务端的版本信息。

**响应示例:**
```json
{
    "status": "success",
    "message": "",
    "data": {
        "hash": "bb43b25e373f9f4c6b1ce096eef95138b3525676",
        "version": "dev"
    }
}
```

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `hash` | string | 当前构建的 Git 哈希值 |
| `version` | string | 当前服务端版本号 |

该接口可用于在主题中显示服务端版本信息，便于调试和版本管理。

## 登录/登出

### POST `/api/login`

用户登录接口。

**请求体:**
```json
{
  "username": "admin",
  "password": "password",
  "2fa_code": "123456"  // 可选，启用两步验证时需要
}
```

**响应示例:**
```json
{
    "status": "success",
    "message": "",
    "data": {
        "set-cookie": {
            "session_token": "abcd1234"
        }
    }
}
```

服务端会同时设置 `session_token` Cookie（`HttpOnly`，`SameSite=Lax`）。

### OAuth 登录
#### GET `/api/oauth`

OAuth 登录接口，直接重定向到 `/api/oauth`，用户可通过第三方平台进行认证。

### GET `/api/logout`

用户登出接口，直接重定向到 `/api/logout`，执行后会重定向到首页。

## 所有节点信息

### GET `/api/nodes`

获取所有节点的基本信息列表。

未登录访问时，`hidden=true` 的节点不会出现在结果中。该 HTTP 接口会固定清空敏感字段（如 `token`、`version`、私有 `remark`、`ipv4`、`ipv6`），主题如需更细粒度的节点信息与访客 IP 脱敏逻辑，建议使用 RPC2 `common:getNodes`。

**响应示例:**
```json
{
    "status": "success",
    "message": "",
    "data": [
        {
            "uuid": "4addbaf1-7ffb-474c-98ee-4ffd476755ff",
            "name": "Localhost",
            "cpu_name": "DO-Regular",
            "virtualization": "kvm",
            "arch": "amd64",
            "cpu_cores": 1,
            "cpu_physical_cores": 0,
            "os": "Debian GNU/Linux 12 (bookworm)",
            "kernel_version": "6.8.12-10-pve",
            "gpu_name": "Red Hat, Inc. Virtio 1.0 GPU (rev 01)",
            "region": "🇸🇬",
            "mem_total": 479670272,
            "swap_total": 2147479552,
            "disk_total": 10524137472,
            "weight": 0,
            "price": -1,
            "billing_cycle": 30,
            "auto_renewal": true,
            "currency": "$",
            "expired_at": "2026-04-13 00:00:00.0000000+00:00",
            "group": "新加坡",
            "tags": "",
            "hidden": false,
            "traffic_limit": 0,
            "traffic_limit_type": "max",
            "created_at": "2025-05-30 09:10:19.1305505+00:00",
            "updated_at": "2025-07-15 07:31:41.9808535+00:00"
        }
    ]
}
```

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `uuid` | string | 节点唯一标识符 |
| `name` | string | 节点名称 |
| `cpu_name` | string | CPU 名称 |
| `virtualization` | string | 虚拟化类型（如 kvm、lxc） |
| `arch` | string | 系统架构（如 amd64） |
| `cpu_cores` | number | CPU 逻辑核心数 |
| `cpu_physical_cores` | number | CPU 物理核心数，`0` 表示未上报或未知 |
| `os` | string | 操作系统信息 |
| `kernel_version` | string | 内核版本 |
| `gpu_name` | string | GPU 名称，无 GPU 时为 "None" |
| `region` | string | 地区（通常使用国旗表情符号） |
| `mem_total` | number | 总内存大小（字节） |
| `swap_total` | number | 交换分区大小（字节） |
| `disk_total` | number | 磁盘总大小（字节） |
| `weight` | number | 节点排序权重，数字越大越靠前 |
| `price` | number | 价格，-1 表示免费，0为未设置 |
| `billing_cycle` | number | 计费周期（天） |
| `auto_renewal` | boolean | 是否启用自动续费 |
| `currency` | string | 货币符号 |
| `expired_at` | string \| null | 过期时间 (如果为0001年则为未设置) |
| `group` | string | 节点分组 |
| `tags` | string | 节点标签，使用';'分隔 |
| `public_remark` | string | 面向公开展示的备注或说明 |
| `hidden` | boolean | 是否对未登录用户隐藏（true 表示隐藏） |
| `traffic_limit` | number | 流量限制（字节）。0 表示不限制 |
| `traffic_limit_type` | string | 流量限制类型，可能值：`max`、`min`、`sum`、`up`、`down` |
| `created_at` | string | 创建时间 |
| `updated_at` | string | 最后更新时间 |

## 节点1分钟状态

### GET `/api/recent/{uuid}`

获取指定节点最近1分钟的历史数据。

> **📝 数据结构说明：** 该接口返回的数据结构与实时WebSocket数据结构相同，使用嵌套对象格式（如 `cpu.usage`、`ram.total`），与历史记录接口的扁平化结构不同。

**路径参数:**
- `uuid` (string) - 节点的唯一标识符

**响应示例:**
```json
{
    "status": "success",
    "message": "",
    "data": [
        {
            "cpu": {
                "usage": 3.9603960398464686
            },
            "ram": {
                "total": 479670272,
                "used": 179847168
            },
            "swap": {
                "total": 2147479552,
                "used": 104382464
            },
            "load": {
                "load1": 0.07,
                "load5": 0.04,
                "load15": 0.01
            },
            "disk": {
                "total": 10524137472,
                "used": 6860439552
            },
            "network": {
                "up": 318,
                "down": 124,
                "totalUp": 9935855576,
                "totalDown": 32250973581
            },
            "connections": {
                "tcp": 59,
                "udp": 4
            },
            "uptime": 3975401,
            "process": 80,
            "message": "",
            "updated_at": "2025-07-15T07:32:34.566485833Z"
        }
    ]
}
```

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `cpu.usage` | number | CPU 使用率（百分比） |
| `ram.total` | number | 总内存大小（字节） |
| `ram.used` | number | 已使用内存大小（字节） |
| `swap.total` | number | 交换分区总大小（字节） |
| `swap.used` | number | 已使用交换分区大小（字节） |
| `load.load1` | number | 1分钟平均负载 |
| `load.load5` | number | 5分钟平均负载 |
| `load.load15` | number | 15分钟平均负载 |
| `disk.total` | number | 磁盘总大小（字节） |
| `disk.used` | number | 已使用磁盘大小（字节） |
| `network.up` | number | 上行网络速度（字节/秒） |
| `network.down` | number | 下行网络速度（字节/秒） |
| `network.totalUp` | number | 总上行流量（字节） |
| `network.totalDown` | number | 总下行流量（字节） |
| `connections.tcp` | number | TCP 连接数 |
| `connections.udp` | number | UDP 连接数 |
| `gpu` | object | GPU 明细，可选；无 GPU 数据时不返回 |
| `gpu.count` | number | GPU 设备数量 |
| `gpu.average_usage` | number | GPU 平均使用率（百分比） |
| `gpu.detailed_info` | array | GPU 设备明细数组 |
| `gpu.detailed_info[].name` | string | GPU 名称 |
| `gpu.detailed_info[].memory_total` | number | 显存总量（字节） |
| `gpu.detailed_info[].memory_used` | number | 已用显存（字节） |
| `gpu.detailed_info[].utilization` | number | GPU 使用率（百分比） |
| `gpu.detailed_info[].temperature` | number | GPU 温度（摄氏度） |
| `uptime` | number | 系统运行时间（秒） |
| `process` | number | 进程数量 |
| `message` | string | 消息或错误信息 |
| `updated_at` | string | 数据更新时间 |

该接口返回的数据数组包含最近1分钟内的多个数据点，用于展示节点的实时状态监控信息。

配合WebSocket `/api/clients`使用，可以额外多查看一点点信息。

## 负载历史记录

### GET `/api/records/load`

获取指定节点的负载历史记录。

> **📝 数据结构差异：** 历史记录数据采用扁平化结构（如 `cpu`、`ram`、`disk`），与实时数据的嵌套对象结构（如 `cpu.usage`、`ram.total`）不同。

**查询参数:**
- `uuid` (string，必填) - 节点的唯一标识符
- `hours` (number，可选) - 查询时间范围（小时），默认 `4`
- `load_type` (string，可选) - 指标筛选：`cpu` / `ram` / `swap` / `load` / `temp` / `disk` / `network` / `process` / `connections` / `all`；默认返回全部字段

**响应示例:**
```json
{
    "status": "success",
    "message": "",
    "data": {
        "count": 120,
        "records": [
            {
                "client": "4addbaf1-7ffb-474c-98ee-4ffd476755ff",
                "time": "2025-07-15T07:30:00.000Z",
                "cpu": 15.5,
                "gpu": 0,
                "ram": 179847168,
                "ram_total": 479670272,
                "swap": 104382464,
                "swap_total": 2147479552,
                "load": 0.07,
                "temp": 45.2,
                "disk": 6860439552,
                "disk_total": 10524137472,
                "net_in": 1024,
                "net_out": 2048,
                "net_total_up": 9935855576,
                "net_total_down": 32250973581,
                "process": 80,
                "connections": 59,
                "connections_udp": 4
            }
        ],
        "has_gpu_data": false
    }
}
```

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `count` | number | 记录总数 |
| `records` | array | 历史记录数组 |
| `load_type` | string | 仅在传入 `load_type` 且不为 `all` 时返回，表示本次筛选的指标 |
| `has_gpu_data` | boolean | 查询全部字段时可能返回，表示是否存在独立 GPU 设备历史数据 |
| `gpu_devices` | object | 存在独立 GPU 设备历史数据时返回，键为设备索引 |

**历史记录字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `client` | string | 节点UUID |
| `time` | string | 记录时间 |
| `cpu` | number | CPU 使用率（百分比） |
| `gpu` | number | GPU 使用率（百分比） |
| `ram` | number | 已使用内存大小（字节） |
| `ram_total` | number | 总内存大小（字节） |
| `swap` | number | 已使用交换分区大小（字节） |
| `swap_total` | number | 交换分区总大小（字节） |
| `load` | number | 系统负载 |
| `temp` | number | 温度（摄氏度） |
| `disk` | number | 已使用磁盘大小（字节） |
| `disk_total` | number | 磁盘总大小（字节） |
| `net_in` | number | 网络入站流量（字节/秒） |
| `net_out` | number | 网络出站流量（字节/秒） |
| `net_total_up` | number | 总上行流量（字节） |
| `net_total_down` | number | 总下行流量（字节） |
| `process` | number | 进程数量 |
| `connections` | number | TCP 连接数 |
| `connections_udp` | number | UDP 连接数 |

当传入 `load_type=ram`、`swap` 或 `disk` 时，过滤响应会额外返回对应的百分比字段：

| 字段 | 类型 | 描述 |
|------|------|------|
| `ram_percent` | number | 内存使用率（百分比），仅 `load_type=ram` |
| `swap_percent` | number | 交换分区使用率（百分比），仅 `load_type=swap` |
| `disk_percent` | number | 磁盘使用率（百分比），仅 `load_type=disk` |
| `connections_tcp` | number | TCP 连接数，等于 `connections - connections_udp`，仅 `load_type=connections` |

`gpu_devices` 的结构如下：

```json
{
    "0": {
        "device_index": 0,
        "device_name": "NVIDIA GeForce RTX 4090",
        "records": [
            {
                "client": "4addbaf1-7ffb-474c-98ee-4ffd476755ff",
                "time": "2025-07-15T07:30:00+00:00",
                "device_index": 0,
                "device_name": "NVIDIA GeForce RTX 4090",
                "mem_total": 25757220864,
                "mem_used": 2147483648,
                "utilization": 12.5,
                "temperature": 48
            }
        ]
    }
}
```

该接口用于获取节点的历史负载数据，可用于生成图表和分析节点性能趋势。

## Ping 历史记录

### GET `/api/records/ping`

::: warning 注意
此接口不会降采样数据，可能返回大量数据，影响性能。
推荐使用RPC2接口(`common:getRecords`)获取Ping历史数据，RPC2接口提供了更丰富的功能和更好的性能。
:::

获取指定节点或指定 Ping 任务的历史记录。

**查询参数:**
- `uuid` (string，可选) - 节点的唯一标识符
- `task_id` (number，可选) - Ping 任务 ID
- `hours` (number，可选) - 查询时间范围（小时），默认 `4`

`uuid` 和 `task_id` 至少需要提供一个：

- 仅 `uuid`：返回该节点参与的 Ping 任务记录。
- 仅 `task_id`：返回该任务下所有可见节点的记录。
- 同时提供：返回指定节点在指定任务下的记录。

**响应示例:**
```json
{
    "status": "success",
    "message": "",
    "data": {
        "count": 240,
        "records": [
            {
                "task_id": 1,
                "time": "2025-07-15T07:30:00.000Z",
                "value": 25,
                "client": "4addbaf1-7ffb-474c-98ee-4ffd476755ff"
            }
        ],
        "basic_info": [
            {
                "client": "4addbaf1-7ffb-474c-98ee-4ffd476755ff",
                "loss": 0,
                "min": 21,
                "max": 32
            }
        ],
        "tasks": [
            {
                "id": 1,
                "name": "百度",
                "type": "icmp",
                "interval": 30,
                "default_on": true,
                "loss": 1,
                "min": 21,
                "max": 32,
                "avg": 25,
                "total": 240
            }
        ]
    }
}
```

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `count` | number | 记录总数 |
| `records` | array | Ping 历史记录数组 |
| `basic_info` | array | 按节点聚合的统计信息；有记录时返回 |
| `tasks` | array | 相关任务信息数组 |

**Ping 历史记录字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `task_id` | number | 任务ID |
| `time` | string | 记录时间 |
| `value` | number | Ping 延迟值（毫秒）；`-1` 表示丢包 |
| `client` | string | 节点 UUID |

**BasicInfo 字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `client` | string | 节点 UUID |
| `loss` | number | 丢包率（百分比） |
| `min` | number | 最小延迟（毫秒） |
| `max` | number | 最大延迟（毫秒） |

**任务信息字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `id` | number | 任务ID |
| `name` | string | 任务名称 |
| `type` | string | 任务类型 |
| `interval` | number | 执行间隔（秒） |
| `default_on` | boolean | 新节点是否默认启用该任务 |
| `loss` | number | 丢包率（百分比） |
| `min` | number | 最小延迟（毫秒） |
| `max` | number | 最大延迟（毫秒） |
| `avg` | number | 平均延迟（毫秒） |
| `total` | number | 参与统计的记录数量 |
| `clients` | string[] | 仅在只按 `task_id` 查询时可能返回，表示任务关联的节点列表 |

该接口用于获取节点的 Ping 历史数据，可用于生成网络延迟图表和分析网络连接质量。

## Ping 任务列表

### GET `/api/task/ping`

获取公开的 Ping 任务配置列表。

**响应示例:**
```json
{
    "status": "success",
    "message": "",
    "data": [
        {
            "id": 1,
            "name": "百度",
            "clients": [
                "4addbaf1-7ffb-474c-98ee-4ffd476755ff"
            ],
            "default_on": true,
            "type": "icmp",
            "interval": 30
        }
    ]
}
```

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `id` | number | 任务 ID |
| `name` | string | 任务名称 |
| `clients` | string[] | 任务关联的节点 UUID 列表 |
| `default_on` | boolean | 新节点是否默认启用该任务 |
| `type` | string | 任务类型 |
| `interval` | number | 执行间隔（秒） |

## MJPEG 实时状态流

### GET `/api/mjpeg_live`

返回 `multipart/x-mixed-replace` MJPEG 图片流，由后端直接渲染节点状态表格。

**查询参数:**
- `lang` (string，可选) - 语言，支持 `en`、`zh` / `zh-CN`，默认 `en`
- `tz_offset` (number，可选) - 时区偏移小时数，例如 `8` 表示 `GMT+8`

::: warning 注意
该接口返回图片流，不使用 `{ status, message, data }` JSON 包装。首次使用且 `./data/font.ttf` 不存在时，后端会尝试下载字体；下载中或失败时会渲染提示图片。
:::

## 实时状态

### WebSocket `/api/clients`

通过WebSocket连接获取节点实时数据。连接建立后，发送字符串 `"get"` 可获取所有可见节点的最新数据；发送 `"get <uuid>"` 可只获取指定节点。

未登录访问时，`hidden=true` 的节点会被过滤。

> **📝 重要提示：** 实时数据的结构与历史记录数据结构不同。实时数据使用嵌套对象结构（如 `cpu.usage`），而历史记录数据使用扁平化结构（如 `cpu`）。在开发时请注意这一差异。

**连接方式:**
```javascript
const ws = new WebSocket('ws://your-domain/api/clients');
ws.onopen = function() {
    ws.send('get'); // 发送获取数据请求
};
```

**响应示例:**
```json
{
    "data": {
        "online": [
            "f3d7a9c3-d85e-4252-8b1d-43e237b093ce"
        ],
        "data": {
            "f3d7a9c3-d85e-4252-8b1d-43e237b093ce": {
                "cpu": {
                    "usage": 2.9411764704203933
                },
                "ram": {
                    "total": 458752000,
                    "used": 141033472
                },
                "swap": {
                    "total": 0,
                    "used": 0
                },
                "load": {
                    "load1": 0,
                    "load5": 0,
                    "load15": 0
                },
                "disk": {
                    "total": 5354089984,
                    "used": 1783477760
                },
                "network": {
                    "up": 0,
                    "down": 3026,
                    "totalUp": 259755642,
                    "totalDown": 2378066480
                },
                "connections": {
                    "tcp": 10,
                    "udp": 7
                },
                "uptime": 609849,
                "process": 104,
                "message": "",
                "updated_at": "2025-07-15T07:37:33.70221251Z"
            }
        }
    },
    "status": "success"
}
```

**字段说明:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `data.online` | string[] | 在线节点的UUID列表 |
| `data.data` | object | 节点实时数据对象，以UUID为键 |

**节点实时数据字段:**

| 字段 | 类型 | 描述 |
|------|------|------|
| `cpu.usage` | number | CPU 使用率（百分比） |
| `ram.total` | number | 总内存大小（字节） |
| `ram.used` | number | 已使用内存大小（字节） |
| `swap.total` | number | 交换分区总大小（字节） |
| `swap.used` | number | 已使用交换分区大小（字节） |
| `load.load1` | number | 1分钟平均负载 |
| `load.load5` | number | 5分钟平均负载 |
| `load.load15` | number | 15分钟平均负载 |
| `disk.total` | number | 磁盘总大小（字节） |
| `disk.used` | number | 已使用磁盘大小（字节） |
| `network.up` | number | 上行网络速度（字节/秒） |
| `network.down` | number | 下行网络速度（字节/秒） |
| `network.totalUp` | number | 总上行流量（字节） |
| `network.totalDown` | number | 总下行流量（字节） |
| `connections.tcp` | number | TCP 连接数 |
| `connections.udp` | number | UDP 连接数 |
| `gpu` | object | GPU 明细，可选；无 GPU 数据时不返回 |
| `gpu.count` | number | GPU 设备数量 |
| `gpu.average_usage` | number | GPU 平均使用率（百分比） |
| `gpu.detailed_info` | array | GPU 设备明细数组 |
| `gpu.detailed_info[].name` | string | GPU 名称 |
| `gpu.detailed_info[].memory_total` | number | 显存总量（字节） |
| `gpu.detailed_info[].memory_used` | number | 已用显存（字节） |
| `gpu.detailed_info[].utilization` | number | GPU 使用率（百分比） |
| `gpu.detailed_info[].temperature` | number | GPU 温度（摄氏度） |
| `uptime` | number | 系统运行时间（秒） |
| `process` | number | 进程数量 |
| `message` | string | 消息或错误信息 |
| `updated_at` | string | 数据更新时间 |





