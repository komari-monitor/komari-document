# RPC2 接口

Komari 提供了一个 JSON-RPC2 接口。你可以通过 Websocket 或 POST 调用。

基础路径：`/api/rpc2`

[JSON-RPC2 调试工具](https://json-rpc2-debugger.pages.dev/)

:::warning 注意
仅 >=1.0.7 的版本可以使用 RPC2
:::


> 如果你需要React的RPC2客户端，可以使用 [Komari RPC2客户端](https://github.com/Akizon77/nezha-dash-v1/blob/main/src/lib/rpc2.ts) 与 [Komari RPC2 Hook](https://github.com/Akizon77/nezha-dash-v1/blob/main/src/hooks/use-rpc2.tsx)，使用 `SharedClient().call(method, params)` 或 `useRPC2Call` 即可。


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
| cpu_physical_cores | int       | CPU 物理核心数，`0` 表示未上报或未知                     |
| os                 | string    | 操作系统名称                                             |
| kernel_version     | string    | 内核版本                                                 |
| gpu_name           | string    | GPU 名称（如有）                                         |
| ipv4               | string    | IPv4 地址（未认证不显示或部分显示）                         |
| ipv6               | string    | IPv6 地址（未认证不显示或部分显示）                         |
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
| cors_origin_check_enabled | bool   | 是否启用 CORS 跨域请求校验；开启后 API 请求只允许同源或允许列表中的地址，API Key 请求会绕过该校验。 |
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
| cpu             | float64 | CPU 使用率                   |
| gpu             | float64 | GPU 使用率                   |
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

## public:getMe

描述：获取当前登录用户；访客返回 Guest 占位信息。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `MeInfo` | 已登录时的用户信息；未登录时为 `{ username: "Guest", logged_in: false }` |

## public:getNodesInformation

描述：获取公开节点基本信息。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `Client[]` | 未登录时排除隐藏节点并清空 token、IP、私有备注和版本字段 |

## public:getPublicSettings

描述：获取公开站点设置。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `PublicInfo` | 结构见 `common:getPublicInfo` |

## public:getVersion

描述：获取服务端版本。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `VersionInfo` | 结构见 `common:getVersion` |

## public:getClientRecentRecords

描述：获取指定节点的运行时最近状态缓存。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| uuid | string | 是 | 节点 UUID；访客不能查询隐藏节点 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `Record[]` | 最近状态记录数组 |

## public:getRecordsByUUID

描述：按相对时间窗口获取一个节点的历史负载记录。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| uuid | string | 是 | 节点 UUID |
| load_type | string | 否 | `cpu`、`gpu`、`ram`、`swap`、`load`、`temp`、`disk`、`network`、`process`、`connections` 或 `all` |
| hours | string | 否 | 查询窗口（小时），默认 `4` |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `PublicLoadRecordsResp` | `records`、`count`；GPU 数据存在时额外返回 `gpu_devices`、`has_gpu_data` |

## public:getPingRecords

描述：按节点或任务获取 Ping 历史及统计。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| uuid | string | 二选一 | 节点 UUID |
| task_id | string | 二选一 | Ping 任务 ID |
| hours | string | 否 | 查询窗口（小时），默认 `4` |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `PublicPingRecordsResp` | `count`、`records`，并按条件返回 `basic_info`、`tasks` |

## public:getPublicPingTasks

描述：获取可公开的 Ping 任务。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `PublicPingTask[]` | `id`、`name`、`clients`、`default_on`、`type`、`interval` |

## public:listMetricDefinitions

描述：获取公开指标定义及保留策略。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `MetricDefinition[]` | 指标定义数组 |

## public:queryMetrics

描述：查询一个或多个指标的原始或服务端聚合时间序列。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| metric_key / metric_keys / metrics | string / string[] | 是 | 指标名，三种输入兼容 |
| entity_id / entity_ids | string / string[] | 否 | 节点 UUID；留空为所有可见节点 |
| start / start_time、end / end_time、hours | Time | 否 | 时间范围；未给出时最近 4 小时 |
| tags | object | 否 | 精确标签筛选 |
| downsample / server_downsample | bool | 否 | 是否服务端聚合，默认 `true` |
| fill_empty | bool | 否 | 是否填充空桶 |
| max_points / downsample_points | int | 否 | 单序列点数上限，默认 `500` |
| aggregation / downsample_algorithm / algorithm | string | 否 | 聚合算法，默认 `avg` |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `MetricQueryResp` | `start`、`end`、`series: MetricSeries[]`、`count`；完整字段见上文结构定义 |

## public:getPingMetricStats

描述：按节点和 Ping 任务计算延迟、丢包及分位数统计。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| uuid / entity_id / entity_ids | string / string[] | 否 | 节点筛选；留空为所有可见节点 |
| task_id / task_ids | string\|number / array | 否 | Ping 任务筛选 |
| start / start_time、end / end_time、hours | Time | 否 | 时间范围；未给出时最近 4 小时 |
| max_points / downsample_points | int | 否 | 聚合点数上限，默认 `500` |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `PingMetricStatsResp` | `start`、`end`、`interval_seconds`、`stats: PingMetricTaskStats[]`、`count` |

## client:getPingTasks

描述：获取分配给当前客户端的 Ping 任务。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `PingTask[]` | 当前客户端可执行的任务数组 |

## client:uploadPingResult

描述：上报当前客户端的 Ping 执行结果。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| task_id | uint | 是 | Ping 任务 ID |
| value | int | 是 | 延迟毫秒数；负值代表失败 |
| ping_type | string | 是 | 客户端协议兼容字段 |
| finished_at | RFC3339 | 是 | 完成时间 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| object | `{ status: "success" }` |

## client:taskResult

描述：上报当前客户端的远程命令执行结果。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| task_id | string | 是 | 任务 ID |
| result | string | 是 | 命令输出 |
| exit_code | int | 是 | 进程退出码 |
| finished_at | RFC3339 | 是 | 完成时间 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| object | `{ status: "success", message: string }` |

::: warning 权限
`admin:*` 方法仅允许管理员调用；`admin:exec` 还需要通过敏感操作二次验证。
:::

## admin:addClient

描述：创建节点。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | `string` | 否 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ uuid: string, token: string }` | 成功时返回该结构 |

## admin:editClient

描述：部分更新节点信息。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `ClientPatch`（必须含 `uuid`） | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:removeClient

描述：删除节点。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| uuid | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:getClient

描述：获取指定节点。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| uuid | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `Client` | 成功时返回该结构 |

## admin:listClients

描述：获取全部节点基本信息。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `Client[]` | 成功时返回该结构 |

## admin:getClientToken

描述：获取节点令牌。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| uuid | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ token: string }` | 成功时返回该结构 |

## admin:clearRecords

描述：清空负载历史记录。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null`（仅负载记录） | 成功时返回该结构 |

## admin:clearAllRecords

描述：清空负载与 Ping 历史记录。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null`（负载与 Ping 记录） | 成功时返回该结构 |

## admin:orderClients

描述：更新节点排序权重。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `{ [uuid: string]: number }` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:getSessions

描述：获取全部登录会话。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ current: string, data: Session[] }` | 成功时返回该结构 |

## admin:deleteSession

描述：删除指定会话。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| session | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:deleteAllSessions

描述：删除全部会话。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:getSettings

描述：获取全部系统设置。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ [key: string]: unknown }` | 成功时返回该结构 |

