# RPC2 接口

Komari 提供了一个 JSON-RPC2 over WebSocket 接口。

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

| 参数名    | 类型   | 必填 | 说明                      |
| -------- | ------ | ---- | ------------------------- |
| internal | bool   | 否   | 是否显示 RPC 内置方法      |

返回：

| 返回值类型 | 描述                         |
| ---------- | ---------------------------- |
| `string[]` | 返回所有可用 RPC 方法的名称数组。 |

## rpc.help

描述：获取指定 RPC 方法的帮助信息

参数：
| 参数名    | 类型   | 必填 | 说明                      |
| -------- | ------ | ---- | ------------------------- |
| method   | string | 否   | 要获取帮助信息的方法名    |

返回：

| 返回值类型   | 描述                                   |
| ------------ | -------------------------------------- |
| `MethodMeta` | 返回指定方法的详细元数据（如有指定）。 |

### MethodMeta

| 字段         | 类型         | 说明                       |
| ------------ | ------------ | -------------------------- |
| name         | string       | 方法名称                   |
| summary      | string       | 方法简要说明               |
| description  | string       | 方法详细描述               |
| params       | ParamMeta[]  | 参数列表                   |
| returns      | string       | 返回值类型说明             |

### ParamMeta

| 字段         | 类型    | 说明           |
| ------------ | ------- | -------------- |
| name         | string  | 参数名称       |
| type         | string  | 参数类型       |
| description  | string  | 参数说明       |

## rpc.ping

描述：健康检查，返回 pong

参数：无

返回：

| 返回值类型 | 描述         |
| ---------- | ------------ |
| `string`   | 返回 "pong"  |

## rpc.version

描述：返回当前 RPC 接口的版本号

参数：无

返回：

| 返回值类型 | 描述                |
| ---------- | ------------------- |
| `string`   | 返回 RPC 的版本号   |