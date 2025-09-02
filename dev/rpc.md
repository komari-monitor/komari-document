# RPC2 接口

Komari 提供了一个 JSON-RPC2 接口。你可以通过 Websocket 或 POST 调用。

基础路径：`/api/rpc2`

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
| weight             | int       | 节点排序权重                        |
| price              | float64   | 价格（计费相关）                                         |
| billing_cycle      | int       | 计费周期（单位：天）                     |
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