## admin:editSettings

描述：部分更新系统设置。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `{ [settingKey: string]: unknown }` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:addPingTask

描述：创建 Ping 任务。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| clients | `string[]` | 是 | - |
| default_on | `boolean` | 是 | - |
| name | `string` | 是 | - |
| target | `string` | 是 | - |
| type | `string` | 是 | - |
| interval | `number` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ task_id: uint }` | 成功时返回该结构 |

## admin:deletePingTask

描述：删除 Ping 任务。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | `uint[]` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:editPingTask

描述：批量更新 Ping 任务。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| tasks | `PingTask[]` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:getAllPingTasks

描述：获取全部 Ping 任务。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `PingTask[]` | 成功时返回该结构 |

## admin:orderPingTask

描述：更新 Ping 任务排序权重。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `{ [taskId: string]: number }` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:addLoadNotification

描述：创建负载通知规则。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| clients | `string[]` | 是 | - |
| name | `string` | 否 | - |
| metric | `string` | 是 | - |
| threshold | `number` | 是 | - |
| ratio | `number` | 是 | - |
| interval | `number` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ task_id: uint }` | 成功时返回该结构 |

## admin:deleteLoadNotification

描述：删除负载通知规则。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | `uint[]` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:editLoadNotification

描述：批量更新负载通知规则。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| notifications | `LoadNotification[]` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:getAllLoadNotifications

