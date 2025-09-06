# RPC2 接口

Komari 提供了一个 JSON-RPC2 接口。你可以通过 Websocket 或 POST 调用。

基础路径：`/api/rpc2`

[JSON-RPC2 调试工具](https://json-rpc2-debugger.pages.dev/)

:::warning 注意
仅 >=1.0.7 的版本可以使用 RPC2
:::

## 基础文档

[(译) JSON-RPC 2.0 规范(中文版) - wiki . leozvc](https://wiki.geekdream.com/Specification/json-rpc_2.0.html)

## 认证

- Cookie
- API Key

::: tip 提示
未登录也可使用，但某些方法将受到限制
:::

## 说明

Komari 参数传递支持指名和数组两种方式。

例如有 `func(a, b)`，参数传递可以使用 `{ "a": a, "b": b }` 或 `[a, b]`（顺序）。

## rpc.methods

描述：查看所有可用的 RPC 方法

参数：

| 参数名   | 类型 | 必填 | 说明                  |
| -------- | ---- | ---- | --------------------- |
| internal | bool | 否   | 是否显示 RPC 内置方法 |

返回：

| 返回值类型 | 描述                              |
| ---------- | --------------------------------- |
| `string[]` | 返回所有可用 RPC 方法的名称数组。 |

## rpc.help

描述：获取指定 RPC 方法的帮助信息

参数：
| 参数名 | 类型 | 必填 | 说明 |
| -------- | ------ | ---- | ------------------------- |
| method | string | 否 | 要获取帮助信息的方法名 |

返回：

| 返回值类型   | 描述                                   |
| ------------ | -------------------------------------- |
| `MethodMeta` | 返回指定方法的详细元数据（如有指定）。 |

### MethodMeta

| 字段        | 类型        | 说明           |
| ----------- | ----------- | -------------- |
| name        | string      | 方法名称       |
| summary     | string      | 方法简要说明   |
| description | string      | 方法详细描述   |
| params      | ParamMeta[] | 参数列表       |
| returns     | string      | 返回值类型说明 |

### ParamMeta

| 字段        | 类型   | 说明     |
| ----------- | ------ | -------- |
| name        | string | 参数名称 |
| type        | string | 参数类型 |
| description | string | 参数说明 |

## rpc.ping

描述：健康检查，返回 pong

参数：无

返回：

| 返回值类型 | 描述        |
| ---------- | ----------- |
| `string`   | 返回 "pong" |

## rpc.version

描述：返回当前 RPC 接口的版本号

参数：无

返回：

| 返回值类型 | 描述              |
| ---------- | ----------------- |
| `string`   | 返回 RPC 的版本号 |

## common:getNodes

描述：获取节点（客户端）信息。

当提供 `uuid` 时，返回对应单个节点的 `Client` 对象；未提供时返回形如 `{ [uuid]: Client }` 的对象，键为节点 UUID。

参数：

| 参数名 | 类型   | 必填 | 说明                    |
| ------ | ------ | ---- | ----------------------- |
| uuid   | string | 否   | 节点 UUID，留空返回全部 |

返回：

| 返回值类型                        | 描述                                       |
| --------------------------------- | ------------------------------------------ |
| `Client    \| { [uuid]: Client }` | 单个节点对象或以 uuid 作为键的节点对象集合 |

### Client

| 字段               | 类型      | 说明                                                     |
| ------------------ | --------- | -------------------------------------------------------- |
| uuid               | string    | 节点 UUID                                                |
| token              | string    | 节点访问令牌（未认证不显示）                             |
| name               | string    | 节点名称                                                 |
| cpu_name           | string    | CPU 型号                                                 |
| virtualization     | string    | 虚拟化类型                                               |
| arch               | string    | 系统架构（如 amd64, arm64）                              |
| cpu_cores          | int       | CPU 逻辑核心数                                           |
| os                 | string    | 操作系统名称                                             |
| kernel_version     | string    | 内核版本                                                 |
| gpu_name           | string    | GPU 名称（如有）                                         |
| ipv4               | string    | IPv4 地址（未认证不显示）                                |
| ipv6               | string    | IPv6 地址（未认证不显示）                                |
| region             | string    | 区域                                                     |
| remark             | string    | 私有备注（未认证不显示）                                 |
| public_remark      | string    | 公共备注（对外可见）                                     |
| mem_total          | int64     | 内存总量（字节）                                         |
| swap_total         | int64     | 交换分区总量（字节）                                     |
| disk_total         | int64     | 磁盘总量（字节）                                         |
| version            | string    | Agent 版本（未认证不显示）                               |
| weight             | int       | 节点排序权重                                             |
| price              | float64   | 价格（计费相关）                                         |
| billing_cycle      | int       | 计费周期（单位：天）                                     |
| auto_renewal       | bool      | 是否自动续费                                             |
| currency           | string    | 货币符号（默认 `$`）                                     |
| expired_at         | LocalTime | 到期时间                                                 |
| group              | string    | 分组名称                                                 |
| tags               | string    | 标签（以 `;` 分隔的字符串）                              |
| hidden             | bool      | 是否隐藏                                                 |
| traffic_limit      | int64     | 流量阈值（单位：字节，含义由 `traffic_limit_type` 决定） |
| traffic_limit_type | string    | 流量阈值类型：`sum` / `max` / `min` / `up` / `down`      |
| created_at         | LocalTime | 创建时间                                                 |
| updated_at         | LocalTime | 更新时间                                                 |

::: tip 提示
`Client` 中的单位（如内存、磁盘、流量）均为字节；需要可读格式请自行转换。
:::

## common:getPublicInfo

描述：获取公开的站点与运行配置信息。

参数：无

返回：

| 返回值类型   | 描述             |
| ------------ | ---------------- |
| `PublicInfo` | 公开站点配置对象 |

### PublicInfo

| 字段                      | 类型   | 说明                                                     |
| ------------------------- | ------ | -------------------------------------------------------- |
| allow_cors                | bool   | 是否允许 CORS（跨域）。                                  |
| custom_body               | string | 注入到页面 `<body>` 尾部的自定义 HTML 片段。             |
| custom_head               | string | 注入到页面 `<head>` 内的自定义 HTML（如样式 / 脚本）。   |
| description               | string | 站点描述。                                               |
| disable_password_login    | bool   | 是否禁用密码登录。                                       |
| oauth_enable              | bool   | 是否启用 OAuth 登录。                                    |
| oauth_provider            | string | 启用的 OAuth 提供商标识（如：`github`）。                |
| ping_record_preserve_time | int    | ping 记录保留时长（小时）。                              |
| private_site              | bool   | 是否为私有站点。                                         |
| record_enabled            | bool   | 是否启用监控记录。                                       |
| record_preserve_time      | int    | 监控记录保留时长（小时）。                               |
| sitename                  | string | 站点名称。                                               |
| theme                     | string | 当前主题 Short 名称。                                    |
| theme_settings            | object | 主题自定义配置（键值结构由具体主题定义，可能为空对象）。 |

::: tip 提示
`theme_settings` 结构会因主题而异；前端应做存在性与键名的容错处理。
:::

## common:getVersion

描述：获取后端版本与构建哈希。

参数：无

返回：

| 返回值类型    | 描述               |
| ------------- | ------------------ |
| `VersionInfo` | 版本与哈希信息对象 |

### VersionInfo

| 字段    | 类型   | 说明             |
| ------- | ------ | ---------------- |
| version | string | 版本号（如 dev） |
| hash    | string | 构建提交哈希     |

## common:getNodesLatestStatus

描述：获取一个或多个节点的最新运行状态。

参数：

| 参数名 | 类型     | 必填 | 说明                                         |
| ------ | -------- | ---- | -------------------------------------------- |
| uuid   | string   | 否   | 单个节点 UUID；与 `uuids` 二选一或都不填     |
| uuids  | string[] | 否   | 多个节点 UUID 列表；与 `uuid` 二选一或都不填 |

返回：

| 返回值类型               | 描述                                 |
| ------------------------ | ------------------------------------ |
| `{ [uuid]: NodeStatus }` | 以 uuid 作为键的节点最新状态对象集合 |

当同时为空时返回所有节点的最新状态；如仅指定部分 UUID，则仅返回对应条目。

### NodeStatus

| 字段            | 类型    | 说明                          |
| --------------- | ------- | ----------------------------- |
| client          | string  | 节点 UUID（客户端标识）       |
| time            | string  | 采集时间（ISO8601，UTC）      |
| cpu             | float64 | CPU 使用率（百分比，0-100）   |
| gpu             | float64 | GPU 使用率（百分比，0-100）   |
| ram             | int64   | 已用内存（字节）              |
| ram_total       | int64   | 内存总量（字节）              |
| swap            | int64   | 已用交换分区（字节）          |
| swap_total      | int64   | 交换分区总量（字节）          |
| load            | float64 | 1 分钟平均负载                |
| load5           | float64 | 5 分钟平均负载                |
| load15          | float64 | 15 分钟平均负载               |
| temp            | float64 | 温度（单位取决于平台/传感器） |
| disk            | int64   | 已用磁盘（字节）              |
| disk_total      | int64   | 磁盘总量（字节）              |
| net_in          | int64   | 瞬时入网速（字节/秒）         |
| net_out         | int64   | 瞬时出网速（字节/秒）         |
| net_total_up    | int64   | 自启动以来累计上传（字节）    |
| net_total_down  | int64   | 自启动以来累计下载（字节）    |
| process         | int64   | 进程数量                      |
| connections     | int64   | TCP 连接数                    |
| connections_udp | int64   | UDP 连接数                    |
| online          | bool    | 是否在线                      |

## common:getMe

描述：获取当前登录用户的基本信息与登录状态。

参数：无

返回：

| 返回值类型 | 描述                 |
| ---------- | -------------------- |
| `MeInfo`   | 当前登录用户信息对象 |

### MeInfo

| 字段        | 类型   | 说明                              |
| ----------- | ------ | --------------------------------- |
| 2fa_enabled | bool   | 是否启用两步验证                  |
| logged_in   | bool   | 是否已登录                        |
| sso_id      | string | SSO 用户 ID（未登录为空）         |
| sso_type    | string | SSO 类型（如 github，未登录为空） |
| username    | string | 用户名（未登录为空）              |
| uuid        | string | 用户 UUID（未登录为空）           |

## common:getNodeRecentStatus

描述：获取指定节点的最近状态记录列表。

参数：

| 参数名 | 类型   | 必填 | 说明      |
| ------ | ------ | ---- | --------- |
| uuid   | string | 是   | 节点 UUID |

返回：

| 返回值类型         | 描述                     |
| ------------------ | ------------------------ |
| `RecentStatusResp` | 包含总数与状态记录的对象 |

### RecentStatusResp

| 字段    | 类型           | 说明         |
| ------- | -------------- | ------------ |
| count   | int            | 记录总条数   |
| records | StatusRecord[] | 状态记录数组 |

### StatusRecord

| 字段            | 类型    | 说明                          |
| --------------- | ------- | ----------------------------- |
| client          | string  | 节点 UUID（客户端标识）       |
| time            | string  | 采集时间（ISO8601，UTC）      |
| cpu             | float64 | CPU 使用率（百分比，0-100）   |
| gpu             | float64 | GPU 使用率（百分比，0-100）   |
| ram             | int64   | 已用内存（字节）              |
| ram_total       | int64   | 内存总量（字节）              |
| swap            | int64   | 已用交换分区（字节）          |
| swap_total      | int64   | 交换分区总量（字节）          |
| load            | float64 | 1 分钟平均负载                |
| temp            | float64 | 温度（单位取决于平台/传感器） |
| disk            | int64   | 已用磁盘（字节）              |
| disk_total      | int64   | 磁盘总量（字节）              |
| net_in          | int64   | 瞬时入网速（字节/秒）         |
| net_out         | int64   | 瞬时出网速（字节/秒）         |
| net_total_up    | int64   | 累计上传（字节）              |
| net_total_down  | int64   | 累计下载（字节）              |
| process         | int64   | 进程数量                      |
| connections     | int64   | TCP 连接数                    |
| connections_udp | int64   | UDP 连接数                    |

## common:getRecords

描述：按时间范围获取历史记录（负载或 Ping）。支持单节点或所有节点、起止时间或相对窗口、指标筛选与结果限额。

参数：

| 参数名    | 类型   | 必填 | 说明                                                                                                                                                           |
| --------- | ------ | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| type      | string | 否   | 记录类型：`load` \| `ping`，默认 `load`                                                                                                                        |
| uuid      | string | 否   | 节点 UUID；留空表示所有节点                                                                                                                                    |
| hours     | int    | 否   | 时间窗口（单位：小时）。当未提供 `start`/`end` 时生效，默认 `1`                                                                                                |
| start     | string | 否   | 起始时间（RFC3339）。与 `end` 可选配合使用                                                                                                                     |
| end       | string | 否   | 结束时间（RFC3339）。与 `start` 可选配合使用                                                                                                                   |
| load_type | string | 否   | 当 `type=load` 时的指标筛选：`cpu` \| `gpu` \| `ram` \| `swap` \| `load` \| `temp` \| `disk` \| `network` \| `process` \| `connections` \| `all`（默认 `all`） |
| task_id   | int    | 否   | 当 `type=ping` 时的任务筛选；省略或 `-1` 表示所有任务                                                                                                          |
| maxCount  | int    | 否   | 返回数据点上限；默认 `4000`，`-1` 表示不限。用于控制下采样与负载                                                                                               |

返回：

::: tip 默认行为
若未提供 `uuid`、`type`、`hours`，则默认查询：所有客户端、`type=load`、最近 1 小时。
:::

- 公共字段：`count`（int），`from`（string, RFC3339），`to`（string, RFC3339）。
- `type=load`：
  - `uuid` 已提供：`records` 为 `StatusRecord[]`。
  - 未提供 `uuid`：`records` 为形如 `{ [uuid]: StatusRecord[] }` 的映射。
- `type=ping`：`records` 为 `PingRecord[]`，另含 `basic_info: BasicInfo[]`。

当 `load_type != all` 时，负载记录中仅包含所选指标及通用字段（`client`、`time`）。

### Load 结果结构

当指定 `uuid`：

| 字段    | 类型           | 说明                |
| ------- | -------------- | ------------------- |
| count   | int            | 总记录数            |
| records | StatusRecord[] | 负载历史记录数组    |
| from    | string         | 起始时间（RFC3339） |
| to      | string         | 结束时间（RFC3339） |

当未指定 `uuid`：

| 字段    | 类型                         | 说明                       |
| ------- | ---------------------------- | -------------------------- |
| count   | int                          | 总记录数（聚合统计参考值） |
| records | `{ [uuid]: StatusRecord[] }` | 不同节点的记录映射         |
| from    | string                       | 起始时间（RFC3339）        |
| to      | string                       | 结束时间（RFC3339）        |

注：`StatusRecord` 字段定义见上文“common:getNodeRecentStatus/StatusRecord”。

### Ping 结果结构

| 字段       | 类型         | 说明                |
| ---------- | ------------ | ------------------- |
| count      | int          | 总记录数            |
| basic_info | BasicInfo[]  | 各节点统计摘要      |
| records    | PingRecord[] | Ping 历史记录数组   |
| from       | string       | 起始时间（RFC3339） |
| to         | string       | 结束时间（RFC3339） |

#### BasicInfo

| 字段   | 类型   | 说明           |
| ------ | ------ | -------------- |
| client | string | 节点 UUID      |
| loss   | number | 丢包率（%）    |
| min    | number | 最小延迟（ms） |
| max    | number | 最大延迟（ms） |

#### PingRecord

| 字段    | 类型   | 说明                |
| ------- | ------ | ------------------- |
| task_id | int    | 任务 ID             |
| time    | string | 记录时间（RFC3339） |
| value   | number | 延迟值（毫秒）      |
| client  | string | 节点 UUID           |
