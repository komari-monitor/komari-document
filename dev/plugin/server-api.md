# server 模块与生命周期钩子

插件通过 `require("server")` 获取与宿主的桥接模块。该模块是插件系统注入的**原生
模块**，提供路由、钩子、RPC 调用与配置读取能力。

```js
const server = require("server");
```

| 方法 | 说明 | 权限 |
| --- | --- | --- |
| [`server.route(method, path, handler)`](#server-route) | 在宿主引擎注册 HTTP 路由 | `allowRoutes` |
| [`server.static(path, dir, opts)`](#server-static) | 挂载插件目录内的静态文件夹，可选 SPA 回退 | `allowRoutes` |
| [`server.hook(kind, matcher?, fn)`](#server-hook) | 注册请求/响应钩子 | `allowHooks` |
| [`server.injectHTML(head, body)`](#server-injecthtml) | 向每个 HTML 页面嵌入 CSS/JS | `allowHTMLInject` |
| [`server.call(method, params...)`](#server-call) | 以管理员身份调用系统 RPC | `allowSystemRPC` |
| [`server.registerRPC(method, handler)`](#server-registerrpc) | 注册插件自己的 RPC 方法 | 始终授予 |
| [`server.getConfig()`](#server-getconfig) | 读取配置（合并默认值） | 始终授予 |

`allowRoutes` / `allowHooks` / `allowHTMLInject` 缺失时在**加载时**抛 `TypeError`
（插件加载失败）；`allowSystemRPC` 缺失时 `server.call` 返回被拒绝的 Promise。

## 生命周期钩子

入口脚本的**顶层代码**在加载时立即执行，此外还可选定义两个全局函数：

```js
function load() {
  // 每次插件启用/启动时调用（包括服务端启动恢复）
}

function unload() {
  // 禁用、卸载或服务端关闭时调用
}
```

- `load()` 抛错（或顶层脚本抛错）→ 插件自动禁用，错误写入 `last_error`。
- `unload()` 的错误仅记录，不阻塞卸载。
- 不定义 `load()` 也是合法的，但推荐把注册路由/钩子/RPC 的逻辑放进 `load()`。
- `unload()` 期间插件已从实例表移除，此时 `server.call` 会以「not loaded」拒绝。

## server.route

注册一个 HTTP 路由到宿主 gin 引擎：

```js
server.route("GET", "/plug", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
});
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `method` | string | HTTP 方法，自动转大写，不能为空 |
| `path` | string | 路径，必须以 `/` 开头 |
| `handler` | (req, res) => void | 处理函数，必须调用 `res.end()` 结束响应 |

- 需要 `allowRoutes` 权限，否则加载时抛 `TypeError`。
- 路由槽位在卸载后保留（返回 404），重新加载后恢复；重复注册同一路由（同一次加载）
  为无操作。

### 请求对象 `req`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `method` | string | 请求方法，如 `"GET"` |
| `url` | string | 原始请求 URL（含查询串），如 `"/plug?x=7"` |
| `headers` | object | 请求头，键为**小写**名称，单值时字符串、多值为数组 |
| `query` | object | 查询参数，多值用 `,` 连接 |
| `body` | string | 请求体（已完整读取，受 `maxHTTPBodyBytes` 限制） |
| `context` | object | 请求上下文，见下 |

`context` 包含身份与来源信息：

```js
{
  principal: {           // 通过身份中间件时才有
    type: "agent" | "user" | "api_key" | "anonymous",
    roles: [...],
    user_uuid,
    client_uuid,
    is_api_key
  },
  role,                  // 用户角色
  user_uuid,             // 用户 UUID
  client_uuid,           // 节点 UUID（Agent 请求）
  remote_ip,             // 客户端 IP
  user_agent             // User-Agent
}
```

### 响应对象 `res`

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `statusCode` | number | 状态码，默认 `200`，可写 |
| `statusMessage` | string | 状态文本 |
| `streaming` | boolean | 置为 `true` 开启流式模式：每次 `write()` 立即发送 |
| `isAborted()` | () => boolean | 客户端断开（或流式空闲超时）后返回 `true` |
| `setHeader(name, value)` | 函数 | 设置响应头（`value` 可为字符串或数组） |
| `getHeader(name)` | 函数 | 读取响应头（单值字符串 / 多值数组 / undefined） |
| `removeHeader(name)` | 函数 | 删除响应头 |
| `write(data)` | (Buffer \| string) => boolean | 写入数据；非流式模式缓冲至 `end()` |
| `end([data])` | 函数 | **必须调用**以结束响应 |

::: warning 必须 end()
路由处理器若不调用 `res.end()`（且非流式模式），客户端会在 `timeout` 后收到
**504 `plugin route handler timed out`**。
:::

### 流式响应（SSE）

```js
server.route("GET", "/stream", async (req, res) => {
  res.streaming = true;
  res.setHeader("Content-Type", "text/event-stream");
  while (!res.isAborted()) {
    const data = ...; // 获取一帧数据
    res.write("data: " + data + "\n\n");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
});
```

- 设置 `res.streaming = true` 后，每次 `res.write()` 的内容立即 flush 给客户端。
- 客户端断开连接后 `isAborted()` 返回 `true`，脚本应退出循环并返回（处理器返回
  即结束）。
- 流式空闲超过 `timeout` 也会触发中止并关闭流。

## server.static

将插件目录内的一个**静态文件夹**挂载到指定路径，无需为每个文件编写处理器：

```js
server.static("/ui", "dist");
server.static("/app", "dist", { spa: true }); // SPA 模式
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `path` | string | 挂载路径，必须以 `/` 开头，不能是 `/`；结尾的 `/` 会被忽略 |
| `dir` | string | 插件目录内的相对文件夹（如 `"dist"`），必须存在 |
| `opts` | object | 可选；`{ spa: true }` 开启 SPA 回退 |

- 需要 `allowRoutes` 权限，否则加载时抛 `TypeError`。
- 支持 `GET` 与 `HEAD` 请求：`path` 本身返回目录下的 `index.html`，子路径返回
  对应文件；请求目录时回退到该目录内的 `index.html`。
- `spa: true` 时，**找不到文件**的请求回退到文件夹根的 `index.html`（前端路由
  刷新不再 404）；真实存在的文件仍然优先。
- 路径穿越（`..`）请求一律 404，文件解析被限定在 `dir` 内。
- 与 `server.route` 相同：挂载槽位在卸载后保留（返回 404），重新加载后恢复；
  同一次加载内重复挂载同一路径以最新参数为准。

## server.hook

在宿主的 HTTP 链上注册**请求钩子**或**响应钩子**。默认影响进入/离开服务端的**所有**
HTTP 请求（WebSocket 升级请求除外，它们直接穿透）；传入可选的路径过滤后只影响
匹配的请求（不匹配的请求完全跳过钩子链，不做 body 缓冲）：

```js
server.hook("request", (req) => {
  req.headers["x-hooked"] = "yes";
});

server.hook("response", "/api/*", (req, res) => {
  res.statusCode = 201;
  res.body = res.body + "|hooked";
});
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `kind` | `"request"` \| `"response"` | 钩子类型 |
| `matcher` | string（可选） | 路径过滤：`"/api/foo"`（精确）、`"/api/*"`（子树）、`"POST /api/foo"`（方法 + 路径）；大小写不敏感 |
| `fn` | function | 请求钩子 `fn(req)`；响应钩子 `fn(req, res)` |

需要 `allowHooks` 权限，否则加载时抛 `TypeError`。

### 请求钩子 `req`

```js
{
  method,                 // 可修改：将应用到真实请求
  url,                    // 可修改：将应用到真实请求
  headers,                // 可修改：将替换真实请求头
  query,                  // 查询参数（只读快照）
  body,                   // 可修改：将替换请求体
  context: { remote_ip, user_agent }   // 无身份信息（钩子在身份中间件之前运行）
}
```

- 请求体读取上限取匹配钩子所属插件声明的 `maxHTTPBodyBytes`（未声明时默认
  32 MiB）；超过上限的请求返回 `413`。
- 多个钩子按注册顺序依次执行；钩子抛错 → 客户端收到 `500 plugin request hook failed`，
  剩余钩子不再执行。
- 钩子执行受 `timeout` 限制，超时同样视为失败。

### 响应钩子 `res`

```js
{
  statusCode,             // 可修改
  statusMessage,          // 可修改
  headers,                // 可修改：将替换真实响应头
  body                    // 可修改：将替换响应体
}
```

- 响应默认被缓冲（上限 32 MiB）以便钩子改写。
- **改写 body 后原响应携带的 `Content-Length` 会被移除**，由 Go 重新计算长度
  （或回退到分块传输），避免客户端截断/挂起。
- **流式响应（SSE 等，第一次 `Flush()`）或超过 32 MiB 的响应直接穿透**，
  钩子无法再改写（有日志记录）。
- 钩子错误仅记录日志，不阻断响应。

## server.injectHTML

向**每个** `text/html` 响应嵌入自定义 CSS/JS：`head` 片段插入 `</head>` 之前，
`body` 片段插入 `</body>` 之前（大小写不敏感；无 `</head>` 时 `head` 置于文档开头，
无 `</body>` 时 `body` 追加到末尾）：

```js
server.injectHTML(
  "<style>.plugin-badge{color:red}</style>",
  '<script src="/api/mjpeg_live.js"></script>'
);
```

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `head` | string | 嵌入 `<head>` 的 HTML（样式表、`<style>`、`<meta>` 等），可为空串 |
| `body` | string | 嵌入 `<body>` 的 HTML（`<script>` 等），可为空串 |

- 作用于**全部** HTML 页面，包括 `/admin` 管理页、`/terminal` 终端页、登录页、
  公共页与插件 iframe 页（这些页面不受站点设置的 custom_head/custom_body 影响）。
- **非 HTML 响应不嵌入**：JSON、图片、字体、MJPEG/SSE 流等保持原样直通，不缓冲、
  不修改。
- 注入运行在插件响应钩子**之后**，看到的是钩子改写后的最终 HTML。
- 单次响应超过 32 MiB、流式响应（第一次 `Flush()`）或 WebSocket 升级请求直接
  穿透，不注入。
- 多个插件按注册顺序依次累加注入；卸载插件后其注入片段自动移除。
- 需要 `allowHTMLInject` 权限，否则加载时抛 `TypeError`。

## server.call

以**管理员身份**调用任意已注册的系统 RPC 方法：

```js
const result = await server.call("common:getNodes");
const status = await server.call("common:getNodesLatestStatus", { uuid: "..." });
```

| 参数 | 说明 |
| --- | --- |
| `method` | RPC 方法名，如 `common:getNodes`、`admin:getTasks` |
| `params...` | 参数。**0 个** → `null`；**1 个** → 直接作为参数；**多个** → 按位置编组为数组 |

返回一个 Promise：

- 成功 → resolve 为 RPC 结果。
- 失败 → reject 一个 Error，携带 JSON-RPC 错误字段：
  - `err.code`（整数）
  - `err.message`
  - `err.data`（可选）

::: warning 管理员权限
`server.call` 以 `RoleAdmin` 身份调用，等同于管理员在管理后台操作。`admin:exec`
等敏感操作同样可以直接调用。需要 `allowSystemRPC` 权限。
:::

全部可调用方法清单见 [RPC 接口](./rpc)。

## server.registerRPC

注册插件自己的 RPC 方法，供前端或其他插件（经 `server.call`）调用：

```js
server.registerRPC("plugin:greet", (params) => {
  return { echo: params, from: "example" };
});

server.registerRPC("plugin:fail", () => {
  const err = new Error("boom");
  err.code = -32045;
  err.data = { detail: "x" };
  throw err;
});
```

| 参数 | 说明 |
| --- | --- |
| `method` | 方法名，不能为空，不能以 `rpc.` 开头（保留前缀） |
| `handler` | `(params) => result`，返回结果或抛出错误 |

- **始终授予**，无需权限声明。
- 同一次加载内重复注册同名方法为无操作；卸载时自动注销。
- 处理器在插件事件循环上执行；抛出的 JS `Error` 映射为 JSON-RPC 错误
  （`err.code` / `err.message` / `err.data` 会被传递）。
- 建议使用 `plugin:<名称>:<动作>` 命名，避免与系统方法冲突。

## server.getConfig

读取插件的保存配置（与清单声明的默认值合并）：

```js
const config = await server.getConfig();
console.log(config.interval); // 已合并默认值
```

- 返回 Promise，resolve 为 `{ [key]: value }` 对象。
- 合并规则见 [清单文件参考 - 默认值合并规则](./manifest#默认值合并规则)。
- **始终授予**。