描述：获取全部负载通知规则。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `LoadNotification[]` | 成功时返回该结构 |

## admin:listOfflineNotifications

描述：获取离线通知配置。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `OfflineNotification[]` | 成功时返回该结构 |

## admin:editOfflineNotification

描述：批量更新离线通知配置。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `OfflineNotification[]` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:enableOfflineNotification

描述：为节点启用离线通知。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `string[]`（客户端 UUID）` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:disableOfflineNotification

描述：为节点禁用离线通知。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `string[]`（客户端 UUID）` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:listTrafficReportNotifications

描述：获取流量报告通知配置。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `TrafficReportNotification[]` | 成功时返回该结构 |

## admin:editTrafficReportNotifications

描述：批量更新流量报告通知配置。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `TrafficReportNotification[]` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:enableTrafficReportNotifications

描述：为节点启用流量报告。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `string[]`（客户端 UUID）` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:disableTrafficReportNotifications

描述：为节点禁用流量报告。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `string[]`（客户端 UUID）` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:getClipboard

描述：获取剪贴板条目。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `Clipboard` | 成功时返回该结构 |

## admin:listClipboard

描述：获取全部剪贴板条目。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `Clipboard[]` | 成功时返回该结构 |

## admin:createClipboard

描述：创建剪贴板条目。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| text | `string` | 是 | - |
| name | `string` | 是 | - |
| weight | `number` | 否 | - |
| remark | `string` | 否 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `Clipboard` | 成功时返回该结构 |

## admin:updateClipboard

描述：部分更新剪贴板条目。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | `string` | 是 | - |
| text | `string` | 否 | - |
| name | `string` | 否 | - |
| weight | `number` | 否 | - |
| remark | `string` | 否 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:deleteClipboard

描述：删除剪贴板条目。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| id | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:batchDeleteClipboard

描述：批量删除剪贴板条目。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| ids | `number[]` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:getTasks

描述：获取全部远程执行任务及结果。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `TaskWithResults[]` | 成功时返回该结构 |

## admin:getTaskById

描述：获取指定远程执行任务。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| task_id | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `TaskWithResults` | 成功时返回该结构 |

## admin:getTasksByClientId

描述：获取分配给节点的任务。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| uuid | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `Task[]` | 成功时返回该结构 |

## admin:getSpecificTaskResult

描述：获取任务在指定节点上的结果。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| task_id | `string` | 是 | - |
| uuid | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `TaskResult` | 成功时返回该结构 |

## admin:getTaskResultsByTaskId

描述：获取任务的全部节点结果。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| task_id | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `TaskResult[]` | 成功时返回该结构 |

## admin:getLogs

描述：分页获取审计日志。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| limit | `string` | 否 | - |
| page | `string` | 否 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ logs: Log[], total: number }` | 成功时返回该结构 |

## admin:exec

描述：在节点上执行命令。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| command | `string` | 是 | - |
| clients | `string[]` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ task_id: string, clients: string[], queued_clients: string[] }` | 成功时返回该结构 |

## admin:testSendMessage

描述：发送测试通知。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `null` | 成功时返回该结构 |

## admin:testGeoip

描述：测试 GeoIP 查询。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| ip | `string` | 否 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `GeoIPRecord` | 成功时返回该结构 |

