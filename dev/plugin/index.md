# 插件开发指南

## 说明

Komari 支持通过 **JavaScript 插件** 扩展服务端能力。插件是一个 ZIP 包，包含清单文件（`komari-plugin.json`）和入口脚本（默认 `script.js`）。插件在服务端进程中运行于独立的 goja JS 运行时（沙箱），可以注册 HTTP 路由、拦截 HTTP 请求/响应、调用系统 RPC、注册自己的 RPC 方法、声明配置项并注入管理页面。

::: warning 安全提示
插件将继承 Komari 的系统权限，且可能申请访问文件系统、执行子进程、监听端口等敏感能力。只安装你信任的插件；安装第三方插件前请仔细阅读其声明的权限。
:::

## 目录

- [1. 快速开始](#1-快速开始)
- [2. 插件包与清单](#2-插件包与清单)
- [3. 生命周期接口](#3-生命周期接口)
- [4. JavaScript 运行时与兼容模块](#4-javascript-运行时与兼容模块)
- [5. `server` 模块](#5-server-模块)
- [6. 插件页面](#6-插件页面)
- [7. 插件配置](#7-插件配置)
- [8. 插件自有 RPC](#8-插件自有-rpc)
- [9. 插件管理 HTTP 接口](#9-插件管理-http-接口)
- [10. 权限、限制与错误](#10-权限限制与错误)

## 1. 快速开始

### 1.1 使用 `npm create komari-plugin`

除了手动编写插件外，也可以通过官方脚手架快速创建项目：

```sh
npm create komari-plugin
```

该模板提供以下常用开发能力：

- **插件热更新**：`npm run dev` 会监听源码和 manifest，自动构建、打包、上传并重新启用插件，文件变更后无需手动重复安装。
- **日志跟踪**：开发命令会持续输出插件运行时日志，便于直接查看加载结果和运行错误。
- **类型提示**：模板使用 TypeScript 和 `@komari-monitor/plugin-sdk`，提供接口类型、参数提示和 manifest 字段补全。
- **本地开发配置**：开发服务器地址和 API Key 保存在 `komari.local.json` 中，该文件默认被 Git 忽略；不要提交。

使用模板需要 Node.js 20 或更高版本，以及一个可访问的 Komari 开发服务器和管理员 API Key。

生成的项目结构大致如下：

```text
hello/
├── src/plugin.ts          # TypeScript 插件源码
├── komari-plugin.json     # 插件清单
├── komari.local.json      # 本地服务器地址和 API Key，不要提交
├── package.json
└── tsconfig.json
```

SDK 示例：

```ts
import { definePlugin, jsonResponse, server } from "@komari-monitor/plugin-sdk";

definePlugin({
  load() {
    server.route("GET", "/hello", (_req, res) => {
      jsonResponse(res, { ok: true });
    });
  },
});
```

### 1.2 手动编写最小插件

插件包是一个 ZIP，根目录必须包含 `komari-plugin.json`，入口脚本默认为 `script.js`：

```text
my-plugin.zip
├── komari-plugin.json
└── script.js
```

`komari-plugin.json`：

```json
{
  "name": "Hello Plugin",
  "short": "hello-plugin",
  "description": "Minimal Komari plugin",
  "author": "Example",
  "version": "1.0.0",
  "entry": "script.js",
  "permissions": {
    "timeout": 30
  }
}
```

`script.js`：

```js
const server = require("server");

function load() {
  console.log("hello plugin loaded");
}

function unload() {
  console.log("hello plugin unloaded");
}
```

## 2. 插件包与清单

### 2.1 插件包结构

```text
<plugin>.zip
├── komari-plugin.json            # 必需，且必须位于 ZIP 根目录
├── script.js                     # 默认入口
├── pages/                        # 可选的 iframe 页面及静态资源
│   └── admin.html
└── assets/
```

归档限制：

| 限制              | 当前值  |
| ----------------- | ------- |
| 最大文件数        | 10000   |
| 单文件解压后大小  | 128 MiB |
| 总解压后大小      | 512 MiB |
| manifest 最大大小 | 1 MiB   |

### 2.2 `komari-plugin.json` 字段

| 字段            | 类型                              | 必填 | 默认        | 说明                                                                       |
| --------------- | --------------------------------- | ---- | ----------- | -------------------------------------------------------------------------- |
| `name`          | `string \| Record<string,string>` | 是   | -           | 插件名称；支持纯字符串或多语言对象，例如 `{"zh_CN":"示例","en":"Example"}` |
| `short`         | `string`                          | 是   | -           | 插件短名；只允许字母、数字、`_`、`-`，不能为 `default`，同时作为目录名     |
| `description`   | `string \| Record<string,string>` | 否   | -           | 插件描述                                                                   |
| `author`        | `string \| Record<string,string>` | 否   | -           | 作者                                                                       |
| `version`       | `string`                          | 否   | -           | 插件版本；市场安装时会与目录 catalog 的版本比对                            |
| `url`           | `string`                          | 否   | -           | 插件主页或源码地址                                                         |
| `icon`          | `string`                          | 否   | -           | 插件图标；相对插件目录的文件路径                                           |
| `komari`        | `string`                          | 否   | -           | Komari 版本约束，例如 `>=0.0.1`、`1.2.3`                                   |
| `entry`         | `string`                          | 否   | `script.js` | 入口脚本；必须是插件目录内的相对路径                                       |
| `permissions`   | `PluginPermissions`               | 否   | 零值        | 运行时权限和限制                                                           |
| `configuration` | `Configuration`                   | 否   | -           | 配置项声明，格式与主题配置相同                                             |
| `pages`         | `PluginPage[]`                    | 否   | -           | 插件页面声明                                                               |

`komari` 约束支持：

| 写法      | 含义     |
| --------- | -------- |
| 空字符串  | 不限制   |
| `x.y.z`   | 精确匹配 |
| `>=x.y.z` | 大于等于 |
| `>x.y.z`  | 大于     |
| `<=x.y.z` | 小于等于 |
| `<x.y.z`  | 小于     |

版本号可选择带前导 `v`，最多三段数字。

### 2.3 `permissions` 字段

| 字段                  | 类型      | 默认       | 是否审批 | 说明                                                      |
| --------------------- | --------- | ---------- | -------- | --------------------------------------------------------- |
| `node`                | `boolean` | `false`    | 否       | 启用 Node.js 兼容模块                                     |
| `allowSystemRPC`      | `boolean` | `false`    | 是       | 允许 `server.call()` 以管理员身份调用系统 RPC             |
| `allowRoutes`         | `boolean` | `false`    | 是       | 允许 `server.route()` 和 `server.static()`                |
| `allowHooks`          | `boolean` | `false`    | 是       | 允许 HTTP 和 WebSocket hooks                              |
| `allowHTMLInject`     | `boolean` | `false`    | 是       | 允许 `server.injectHTML()` 向 HTML 响应注入片段           |
| `allowExec`           | `boolean` | `false`    | 是       | 允许 `child_process` 执行子进程                           |
| `allowListen`         | `boolean` | `false`    | 是       | 允许 `net` / `http` server 监听本地端口                   |
| `allowAllFileAccess`  | `boolean` | `false`    | 是       | 允许访问插件目录外部文件                                  |
| `maxHTTPBodyBytes`    | `integer` | `33554432` | 否       | fetch 响应体、HTTP server 请求体和 route 请求体的缓冲上限 |
| `maxChildOutputBytes` | `integer` | `1048576`  | 否       | 子进程 stdout/stderr 的单项缓冲上限                       |
| `timeout`             | `integer` | `30`       | 否       | 单次执行轮次超时，单位秒                                  |

权限变更会使已保存的审批哈希失效，再次启用时必须重新审批。

### 2.4 `configuration` 字段

详见：[托管配置（Managed Configuration）](../managed-config.md)。

如何获取保存的托管配置内容？[调用 server.getConfig()](#58-servergetconfig)

示例：

```json
{
  "type": "managed",
  "data": [
    {
      "key": "endpoint",
      "name": "Endpoint",
      "required": true,
      "type": "string",
      "default": "https://example.com"
    },
    {
      "key": "enabled",
      "name": "Enabled",
      "type": "switch",
      "default": true
    }
  ]
}
```

### 2.5 `pages` 字段

| 字段         | 类型                              | 必填            | 默认       | 说明                                                    |
| ------------ | --------------------------------- | --------------- | ---------- | ------------------------------------------------------- |
| `file`       | `string`                          | `iframe` 时是   | -          | 插件目录内的相对 HTML 文件；`redirect` 类型不使用       |
| `title`      | `string \| Record<string,string>` | 是              | -          | 页面标题                                                |
| `icon`       | `string`                          | 否              | -          | 页面图标；相对插件目录路径                              |
| `type`       | `"iframe" \| "redirect"`          | 否              | `"iframe"` | 页面呈现方式                                            |
| `url`        | `string`                          | `redirect` 时是 | -          | 站内绝对路径，必须以 `/` 开头，禁止 `//`、反斜杠和 `..` |
| `visibility` | `"admin" \| "public"`             | 否              | `"admin"`  | 页面访问范围                                            |

`visibility: "public"` 仅对 `iframe` 页面生效，并通过 `/api/plugin/:short/*filepath` 无鉴权提供；只允许访问该页面所在目录及其子目录。

详细说明见[插件页面](#6-插件页面)。

### 2.6 清单安装示例

```json
{
  "name": {
    "zh_CN": "状态扩展",
    "en": "Status Extension"
  },
  "short": "status-extension",
  "description": "Adds a status endpoint and an admin page",
  "author": "Example",
  "version": "1.2.0",
  "url": "https://example.com/status-extension",
  "icon": "assets/icon.png",
  "komari": ">=0.0.1",
  "entry": "script.js",
  "permissions": {
    "node": true,
    "allowRoutes": true,
    "allowHooks": true,
    "allowHTMLInject": true,
    "allowSystemRPC": true,
    "timeout": 30,
    "maxHTTPBodyBytes": 33554432
  },
  "configuration": {
    "type": "managed",
    "data": [
      {
        "key": "message",
        "name": "Message",
        "type": "string",
        "default": "hello"
      }
    ]
  },
  "pages": [
    {
      "file": "pages/admin.html",
      "title": "Status",
      "icon": "assets/icon.png",
      "type": "iframe",
      "visibility": "admin"
    },
    {
      "file": "pages/public.html",
      "title": "Public status",
      "type": "iframe",
      "visibility": "public"
    }
  ]
}
```

## 3. 生命周期接口

插件入口脚本不是 CommonJS wrapper；顶层直接执行。运行时只识别可选的全局函数 `load` 和 `unload`。

### 3.1 `load()`

**说明：** 插件加载完成后调用一次，用于注册路由、hook、注入片段、cron、RPC 和初始化资源。

**参数：** 无。

**返回：** 无返回值要求；可以返回 `undefined`，也可以返回 Promise。返回 Promise 时，运行时会等待它完成。

**调用方：** Komari 插件管理器。

**示例：**

```js
const server = require("server");

function load() {
  console.log("plugin loaded");
  server.registerRPC("plugin:hello", () => ({ ok: true }));
}
```

异步示例：

```js
const server = require("server");

async function load() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  server.registerRPC("plugin:hello", () => ({ ok: true }));
}
```

`load()` 抛错或 Promise reject 会导致插件加载失败，插件会被自动禁用，并记录 `last_error`。

### 3.2 `unload()`

**说明：** 插件卸载前调用一次，用于主动释放插件自建资源。Komari 会自动注销该插件注册的 hook、HTML 注入、cron 和 RPC 方法。

**参数：** 无。

**返回：** 无返回值要求；可以返回 `undefined`，也可以返回 Promise。返回 Promise 时，运行时会等待它完成。

**调用方：** Komari 插件管理器。

**示例：**

```js
let timer = null;

function load() {
  timer = setInterval(() => console.log("tick"), 1000);
}

async function unload() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
}
```

`unload()` 抛错或 Promise reject 会被报告，但仍继续执行管理器侧的清理流程。

## 4. JavaScript 运行时与兼容模块

插件运行在独立的 goja JavaScript 运行时中，支持 CommonJS `require()`、Promise/async-await、事件循环和常用 Web API。它不是浏览器，也不是完整 Node.js；同名接口不一定具备与浏览器或 Node.js 完全一致的行为。

无需额外权限即可使用：

| 类别 | 内容 |
| --- | --- |
| 基础接口 | `console`、`setTimeout/setInterval/setImmediate` 及对应 `clear`、`queueMicrotask` |
| 网络请求 | `fetch`、`XMLHttpRequest` |
| 常驻模块 | `buffer`、`url`、`util` |
| 文件访问 | plugin 代码目录和 `data/plugin-data/<short>`；后者通过 `__storageDir__` 访问（需 `node: true`） |

在 manifest 中设置 `permissions.node: true` 后，运行时还会注入 `Buffer`、`process`、`global`、`__dirname`、`__filename`，并提供以下 Node.js 兼容模块：

| 模块 | 说明 |
| --- | --- |
| `events`、`stream`、`path`、`os`、`process` | 事件、流、路径、系统信息和进程接口 |
| `fs` | 文件读写；默认限制在插件代码目录和 `__storageDir__`，越界需要 `allowAllFileAccess` |
| `child_process` | 执行子进程；需要 `allowExec` |
| `net`、`http` | TCP/HTTP；Server 监听端口需要 `allowListen`，默认绑定 `127.0.0.1` |
| `crypto` | 哈希、随机数、密钥派生、AES/ChaCha20-Poly1305 和常用签名验签 |

运行时当前不提供浏览器 DOM、`WebSocket`、`EventSource`、Web Streams、ESM `import/export`，也不提供完整的 `https`、`tls`、`dns`、`zlib`、`worker_threads` 等 Node 核心模块。`process.memoryUsage()`、`cpuUsage()` 等指标反映整个 Komari 进程，不是单个插件的资源占用。

## 5. `server` 模块

```js
const server = require("server");
```

### 5.1 `server.route(method, path, handler)`

**说明：** 在 Komari HTTP engine 上注册路由。

**权限：** `allowRoutes`。

**参数：**

| 参数      | 类型                                  | 必填 | 说明                                                              |
| --------- | ------------------------------------- | ---- | ----------------------------------------------------------------- |
| `method`  | `string`                              | 是   | HTTP 方法，会转为大写；不能为空                                   |
| `path`    | `string`                              | 是   | 路由路径，必须以 `/` 开头                                         |
| `handler` | `(req, res) => void \| Promise<void>` | 是   | 请求处理器；可以返回 Promise，但必须最终调用 `res.end()` 完成响应 |

**返回：** `undefined`。

**`req` 对象：**

| 字段      | 类型                                | 说明                             |
| --------- | ----------------------------------- | -------------------------------- |
| `method`  | `string`                            | 请求方法                         |
| `url`     | `string`                            | 请求 URI，包含 query             |
| `headers` | `Record<string,string \| string[]>` | 请求头；键为小写                 |
| `query`   | `Record<string,string>`             | query 参数；同名多个值以逗号连接 |
| `body`    | `string`                            | 请求体文本                       |
| `context` | `RequestContext`                    | 调用者与网络信息                 |

**`req.context` 对象：**

| 字段                    | 类型                                            | 说明                            |
| ----------------------- | ----------------------------------------------- | ------------------------------- |
| `principal`             | `object`                                        | 已解析的调用者身份              |
| `principal.type`        | `"anonymous" \| "agent" \| "user" \| "api_key"` | 身份类型                        |
| `principal.roles`       | `string[]`                                      | 角色列表                        |
| `principal.user_uuid`   | `string`                                        | 用户 UUID；不存在时为空字符串   |
| `principal.client_uuid` | `string`                                        | 客户端 UUID；不存在时为空字符串 |
| `principal.is_api_key`  | `boolean`                                       | 是否使用 API Key                |
| `role`                  | `string`                                        | 当前请求角色；不存在时省略      |
| `user_uuid`             | `string`                                        | 当前用户 UUID；不存在时省略     |
| `client_uuid`           | `string`                                        | 当前客户端 UUID；不存在时省略   |
| `remote_ip`             | `string`                                        | 远端 IP                         |
| `user_agent`            | `string`                                        | User-Agent                      |

**`res` 对象：**

| 成员                     | 类型                                                         | 说明                                     |
| ------------------------ | ------------------------------------------------------------ | ---------------------------------------- |
| `statusCode`             | `number`                                                     | 响应状态码，默认 `200`                   |
| `statusMessage`          | `string`                                                     | 状态文本字段，当前仅作为可写字段暴露     |
| `streaming`              | `boolean`                                                    | 设为 `true` 后，`write()` 会立即推送数据 |
| `setHeader(name, value)` | `(string, string \| string[]) => res`                        | 设置响应头                               |
| `getHeader(name)`        | `(string) => string \| string[] \| undefined`                | 读取响应头                               |
| `removeHeader(name)`     | `(string) => void`                                           | 删除响应头                               |
| `write(data)`            | `(string \| Buffer \| ArrayBuffer \| Uint8Array) => boolean` | 写入响应体；流式模式下立即发送           |
| `end(data?)`             | `(string?) => res`                                           | 结束响应；可选追加文本                   |
| `isAborted()`            | `() => boolean`                                              | 客户端是否已断开或流已中止               |

**请求示例：**

```js
const server = require("server");

function load() {
  server.route("GET", "/status", (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(
      JSON.stringify({
        message: "ok",
        viewer: req.context.principal.type,
        query: req.query,
      }),
    );
  });
}
```

异步与错误处理示例：

```js
const server = require("server");

function load() {
  server.route("POST", "/echo", async (req, res) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 10));
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 201;
      res.end(JSON.stringify({ body: req.body }));
    } catch (error) {
      res.statusCode = 500;
      res.end(error.message);
    }
  });
}
```

流式示例：

```js
const server = require("server");

function load() {
  server.route("GET", "/stream", (req, res) => {
    res.streaming = true;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    let count = 0;
    const timer = setInterval(() => {
      if (res.isAborted() || count >= 5) {
        clearInterval(timer);
        res.end();
        return;
      }
      res.write(`chunk-${count++}\n`);
    }, 100);
  });
}
```

卸载后路由槽仍保留，但请求返回 `404`。非流式 handler 的执行超时为 `permissions.timeout` 秒，超时返回 `504`。

### 5.2 `server.static(mount, dir, options?)`

**说明：** 将插件目录内的静态文件夹挂载到 HTTP 路径。

**权限：** `allowRoutes`。

**参数：**

| 参数      | 类型     | 必填 | 说明                                                               |
| --------- | -------- | ---- | ------------------------------------------------------------------ |
| `mount`   | `string` | 是   | 挂载路径，必须以 `/` 开头且不能是 `/`                              |
| `dir`     | `string` | 是   | 插件目录内的相对文件夹路径                                         |
| `options` | `object` | 否   | `{ spa?: boolean }`；`spa: true` 时未命中的路径回退到 `index.html` |

**返回：** `undefined`。

**静态文件行为：**

- 同时注册 `GET` 和 `HEAD`。
- 挂载根路径解析到 `index.html`。
- 子目录解析到该目录的 `index.html`。
- 非 SPA 模式下文件不存在返回 `404`。
- SPA 模式下路径解析失败回退到挂载目录的 `index.html`。

**示例：**

```js
const server = require("server");

function load() {
  server.static("/panel", "dist", { spa: true });
}
```

上例中的文件来自 `data/plugin/<short>/dist`。

### 5.3 `server.call(method, params?)`

**说明：** 以管理员身份调用 Komari 已注册的 RPC 方法。

**权限：** `allowSystemRPC`。

**参数：**

| 参数     | 类型     | 必填 | 说明                                             |
| -------- | -------- | ---- | ------------------------------------------------ |
| `method` | `string` | 是   | RPC 方法名，例如 `common:getVersion`             |
| `params` | `any`    | 否   | RPC 参数；单参数直接传入，多参数作为位置参数传入 |

**返回：** `Promise<any>`，resolve 为 RPC result；失败时 reject 一个带 `code`、`message`，可选 `data` 的 `Error`。

**基本调用方式：**

```js
const version = await server.call("common:getVersion");
const result = await server.call("plugin:echo", { text: "hello" });
```

**示例：**

```js
const server = require("server");

function load() {
  server.route("GET", "/version", async (req, res) => {
    try {
      const version = await server.call("common:getVersion");
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(version));
    } catch (error) {
      res.statusCode = 502;
      res.end(
        JSON.stringify({
          code: error.code,
          message: error.message,
          data: error.data,
        }),
      );
    }
  });
}
```

具体 RPC 方法的参数、返回和错误语义请查阅 [RPC 方法](../rpc.md)。

### 5.4 `server.hook(kind, fn)` / `server.hook(kind, matcher, fn)`

**说明：** 注册 HTTP 请求/响应 hook，或 WebSocket 连接/帧 hook。

**权限：** `allowHooks`。

**参数：**

| 参数      | 类型       | 必填 | 说明                                                                                |
| --------- | ---------- | ---- | ----------------------------------------------------------------------------------- |
| `kind`    | `string`   | 是   | `request`、`response`、`wsConnect`、`wsMessage`、`wsSend`、`wsClose`                |
| `matcher` | `string`   | 否   | HTTP hook 支持 `"METHOD /path"`、`"/path"`、`"/path/*"`；WS hook 只接受路径 matcher |
| `fn`      | `function` | 是   | hook 回调                                                                           |

**返回：** `undefined`。

**各种 kind 的回调签名：**

| `kind`      | 回调签名                       | 返回                                            |
| ----------- | ------------------------------ | ----------------------------------------------- |
| `request`   | `(req) => void`                | 无                                              |
| `response`  | `(req, res) => void`           | 无                                              |
| `wsConnect` | `(ctx) => object \| void`      | `{ deny?: boolean, reason?: string }`           |
| `wsMessage` | `(ctx, msg) => object \| void` | `{ type?: number, data?: any, drop?: boolean }` |
| `wsSend`    | `(ctx, msg) => object \| void` | `{ type?: number, data?: any, drop?: boolean }` |
| `wsClose`   | `(ctx) => void`                | 无                                              |

**示例：**

```js
const server = require("server");

function load() {
  server.hook("request", "/api/*", (req) => {
    req.headers["x-plugin"] = "status-extension";
  });

  server.hook("response", "GET /api/version", (req, res) => {
    res.headers["x-version-hooked"] = "1";
  });
}
```

HTTP hook 的 matcher、执行顺序和错误行为，以及 WebSocket hook 的上下文与帧处理规则，见下文章节。

#### 5.4.1 `request` hook

**说明：** 在业务 handler 之前修改请求。

**注册方式：** `server.hook("request", fn)` 或 `server.hook("request", matcher, fn)`。

**参数：**

| 参数  | 类型      | 说明         |
| ----- | --------- | ------------ |
| `req` | `Request` | 可变请求对象 |

**`Request` 字段：**

| 字段      | 类型                                | 可写 | 说明                                 |
| --------- | ----------------------------------- | ---- | ------------------------------------ |
| `method`  | `string`                            | 是   | 请求方法                             |
| `url`     | `string`                            | 是   | 请求 URI，包含 query                 |
| `headers` | `Record<string,string \| string[]>` | 是   | 请求头；键为小写                     |
| `query`   | `Record<string,string>`             | 否   | 解析后的 query；修改该对象不回写 URL |
| `body`    | `string`                            | 是   | 请求体文本                           |
| `context` | `HookContext`                       | 否   | 网络信息                             |

**`HookContext` 字段：**

| 字段         | 类型     | 说明                                                                    |
| ------------ | -------- | ----------------------------------------------------------------------- |
| `remote_ip`  | `string` | 优先取 `X-Forwarded-For` 首项，其次 `X-Real-IP`，最后 `RemoteAddr` 主机 |
| `user_agent` | `string` | User-Agent                                                              |

**返回：** 无。直接修改 `req` 的 `method`、`url`、`headers`、`body` 生效。

**示例：**

```js
const server = require("server");

function load() {
  server.hook("request", "POST /api/items/*", (req) => {
    req.headers["x-plugin-request"] = "1";
    req.url = req.url.replace("old=1", "old=0");
    req.body = req.body.replaceAll("foo", "bar");
  });
}
```

匹配 matcher 的 request hook 会读取并缓冲请求体；未匹配的请求跳过 hook 和缓冲。请求体超过 `permissions.maxHTTPBodyBytes` 时返回 `413`。

#### 5.4.2 `response` hook

**说明：** 在业务 handler 返回后修改响应状态、响应头和响应体。

**注册方式：** `server.hook("response", fn)` 或 `server.hook("response", matcher, fn)`。

**参数：**

| 参数  | 类型       | 说明                                                 |
| ----- | ---------- | ---------------------------------------------------- |
| `req` | `Request`  | 同 5.4.1 的请求对象；response hook 中 `body` 为 `""` |
| `res` | `Response` | 可变响应对象                                         |

**`Response` 字段：**

| 字段            | 类型                                | 可写 | 说明               |
| --------------- | ----------------------------------- | ---- | ------------------ |
| `statusCode`    | `number`                            | 是   | HTTP 状态码        |
| `statusMessage` | `string`                            | 是   | 当前固定为空字符串 |
| `headers`       | `Record<string,string \| string[]>` | 是   | 响应头；键为小写   |
| `body`          | `string`                            | 是   | 响应体文本         |

**返回：** 无。直接修改 `res` 生效。

**示例：**

```js
const server = require("server");

function load() {
  server.hook("response", "/api/version", (req, res) => {
    res.statusCode = 200;
    res.headers["x-plugin-response"] = "1";
    res.body = res.body.replace("Komari", "Komari + Plugin");
  });
}
```

如果修改了 `body`，旧的 `Content-Length` 会被移除。达到内部响应缓冲上限后，响应会直接透传，response hook 不再改写。流式响应在首次 `Flush()` 后进入透传，hook 不再改写。

#### 5.4.3 Hook matcher

**格式：**

```text
"METHOD /path"
"/path"
"/path/*"
```

**规则：**

| 规则             | 说明                         |
| ---------------- | ---------------------------- |
| 省略 matcher     | 匹配所有请求                 |
| `"METHOD /path"` | 匹配指定 HTTP 方法和精确路径 |
| `"/path"`        | 匹配任意 HTTP 方法的精确路径 |
| `"/path/*"`      | 匹配 `/path` 及其所有子路径  |
| `"/*"`           | 匹配所有路径                 |

路径比较不区分大小写。HTTP 方法必须是 `GET`、`HEAD`、`POST`、`PUT`、`PATCH`、`DELETE` 或 `OPTIONS`；`"METHOD..."` 中的方法无法识别时，整段字符串按路径解析并因缺少 `/` 前缀而失败。

#### 5.4.4 HTTP hook 执行与错误

- 多个 request hook 按注册顺序执行，后一个看到前一个修改后的请求。
- 多个 response hook 按注册顺序执行，后一个看到前一个修改后的响应。
- request hook 达到 `timeout` 时请求返回 `500`；response hook 达到 `timeout` 时记录日志并继续发送原响应。两者在超时后都可能继续占用事件循环执行，后续副作用不保证被撤销。
- hook 抛错时，request hook 使请求返回 `500 plugin request hook failed`；response hook 只记录错误并继续发送原响应。
- WebSocket upgrade 请求不经过 `request` / `response` hook，改用 5.4.5 开始的连接与帧 hook。

#### 5.4.5 WebSocket Hook 接口

WebSocket hook 与 HTTP hook 共用 `allowHooks` 权限。所有 upgrade 都是 GET，因此 WS matcher 只接受路径：

```js
server.hook("wsMessage", "/api/clients/v2/rpc", (ctx, msg) => {
  return { data: "replaced" };
});
```

#### 5.4.6 公共 `ctx` 对象

| 字段         | 类型     | 说明                    |
| ------------ | -------- | ----------------------- |
| `path`       | `string` | WebSocket endpoint 路径 |
| `connId`     | `number` | 连接 ID                 |
| `remoteIp`   | `string` | 远端 IP                 |
| `userAgent`  | `string` | User-Agent              |
| `clientUuid` | `string` | 客户端 UUID；为空时省略 |

#### 5.4.7 `wsConnect`

**回调：** `(ctx) => object | void`

**返回：**

| 字段     | 类型      | 说明              |
| -------- | --------- | ----------------- |
| `deny`   | `boolean` | `true` 时拒绝连接 |
| `reason` | `string`  | 拒绝原因          |

**示例：**

```js
const server = require("server");

function load() {
  server.hook("wsConnect", "/api/clients/v2/rpc", (ctx) => {
    if (ctx.remoteIp === "203.0.113.9") {
      return {
        deny: true,
        reason: "blocked by plugin",
      };
    }
  });
}
```

第一个返回 `deny: true` 的 hook 拒绝连接。返回 `undefined`、`null` 或不设置 `deny` 时放行。

#### 5.4.8 `wsMessage`

**回调：** `(ctx, msg) => object | void`

**入站 `msg`：**

| 字段     | 类型                    | 说明                                   |
| -------- | ----------------------- | -------------------------------------- |
| `type`   | `number`                | WebSocket frame type                   |
| `data`   | `string \| ArrayBuffer` | 文本帧为字符串，二进制帧为 ArrayBuffer |
| `connId` | `number`                | 连接 ID                                |
| `path`   | `string`                | endpoint 路径                          |

**返回：**

| 字段   | 类型                                            | 说明                                     |
| ------ | ----------------------------------------------- | ---------------------------------------- |
| `type` | `number`                                        | 替换 frame type                          |
| `data` | `string \| ArrayBuffer \| Buffer \| Uint8Array` | 替换帧载荷                               |
| `drop` | `boolean`                                       | `true` 时丢弃帧，优先于 `type` 和 `data` |

**示例：**

```js
const server = require("server");

function load() {
  server.hook("wsMessage", "/api/rpc2", (ctx, msg) => {
    if (typeof msg.data === "string" && msg.data.includes('"blocked"')) {
      return { drop: true };
    }
    return { data: msg.data };
  });
}
```

多个 `wsMessage` hook 按注册顺序链式执行，后一个看到前一个替换后的帧。超大帧直接透传。

#### 5.4.9 `wsSend`

**回调：** `(ctx, msg) => object | void`

参数、返回结构和链式规则与 `wsMessage` 相同，但该 hook 作用于服务端发送给客户端的帧。

**示例：**

```js
const server = require("server");

function load() {
  server.hook("wsSend", "/api/clients/v2/rpc", (ctx, msg) => {
    if (typeof msg.data === "string") {
      return { data: msg.data.replace("old", "new") };
    }
  });
}
```

#### 5.4.10 `wsClose`

**回调：** `(ctx) => void`

连接结束时调用一次。返回值不参与控制。

**示例：**

```js
const server = require("server");

function load() {
  server.hook("wsClose", "/api/clients/v2/rpc", (ctx) => {
    console.log("websocket closed: " + ctx.connId);
  });
}
```

#### 5.4.11 WebSocket hook 限制

- `wsMessage` 和 `wsSend` 的单帧上限为 8 MiB；超过上限时跳过该帧所有 hook 并原样透传。
- 帧级 hook 每个最多等待 1 秒；超时后记录日志并让该帧原样通过。
- 连接级 hook 使用插件 `permissions.timeout`。
- 连续丢弃帧达到 16 个时，读取循环以错误结束。
- 运行时关闭、hook 超时或 hook 抛错时，连接与帧按安全透传处理。

### 5.5 `server.injectHTML(head, body)`

**说明：** 向每个 `text/html` 响应注入 HTML 片段。`head` 插入到 `</head>` 前，`body` 插入到 `</body>` 前。

**权限：** `allowHTMLInject`。

**参数：**

| 参数   | 类型     | 必填 | 说明                                        |
| ------ | -------- | ---- | ------------------------------------------- |
| `head` | `string` | 是   | 插入 `</head>` 前的片段；无内容时传空字符串 |
| `body` | `string` | 是   | 插入 `</body>` 前的片段；无内容时传空字符串 |

**返回：** `undefined`。

**示例：**

```js
const server = require("server");

function load() {
  server.injectHTML(
    '<link rel="stylesheet" href="/api/plugin/status-extension/assets/panel.css">',
    '<script src="/api/plugin/status-extension/assets/panel.js"></script>',
  );
}
```

注入在所有 HTML 页面生效，包括管理和终端页面。超过内部 HTML 缓冲上限的响应不会被注入。

### 5.6 `server.cron(expr, fn)`

**说明：** 按 cron 表达式在插件事件循环中执行回调。

**权限：** 默认授予，无需 manifest 声明。

**参数：**

| 参数   | 类型         | 必填 | 说明                                           |
| ------ | ------------ | ---- | ---------------------------------------------- |
| `expr` | `string`     | 是   | 5 字段或 6 字段 cron，以及 `@every <duration>` |
| `fn`   | `() => void` | 是   | 调度回调；返回值不参与调度                     |

**返回：** `undefined`。

**表达式格式：**

| 格式   | 字段                                                |
| ------ | --------------------------------------------------- |
| 5 字段 | `minute hour day-of-month month day-of-week`        |
| 6 字段 | `second minute hour day-of-month month day-of-week` |
| 间隔   | `@every 30s`、`@every 1m`、`@every 1h`              |

字段支持 `*`、`*/n`、`a-b`、`a-b/n`、逗号列表和具体数字。day-of-week 中 `7` 等同于 `0`。

**示例：**

```js
const server = require("server");

function load() {
  server.cron("*/5 * * * *", () => {
    console.log("every five minutes");
  });

  server.cron("@every 30s", () => {
    console.log("every thirty seconds");
  });
}
```

插件卸载时，该插件注册的 cron 会被取消。

### 5.7 `server.registerRPC(method, handler)`

**说明：** 注册插件自有 RPC 方法。

**权限：** 默认授予，无需 manifest 声明。

**参数：**

| 参数      | 类型              | 必填 | 说明                                                         |
| --------- | ----------------- | ---- | ------------------------------------------------------------ |
| `method`  | `string`          | 是   | RPC 方法名；不能为空，不能以 `rpc.` 开头                     |
| `handler` | `(params) => any` | 是   | RPC handler；接收原始 `params`，返回可 JSON 序列化的同步结果 |

**返回：** `undefined`。

**示例：**

```js
const server = require("server");

function load() {
  server.registerRPC("plugin:statusEcho", (params) => {
    return {
      echo: params,
      at: new Date().toISOString(),
    };
  });
}
```

handler 抛出的普通 `Error` 会转为 JSON-RPC `-32603`。如需业务错误码，可在 Error 上附加 `code` 和 `data`：

```js
const server = require("server");

function load() {
  server.registerRPC("plugin:statusFail", () => {
    const error = new Error("status unavailable");
    error.code = -32051;
    error.data = { retryable: true };
    throw error;
  });
}
```

具体调用入口与权限规则见第 10 节。

### 5.8 `server.getConfig()`

**说明：** 获取插件保存的配置值，并合并 manifest 中声明的默认值。

**权限：** 默认授予，无需 manifest 声明。

**参数：** 无。

**返回：** `Promise<Record<string, any>>`。

**示例：**

```js
const server = require("server");

function load() {
  server.route("GET", "/config", async (req, res) => {
    const config = await server.getConfig();
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(config));
  });
}
```

例如配置中包含 `message` 和 `enabled`，返回形状为：

```json
{
  "message": "hello",
  "enabled": true
}
```

## 6. 插件页面

### 6.1 管理端 iframe 页面

**说明：** manifest 中声明 `visibility: "admin"` 的 iframe 页面由管理端导航加载。

**文件路由：** `GET /api/admin/plugin/:short/*filepath`

**认证：** 管理员。

**路径参数：**

| 参数       | 类型     | 说明                 |
| ---------- | -------- | -------------------- |
| `short`    | `string` | 插件短名             |
| `filepath` | `string` | 插件目录内的文件路径 |

**返回：** 文件内容；文件不存在、路径非法或插件未安装时返回 `404`。

**示例：**

```bash
curl -s "$BASE/api/admin/plugin/status-extension/pages/admin.html" \
  -H "Cookie: $COOKIE"
```

管理页面 `pages/admin.html` 中的同源资源可直接使用相同前缀：

```html
<link
  rel="stylesheet"
  href="/api/admin/plugin/status-extension/pages/admin.css"
/>
<script src="/api/admin/plugin/status-extension/pages/admin.js"></script>
```

### 6.2 公开 iframe 页面

**说明：** manifest 中声明 `visibility: "public"` 且 `type: "iframe"` 的页面可无鉴权访问。

**文件路由：** `GET /api/plugin/:short/*filepath`

**认证：** 无。

**路径参数：**

| 参数       | 类型     | 说明                         |
| ---------- | -------- | ---------------------------- |
| `short`    | `string` | 插件短名                     |
| `filepath` | `string` | 公开页面所在目录内的文件路径 |

**返回：** 文件内容；插件未启用、文件不在公开页面目录内或路径非法时返回 `404`。

**示例：**

```bash
curl -s "http://127.0.0.1:8080/api/plugin/status-extension/pages/public.html"
```

若公开页面为 `pages/public.html`，同目录下的 `pages/public.js`、`pages/public.css` 等相对资源也可访问；目录外的 `script.js`、管理页面或 `../` 路径不可访问。

### 6.3 `redirect` 页面

`type: "redirect"` 的页面不由插件静态文件路由提供，而是由管理端跳转到 `url` 指定的站内路径。`url` 必须以 `/` 开头，不能以 `//` 开头，不能包含反斜杠、协议 scheme 或 `..` 路径段。

**示例：**

```json
{
  "title": "Open dashboard",
  "type": "redirect",
  "url": "/admin/dashboard",
  "visibility": "admin"
}
```

## 7. 插件配置

### 7.1 插件读取配置

插件内通过 `server.getConfig()` 读取，接口见 5.8。返回值是保存值与 manifest 默认值的合并结果。

### 7.2 管理员读取配置声明和值

**接口：** `GET /api/admin/plugin/configuration?short=<short>`

**认证：** 管理员。

**Query 参数：**

| 参数    | 类型     | 必填 | 说明     |
| ------- | -------- | ---- | -------- |
| `short` | `string` | 是   | 插件短名 |

**返回：** standard 包络；`data.configuration` 为 manifest 配置声明，`data.data` 为解析后的保存值。

**示例：**

```bash
curl -s "$BASE/api/admin/plugin/configuration?short=status-extension" \
  -H "Cookie: $COOKIE"
```

响应示例：

```json
{
  "status": "success",
  "data": {
    "configuration": {
      "type": "managed",
      "data": [
        {
          "key": "message",
          "name": "Message",
          "type": "string",
          "default": "hello"
        }
      ]
    },
    "data": {
      "message": "hello"
    }
  }
}
```

### 7.3 管理员保存配置

**接口：** `POST /api/admin/plugin/configuration`

**认证：** 管理员。

**请求体：**

| 字段    | 类型     | 必填 | 说明                                           |
| ------- | -------- | ---- | ---------------------------------------------- |
| `short` | `string` | 是   | 插件短名                                       |
| `data`  | `object` | 否   | 完整配置值对象；省略或为 `null` 时按空对象保存 |

**返回：** standard 成功包络；保存后插件若已启用会立即 reload。

**示例：**

```bash
curl -s -X POST "$BASE/api/admin/plugin/configuration" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "short": "status-extension",
    "data": {
      "message": "from-admin",
      "enabled": true
    }
  }'
```

保存成功但 reload 失败时，配置已经写入，调用返回错误并包含 `plugin configuration saved but reload failed`。

## 8. 插件自有 RPC

### 8.1 注册

插件通过 `server.registerRPC(method, handler)` 注册，接口见 5.7。

### 8.2 调用

注册后的方法进入 Komari 统一 RPC registry，可通过现有 `/api/rpc2` 调用，也可由其它插件通过 `server.call()` 调用。本文不重复 RPC 请求包络、错误码和鉴权细节，请查阅 [RPC 方法](../rpc.md)。

**HTTP 调用示例：**

```bash
curl -s -X POST "http://127.0.0.1:8080/api/rpc2" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "plugin:statusEcho",
    "params": {
      "text": "hello"
    },
    "id": 1
  }'
```

**插件调用其它插件方法示例：**

```js
const result = await server.call("plugin:statusEcho", {
  text: "hello",
});
```

### 8.3 规则

- 方法名不能为空，不能以 `rpc.` 开头。
- 同一插件在同一次加载中重复注册同名方法会被忽略。
- handler 接收一个原始 `params` 值，不自动解包命名参数。
- handler 按同步函数调用；返回 Promise 时不会等待 Promise 的异步结果。
- 返回值必须可导出为 JSON；循环引用等导出失败返回 `-32603`。
- handler 超时为 `permissions.timeout` 秒，超时返回 `-32011`。
- 插件卸载后，方法注销；再调用返回 `-32601`。
- 若方法名与已存在方法冲突，注册失败并导致插件加载失败。
- 插件方法仍受统一 ACL 管理；仅注册 `plugin:*` 方法且没有额外权限声明时，调用要求管理员角色。

## 9. 插件管理 HTTP 接口

本节描述插件管理后台实际暴露的 HTTP 路由。除分片上传与市场外，多数路由桥接到 `admin:*` RPC；桥接后的响应形状与目标 RPC 的返回值有关，RPC 方法本身不在此重复展开。

所有接口均要求管理员身份。

### 9.1 插件列表

**接口：** `GET /api/admin/plugin/list`

**路径参数：** 无。

**Query 参数：** 无。

**请求体：** 无。

**返回：** standard 包络；`data` 为 `PluginInfo[]`。

**`PluginInfo`：**

| 字段            | 类型                              | 说明                                 |
| --------------- | --------------------------------- | ------------------------------------ |
| `name`          | `string \| Record<string,string>` | manifest 名称                        |
| `short`         | `string`                          | 插件短名                             |
| `description`   | `string \| Record<string,string>` | manifest 描述                        |
| `author`        | `string \| Record<string,string>` | manifest 作者                        |
| `version`       | `string`                          | 版本                                 |
| `url`           | `string`                          | 插件 URL                             |
| `icon`          | `string`                          | 图标相对路径                         |
| `komari`        | `string`                          | 服务端版本约束                       |
| `entry`         | `string`                          | 入口脚本                             |
| `permissions`   | `PluginPermissions`               | 权限对象                             |
| `configuration` | `Configuration`                   | 配置声明                             |
| `pages`         | `PluginPage[]`                    | 页面声明；无声明时省略               |
| `enabled`       | `boolean`                         | 是否持久化启用                       |
| `running`       | `boolean`                         | 当前是否运行                         |
| `last_error`    | `string`                          | 最近一次加载错误；无错误时为空字符串 |

**示例：**

```bash
curl -s "$BASE/api/admin/plugin/list" \
  -H "Cookie: $COOKIE"
```

### 9.2 启用或停用插件

**接口：** `POST /api/admin/plugin/enabled`

**认证：** 管理员。

**请求体：**

| 字段       | 类型      | 必填 | 说明                                               |
| ---------- | --------- | ---- | -------------------------------------------------- |
| `short`    | `string`  | 是   | 插件短名                                           |
| `enabled`  | `boolean` | 否   | `true` 启用，`false` 停用；省略时按 `false` 处理   |
| `approved` | `boolean` | 否   | 是否批准当前权限集合；需要审批且未提供时为 `false` |

**返回：** standard 成功包络。权限未批准时，`data` 为 `{ "requires_approval": true }`；调用方批准权限后需带 `approved: true` 重试。

**示例：**

```bash
curl -s -X POST "$BASE/api/admin/plugin/enabled" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "short": "status-extension",
    "enabled": true,
    "approved": true
  }'
```

### 9.3 获取插件日志

**接口：** `GET /api/admin/plugin/logs?short=<short>`

**认证：** 管理员。

**Query 参数：**

| 参数    | 类型     | 必填 | 说明     |
| ------- | -------- | ---- | -------- |
| `short` | `string` | 是   | 插件短名 |

**返回：** standard 包络；`data.logs` 为字符串日志。

**示例：**

```bash
curl -s "$BASE/api/admin/plugin/logs?short=status-extension" \
  -H "Cookie: $COOKIE"
```

响应示例：

```json
{
  "status": "success",
  "data": {
    "logs": "[plugin] loading status-extension\n[plugin] loaded status-extension\n"
  }
}
```

### 9.4 删除插件

**接口：** `POST /api/admin/plugin/delete`

**认证：** 管理员。

**请求体：**

| 字段    | 类型     | 必填 | 说明     |
| ------- | -------- | ---- | -------- |
| `short` | `string` | 是   | 插件短名 |

**返回：** standard 成功包络。插件未安装时返回错误。

**示例：**

```bash
curl -s -X POST "$BASE/api/admin/plugin/delete" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"short":"status-extension"}'
```

删除会卸载运行实例，并同时删除 `data/plugin/<short>`、`data/plugin-data/<short>` 和持久化状态。

### 9.5 分片上传安装插件

安装流程使用统一归档上传接口，`purpose` 必须为 `plugin`。

#### 9.5.1 初始化

**接口：** `POST /api/admin/upload/init`

**请求体：**

| 字段       | 类型      | 必填 | 说明                                            |
| ---------- | --------- | ---- | ----------------------------------------------- |
| `purpose`  | `string`  | 是   | 插件固定为 `"plugin"`                           |
| `filename` | `string`  | 否   | ZIP 文件名；插件安装流程不依赖此字段            |
| `size`     | `integer` | 是   | 文件总字节数，必须大于 `0` 且不超过备份归档上限 |

**返回：** standard 包络；`data.upload_id` 为 UUID，`data.chunk_size` 为 5 MiB。

**示例：**

```bash
curl -s -X POST "$BASE/api/admin/upload/init" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "plugin",
    "filename": "status-extension.zip",
    "size": 123456
  }'
```

#### 9.5.2 上传分片

**接口：** `POST /api/admin/upload/chunk`

**Content-Type：** `multipart/form-data`

**表单字段：**

| 字段          | 类型      | 必填 | 说明                                   |
| ------------- | --------- | ---- | -------------------------------------- |
| `upload_id`   | `string`  | 是   | 初始化返回的 UUID                      |
| `chunk_index` | `integer` | 是   | 从 `0` 开始的整数                      |
| `chunk_data`  | `file`    | 是   | 分片二进制；除最后一片外必须恰好 5 MiB |

**返回：** standard 包络；`data` 包含 `received: true` 和 `chunk_index`。

**示例：**

```bash
curl -s -X POST "$BASE/api/admin/upload/chunk" \
  -H "Cookie: $COOKIE" \
  -F "upload_id=<upload-id>" \
  -F "chunk_index=0" \
  -F "chunk_data=@chunk-0.bin"
```

#### 9.5.3 合并并安装

**接口：** `POST /api/admin/upload/merge`

**请求体：**

| 字段        | 类型     | 必填 | 说明              |
| ----------- | -------- | ---- | ----------------- |
| `upload_id` | `string` | 是   | 初始化返回的 UUID |

**返回：** standard 包络；`message` 为 `插件上传成功`，`data` 为安装后的 `Plugin` manifest。

**示例：**

```bash
curl -s -X POST "$BASE/api/admin/upload/merge" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"upload_id":"<upload-id>"}'
```

#### 9.5.4 取消上传

**接口：** `POST /api/admin/upload/cancel`

**请求体：**

| 字段        | 类型     | 必填 | 说明              |
| ----------- | -------- | ---- | ----------------- |
| `upload_id` | `string` | 是   | 初始化返回的 UUID |

**返回：** standard 成功包络。

**示例：**

```bash
curl -s -X POST "$BASE/api/admin/upload/cancel" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"upload_id":"<upload-id>"}'
```

### 9.6 插件市场数据源

#### 9.6.1 列出数据源

**接口：** `GET /api/admin/plugin/market/sources`

**请求体：** 无。

**返回：** standard 包络；`data` 为 `PluginMarketSource[]`。

**示例：**

```bash
curl -s "$BASE/api/admin/plugin/market/sources" \
  -H "Cookie: $COOKIE"
```

#### 9.6.2 创建数据源

**接口：** `POST /api/admin/plugin/market/sources`

**请求体：**

| 字段      | 类型      | 必填 | 说明                         |
| --------- | --------- | ---- | ---------------------------- |
| `name`    | `string`  | 是   | 数据源名称                   |
| `url`     | `string`  | 是   | HTTP/HTTPS catalog URL       |
| `enabled` | `boolean` | 否   | 是否启用；默认 `false`       |
| `id`      | `string`  | 否   | 忽略客户端值，服务端重新生成 |

**返回：** standard 成功包络；`data` 为创建后的 `PluginMarketSource`。

**示例：**

```bash
curl -s -X POST "$BASE/api/admin/plugin/market/sources" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My catalog",
    "url": "https://example.com/plugins/v1.json",
    "enabled": true
  }'
```

#### 9.6.3 更新数据源

**接口：** `PUT /api/admin/plugin/market/sources/:id`

**路径参数：**

| 参数 | 类型     | 说明      |
| ---- | -------- | --------- |
| `id` | `string` | 数据源 ID |

**请求体：** 同创建数据源；请求体中的 `id` 会被路径参数覆盖。

**返回：** standard 成功包络；`data` 为更新后的数据源。

**示例：**

```bash
curl -s -X PUT "$BASE/api/admin/plugin/market/sources/<source-id>" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated catalog",
    "url": "https://example.com/plugins/v2.json",
    "enabled": true
  }'
```

#### 9.6.4 删除数据源

**接口：** `DELETE /api/admin/plugin/market/sources/:id`

**路径参数：**

| 参数 | 类型     | 说明      |
| ---- | -------- | --------- |
| `id` | `string` | 数据源 ID |

**返回：** standard 成功包络。

**示例：**

```bash
curl -s -X DELETE "$BASE/api/admin/plugin/market/sources/<source-id>" \
  -H "Cookie: $COOKIE"
```

### 9.7 插件市场目录

**接口：** `GET /api/admin/plugin/market/catalog`

**Query 参数：**

| 参数      | 类型      | 必填 | 默认    | 说明                   |
| --------- | --------- | ---- | ------- | ---------------------- |
| `refresh` | `boolean` | 否   | `false` | 值为 `true` 时绕过缓存 |

**返回：** standard 包络；`data.plugins` 为合并后的插件列表，`data.sources` 为各数据源状态。

**`PluginMarketPlugin`：**

| 字段          | 类型                              | 说明                           |
| ------------- | --------------------------------- | ------------------------------ |
| `name`        | `string \| Record<string,string>` | 插件名称                       |
| `short`       | `string`                          | 插件短名                       |
| `description` | `string \| Record<string,string>` | 描述                           |
| `version`     | `string`                          | 版本                           |
| `author`      | `string \| Record<string,string>` | 作者                           |
| `url`         | `string`                          | 插件页 URL                     |
| `download`    | `string`                          | ZIP 下载 URL；无包时为空       |
| `sha256`      | `string`                          | ZIP SHA-256；无包时为空        |
| `komari`      | `string`                          | 服务端版本约束                 |
| `installable` | `boolean`                         | 是否具备可安装包且版本约束满足 |
| `source_id`   | `string`                          | 来源数据源 ID                  |
| `source_name` | `string`                          | 来源数据源名称                 |

**`sources[]`：**

| 字段    | 类型      | 说明                       |
| ------- | --------- | -------------------------- |
| `id`    | `string`  | 数据源 ID                  |
| `name`  | `string`  | 数据源名称                 |
| `url`   | `string`  | 数据源 URL                 |
| `count` | `integer` | 从该源读取到的插件数       |
| `error` | `string`  | 数据源读取错误；成功时省略 |

**示例：**

```bash
curl -s "$BASE/api/admin/plugin/market/catalog?refresh=true" \
  -H "Cookie: $COOKIE"
```

### 9.8 从市场安装插件

**接口：** `POST /api/admin/plugin/market/install`

**请求体：**

| 字段        | 类型     | 必填 | 说明                  |
| ----------- | -------- | ---- | --------------------- |
| `source_id` | `string` | 是   | 已启用的市场数据源 ID |
| `short`     | `string` | 是   | 要安装的插件短名      |

**返回：** standard 成功包络；`data` 为安装后的 manifest。

**示例：**

```bash
curl -s -X POST "$BASE/api/admin/plugin/market/install" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": "official",
    "short": "status-extension"
  }'
```

服务端会重新抓取 catalog、下载 ZIP、校验 SHA-256，并确认安装后的 `short` 和 `version` 与 catalog 一致。

## 10. 权限、限制与错误

### 10.1 权限矩阵

| 接口                   | 权限                          |
| ---------------------- | ----------------------------- |
| `server.route()`       | `allowRoutes`                 |
| `server.static()`      | `allowRoutes`                 |
| `server.hook()`        | `allowHooks`                  |
| `server.injectHTML()`  | `allowHTMLInject`             |
| `server.call()`        | `allowSystemRPC`              |
| `server.registerRPC()` | 默认可用                      |
| `server.getConfig()`   | 默认可用                      |
| `server.cron()`        | 默认可用                      |
| 插件目录内文件访问     | 默认可用                      |
| 插件目录外文件访问     | `allowAllFileAccess`          |
| `child_process`        | `allowExec` 且 `node: true`   |
| 本地端口监听           | `allowListen` 且 `node: true` |

### 10.2 时间与容量限制

| 项目                     | 当前值 |
| ------------------------ | ------ |
| 默认执行超时             | 30 秒  |
| 默认 HTTP body 上限      | 32 MiB |
| 默认子进程输出上限       | 1 MiB  |
| HTTP hook 响应缓冲上限   | 32 MiB |
| HTML 注入缓冲上限        | 32 MiB |
| WebSocket 单帧 hook 上限 | 8 MiB  |
| WebSocket 帧 hook 超时   | 1 秒   |
| WebSocket 连续丢弃上限   | 16 帧  |

### 10.3 错误对象

`server.call()` reject：

```js
{
  name: "Error",
  message: "method not found",
  code: -32601,
  data: "optional detail"
}
```

`server.registerRPC()` handler 抛错：

```js
const error = new Error("boom");
error.code = -32045;
error.data = { detail: "x" };
throw error;
```

JSON-RPC 常用错误码：

| Code     | 含义              |
| -------- | ----------------- |
| `-32700` | Parse error       |
| `-32600` | Invalid request   |
| `-32601` | Method not found  |
| `-32602` | Invalid params    |
| `-32603` | Internal error    |
| `-32011` | Deadline exceeded |
| `-32040` | Unauthenticated   |
| `-32041` | Permission denied |
| `-32044` | Not found         |
| `-32045` | Already exists    |
| `-32051` | Unavailable       |

### 10.4 生命周期清理

| 资源                                    | 插件卸载时行为                                         |
| --------------------------------------- | ------------------------------------------------------ |
| `server.route()` 注册的 route slot      | 保留，请求返回 `404`                                   |
| `server.static()` 注册的静态 route slot | 保留，请求返回 `404`                                   |
| HTTP request/response hook              | 移除                                                   |
| WebSocket hook                          | 移除                                                   |
| `server.injectHTML()` 注入片段          | 移除                                                   |
| `server.cron()` 任务                    | 取消并移除                                             |
| `server.registerRPC()` 方法             | 注销                                                   |
| 插件自建 timer、listener、进程等资源    | 运行时会关闭已登记资源；脚本应在 `unload()` 中主动清理 |