## admin:getMessageSenderProvider

描述：获取消息发送器配置或模板。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| provider | `string` | 否 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `MessageSenderProvider` 或 `MessageSenderProvider[]` | 成功时返回该结构 |

## admin:setMessageSenderProvider

描述：保存消息发送器配置。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | `string` | 是 | - |
| addition | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ message: string }` | 成功时返回该结构 |

## admin:getOidcProvider

描述：获取 OIDC 配置或模板。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| provider | `string` | 否 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `OidcProvider` 或 `OidcProvider[]` | 成功时返回该结构 |

## admin:setOidcProvider

描述：保存 OIDC 配置。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | `string` | 是 | - |
| addition | `string` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ message: string }` | 成功时返回该结构 |

## admin:getXtermjsSettings

描述：获取终端设置。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `XtermJSSettings` | 成功时返回该结构 |

## admin:setXtermjsSettings

描述：保存并返回规范化后的终端设置。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| params | `XtermJSSettings` | 是 | 参数本身即为此类型或映射 |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `XtermJSSettings` | 返回保存后经过默认值补全与校验的终端设置 |

## admin:listMetricDefinitions

描述：获取指标定义与保留策略。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `MetricDefinition[]` | 成功时返回该结构 |

## admin:updateMetricDefinition

描述：更新指标保留天数。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| name | `string` | 是 | - |
| retention_days | `number` | 是 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `MetricDefinition` | 成功时返回该结构 |

## admin:getMetricMigrationStatus

描述：获取指标存储迁移进度。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `MetricMigrationStatus` | 成功时返回该结构 |

## admin:startMetricMigration

描述：启动指标存储迁移。

参数：

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| source_driver | `string` | 否 | - |
| source_dsn | `string` | 否 | - |

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ status: "started", message: string }` | 成功时返回该结构 |

## admin:cancelMetricMigration

描述：取消指标存储迁移。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `{ status: "canceled", message: string }` | 成功时返回该结构 |

## admin:getDatabaseSize

描述：获取主数据库与监控数据库存储状态。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `DatabaseStatus` | 成功时返回该结构 |

## admin:vacuumDatabase

描述：回收主数据库与监控数据库空间。

参数：无

返回：

| 返回值类型 | 描述 |
| --- | --- |
| `DatabaseMaintenanceResult` | 成功时返回该结构 |


## 数据结构

本节补充上述目录中尚未在前文定义的返回对象。时间类型均以 JSON 字符串返回，通常为 RFC3339。

### MetricQueryParams 与 MetricQueryResp

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| metric_key | string | 与 `metric_keys` / `metrics` 三选一 | 单个指标名 |
| metric_keys / metrics | string[] | 否 | 指标名列表；两者是兼容别名 |
| entity_id / entity_ids | string / string[] | 否 | 节点 UUID；留空查询全部可见节点 |
| start / start_time | RFC3339 或 Unix 时间 | 否 | 起始时间；两个字段互为别名 |
| end / end_time | RFC3339 或 Unix 时间 | 否 | 结束时间；默认当前时间 |
| hours | number | 否 | 未提供 `start` 时的窗口，默认 `4` |
| tags | object | 否 | 精确标签筛选 |
| downsample / server_downsample | boolean | 否 | 是否由服务端聚合，默认 `true` |
| downsample_by_metric / server_downsample_by_metric | object | 否 | `{ [metric: string]: boolean }` 覆盖项 |
| fill_empty | boolean | 否 | 聚合窗口空缺时是否补空点 |
| max_points / downsample_points | number | 否 | 单指标点数上限，默认 `500` |
| max_points_by_metric / points_by_metric | object | 否 | `{ [metric: string]: number }` 覆盖项 |
| aggregation / downsample_algorithm / algorithm | string | 否 | 聚合方式，默认 `avg`；别名均可用 |
| aggregation_by_metric / downsample_algorithm_by_metric / algorithm_by_metric | object | 否 | `{ [metric: string]: string }` 覆盖项 |

### MetricQueryResp

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| start / end | string | 实际查询范围（RFC3339Nano） |
| server_downsample_default | bool | 本次请求的全局下采样默认值 |
| default_points | int | 服务端默认点数，当前为 `500` |
| series | MetricSeries[] | 按指标、节点和标签拆分的序列 |
| count | int | 序列数量 |

### MetricSeries

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| metric_key / entity_id | string | 指标名 / 节点 UUID |
| type / unit | string | 指标类型 / 单位，可能省略 |
| retention_days | int | 保留天数，可能省略 |
| tag / tags | object | 序列标签；两个字段为兼容输出 |
| downsampled | bool | 是否已聚合 |
| downsample_algorithm | string | 聚合算法，原始查询时省略 |
| fill_empty | bool | 是否填充空桶 |
| max_points | int | 点数上限 |
| interval_seconds | float64 | 聚合桶宽（秒） |
| count | int | 点数 |
| points | MetricPoint[] | 数据点 |

### MetricPoint

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| time | string | 时间（RFC3339Nano） |
| value | float64 \| null | 数值；空桶或无效 Ping 值可为 `null` |
| count | int | 聚合桶内样本数；原始点省略 |
| tag / tags | object | 指标标签；可能省略 |
| labels | object | 原始点附加标签；聚合点省略 |

### PingMetricStatsParams 与 PingMetricStatsResp

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| uuid / entity_id | string | 否 | 单节点筛选，互为兼容字段 |
| entity_ids | string[] | 否 | 多节点筛选 |
| task_id | string \| number | 否 | 单任务筛选 |
| task_ids | (string \| number)[] | 否 | 多任务筛选 |
| start / start_time | Time | 否 | 起始时间，互为兼容字段 |
| end / end_time | Time | 否 | 结束时间，互为兼容字段 |
| hours | number | 否 | 未提供起始时间时的窗口，默认 `4` |
| max_points / downsample_points | int | 否 | 聚合点数上限，默认 `500` |

`Time` 可为 RFC3339、`2006-01-02 15:04:05` 或秒/毫秒/微秒/纳秒 Unix 时间。

### PingMetricStatsResp

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| start / end | string | 实际查询范围 |
| interval_seconds | float64 | 聚合桶宽（秒） |
| stats | PingMetricTaskStats[] | 节点、任务统计 |
| count | int | 统计项数量 |

### PingMetricTaskStats

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| entity_id / task_id | string | 节点 UUID / 任务 ID |
| name / type / interval | string / string / int | 任务名称、类型、间隔，找不到任务定义时省略 |
| tags | object | 至少包含 `task_id` |
| total / valid | int | 总样本数 / 有效样本数 |
| loss | float64 | 丢包率（百分比） |
| loss_approximate | bool | 是否由延迟负值估算丢包 |
| min / max / avg / latest | float64 | 延迟统计（毫秒），无有效样本时省略 |
| p50 / p99 / stddev | float64 | 分位数与标准差，无有效样本时省略 |
| p99_p50_ratio | float64 | P99 相对 P50 的抖动比率 |

### PingTask

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uint | 任务 ID；创建时可省略 |
| weight | int | 排序权重 |
| name | string | 任务名称 |
| clients | string[] | 指定节点 UUID |
| default_on | bool | 是否默认应用于节点 |
| type | string | `icmp`、`tcp` 或 `http` |
| target | string | 探测目标 |
| interval | int | 探测间隔（秒） |

### LoadNotification

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uint | 规则 ID |
| name | string | 规则名称 |
| clients | string[] | 节点 UUID |
| metric | string | 监控指标 |
| threshold | float32 | 触发阈值 |
| ratio | float32 | 窗口内达标比例，范围 `(0, 1]` |
| interval | int | 检测窗口（分钟），范围 `1-240` |
| last_notified | LocalTime | 最近通知时间 |

### OfflineNotification

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| client | string | 节点 UUID |
| client_info | Client | 节点信息，可能省略 |
| enable | bool | 是否启用 |
| grace_period | int | 离线宽限期（秒） |
| last_notified | LocalTime | 最近通知时间 |

### TrafficReportNotification

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| client | string | 节点 UUID |
| client_info | Client | 节点信息，可能省略 |
| enable | bool | 是否启用 |
| daily | bool | 是否发送日报 |
| weekly | bool | 是否发送周报 |
| monthly | bool | 是否发送月报 |

### Clipboard

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 条目 ID |
| text | string | 内容 |
| name | string | 名称 |
| weight | int | 排序权重 |
| remark | string | 备注 |
| created_at | LocalTime | 创建时间 |
| updated_at | LocalTime | 更新时间 |

### Task

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| task_id | string | 任务 ID |
| clients | string[] | 目标节点 UUID |
| command | string | 执行命令 |
| results | TaskResult[] | 任务结果；部分接口不预加载此字段 |

### TaskResult

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| task_id | string | 任务 ID |
| client | string | 节点 UUID |
| client_info | Client | 节点信息，可能省略 |
| result | string | 命令输出 |
| exit_code | int \| null | 退出码；未完成时为 `null` |
| finished_at | LocalTime \| null | 完成时间；未完成时为 `null` |
| created_at | LocalTime | 创建时间 |

### TaskWithResults

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| task_id | string | 任务 ID |
| clients | string[] | 目标节点 UUID |
| command | string | 执行命令 |
| results | TaskResultSummary[] | 节点执行结果 |

`TaskResultSummary` 包含 `client`、`result`、`exit_code`、`finished_at`、`created_at`，不包含 `task_id` 与 `client_info`。

### Session

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| uuid | string | 用户 UUID |
| session | string | 会话令牌 |
| user_agent | string | 登录时 User-Agent |
| ip | string | 登录 IP |
| login_method | string | 登录方式 |
| latest_online | LocalTime | 最近在线时间 |
| latest_user_agent | string | 最近 User-Agent |
| latest_ip | string | 最近 IP |
| expires | LocalTime | 过期时间 |
| created_at | LocalTime | 创建时间 |

### Log

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uint | 日志 ID |
| ip | string | 来源 IP |
| uuid | string | 操作者 UUID |
| message | string | 日志内容 |
| msg_type | string | 日志级别 |
| time | LocalTime | 记录时间 |

### MessageSenderProvider / OidcProvider

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| name | string | 提供者名称 |
| addition | string | JSON 格式的提供者配置 |

### XtermJSSettings

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| terminalOptions | TerminalOptions \| null | xterm.js 选项 |
| terminalPadding | int \| null | 终端内边距 |
| transparentBackground | bool | 是否启用透明背景 |
| customCss | string | 自定义 CSS |

### TerminalOptions

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| cursorBlink | bool \| null | 光标是否闪烁 |
| convertEol | bool \| null | 是否转换换行符 |
| fontFamily | string | 字体族 |
| fontSize | int | 字号 |
| macOptionIsMeta | bool \| null | macOS Option 是否作为 Meta |
| scrollback | int \| null | 回滚行数 |
| theme | ThemeConfig \| null | 颜色主题 |

### ThemeConfig

支持 `foreground`、`background`、`cursor`、`cursorAccent`、`selectionForeground`、`selectionBackground`、`selectionInactiveBackground`，以及 `black`、`red`、`green`、`yellow`、`blue`、`magenta`、`cyan`、`white` 和对应的 `bright*` 颜色字段；这些字段均为 `string`。`extendedAnsi` 为扩展 ANSI 颜色的 `string[]`。

### MetricDefinition

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| name | string | 指标名称 |
| description | string \| object | 描述文本或多语言描述映射 |
| type | string | 指标类型 |
| unit | string | 单位，可能省略 |
| retention_days | int | 原始数据保留天数 |
| metadata | object | `{ [key: string]: string }`，可能省略 |
| created_at | LocalTime | 创建时间，可能省略 |
| updated_at | LocalTime | 更新时间，可能省略 |

### MetricMigrationStatus

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| status | string | `idle`、`running`、`completed`、`failed` 或 `canceled` |
| is_running | bool | 当前是否正在迁移 |
| source_driver / target_driver | string | 源库 / 目标库驱动 |
| source_dsn / target_dsn | string | 已脱敏的源库 / 目标库 DSN |
| total_metrics / metrics_done | int | 指标总数 / 已完成数 |
| current_metric | string | 当前指标 |
| migrated_points | int64 | 已迁移采样点数 |
| start_time / end_time | LocalTime | 开始 / 结束时间 |
| error | string | 失败原因 |

### DatabaseStatus

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| type | string | 主数据库驱动（兼容字段） |
| size | int64 | 主数据库大小（兼容字段） |
| main | DatabaseStorageStatus | 主数据库状态 |
| monitoring | DatabaseStorageStatus | 监控数据库状态 |
| local_total | int64 \| null | 两个数据库都位于本地时的总大小 |

`DatabaseStorageStatus` 包含 `driver: string`、`location: "local" | "external" | ""`、`size: int64 | null`、`action: string`、`error?: string`。

### DatabaseMaintenanceResult

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| before / after / size | int64 | 主数据库维护前 / 后大小及兼容大小字段 |
| all_succeeded | bool | 两个数据库是否都维护成功 |
| main | DatabaseMaintenanceItem | 主数据库维护结果 |
| monitoring | DatabaseMaintenanceItem | 监控数据库维护结果 |

`DatabaseMaintenanceItem` 包含 `driver: string`、`action: string`、`before: int64 | null`、`after: int64 | null`、`success: bool`、`error?: string`、`size_error?: string`。

### PublicLoadRecordsResp

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| records | Record[] \| Partial\<Record\>[] | 历史记录；筛选指标时只包含通用字段和所选指标 |
| count | int | 记录数量 |
| load_type | string | 实际筛选指标，未筛选时省略 |
| gpu_devices | object | 以设备索引为键，值为 `{ device_index, device_name, records: GPURecord[] }` |
| has_gpu_data | bool | 是否存在 GPU 明细数据 |

### Record

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| client | string | 节点 UUID |
| time | LocalTime | 采集时间 |
| cpu / gpu | float32 | CPU / GPU 使用率 |
| ram / ram_total | int64 | 已用 / 总内存（字节） |
| swap / swap_total | int64 | 已用 / 总交换空间（字节） |
| load / temp | float32 | 系统负载 / 温度 |
| disk / disk_total | int64 | 已用 / 总磁盘（字节） |
| net_in / net_out | int64 | 入站 / 出站速率（字节/秒） |
| net_total_up / net_total_down | int64 | 累计上传 / 下载（字节） |
| traffic_up / traffic_down | int64 | 本采样周期上传 / 下载（字节） |
| process | int | 进程数 |
| connections / connections_udp | int | 总连接数 / UDP 连接数 |

### GPURecord

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| client | string | 节点 UUID |
| time | LocalTime | 采集时间 |
| device_index | int | GPU 设备索引 |
| device_name | string | GPU 名称 |
| mem_total / mem_used | int64 | 总显存 / 已用显存（字节） |
| utilization | float32 | GPU 使用率 |
| temperature | int | 温度（摄氏度） |

### PublicPingRecordsResp

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| count | int | 记录数量 |
| basic_info | PingClientStats[] | 按节点汇总，可能省略 |
| records | PublicPingRecord[] | Ping 历史记录 |
| tasks | PublicPingTaskStats[] | 按任务汇总，可能省略 |

`PingClientStats` 包含 `client: string`、`loss: float64`、`min: int`、`max: int`。`PublicPingRecord` 包含 `task_id?: uint`、`time: string`、`value: int`、`client?: string`。`PublicPingTaskStats` 包含 `id`、`name`、`type`、`interval`、`default_on`、可选的 `clients`，以及 `loss`、`min`、`max`、`avg`、`total`。

### PublicPingTask

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | uint | 任务 ID |
| name | string | 任务名称 |
| clients | string[] | 指定节点 UUID |
| default_on | bool | 是否默认启用 |
| type | string | 任务类型 |
| interval | int | 探测间隔（秒） |
