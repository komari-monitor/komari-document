# 插件开发指南

## 说明

Komari 支持通过 **JavaScript 插件** 扩展服务端能力。插件是一个 ZIP 包，包含清单文件（`komari-plugin.json`）和入口脚本（默认 `script.js`）。插件在服务端进程中运行于独立的 goja JS 运行时（沙箱），可以注册 HTTP 路由、拦截 HTTP 请求/响应、调用系统 RPC、注册自己的 RPC 方法、声明配置项并注入管理页面。

::: warning 安全提示
插件将继承 Komari 的系统权限，且可能申请访问文件系统、执行子进程、监听端口等敏感能力。只安装你信任的插件；安装第三方插件前请仔细阅读其声明的权限。
:::

### 插件能做什么

| 能力                | API                      | 需要的权限         | 说明                                                       |
| ------------------- | ------------------------ | ------------------ | ---------------------------------------------------------- |
| 注册 RPC 方法       | `server.registerRPC`     | 始终授予           | 注册 `plugin:xxx` 方法，供前端或其他插件调用               |
| 定时任务            | `server.cron`            | 始终授予           | 按 cron 表达式定时执行                                     |
| 调用系统 RPC        | `server.call`            | `allowSystemRPC`   | 以管理员身份调用任意系统 RPC                               |
| 注册 HTTP 路由      | `server.route`           | `allowRoutes`      | 注册 `METHOD /path`，支持流式响应                          |
| 挂载静态文件夹      | `server.static`          | `allowRoutes`      | 可选 SPA 回退                                              |
| 拦截 HTTP 请求/响应 | `server.hook`            | `allowHooks`       | 修改进出服务端的请求/响应                                  |
| 拦截 WebSocket      | `server.hook`（ws 类）   | `allowHooks`       | wsConnect / wsMessage / wsSend / wsClose                   |
| 嵌入 CSS/JS         | `server.injectHTML`      | `allowHTMLInject`  | 向每个 HTML 页面嵌入片段                                   |
| 读取配置            | `server.getConfig`       | 始终授予           | 读取保存配置（合并默认值）                                 |
| 声明配置项          | manifest `configuration` | 无需权限           | 管理界面自动生成表单                                       |
| 注入管理页面        | manifest `pages`         | 无需权限           | 侧边栏 iframe / redirect 页面                              |
| 文件访问            | `fs` / `require`         | 插件目录内始终授予 | 越界需 `allowAllFileAccess`                                |
| Node 兼容模块       | `node` 模块              | `node`             | events / fs / path / os / process / net / http / crypto 等 |
| 子进程              | `child_process`          | `allowExec`        | 执行外部命令                                               |
| 端口监听            | `net` / `http` Server    | `allowListen`      | 默认绑定 `127.0.0.1`                                       |

### 安装限制

ZIP 包最多 10,000 个文件、单文件 ≤ 128 MiB、解压总量 ≤ 512 MiB、清单文件 ≤ 1 MiB；含 `../`、绝对路径等穿越条目的包**整体拒绝**。`komari-plugin.json` 必须位于 ZIP 根目录。

## 快速开始

### 使用 `npm create komari-plugin`（推荐）

前置条件：Node.js 20 或更高版本、可访问的 Komari 开发服务器、具有安装和管理插件权限的 API Key。

```sh
npm create komari-plugin
```

`npm run dev` 会编译 TypeScript、打包插件、上传到配置的服务器、启用插件，并输出插件运行时日志；同时监听源码和 manifest 的变化，改动后自动重复这套流程，`Ctrl+C` 停止监听。开发服务器地址和 API Key 保存在 `komari.local.json`（默认已加入 `.gitignore`），不要提交。

生成的目录结构：

```text
hello/
├── src/plugin.ts          # TypeScript 插件源码
├── komari-plugin.json     # 插件 manifest
├── komari.local.json      # 本地服务器地址和 API Key，禁止提交
├── package.json
└── tsconfig.json
```

生成的 manifest 已引用 SDK Schema，在 VS Code 中可获得字段补全、校验和悬停说明。SDK 示例：

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

### 手动 ZIP 工作流

1. 创建插件目录，包含 `komari-plugin.json` 和 `script.js`。
2. 编写清单（见 [清单文件说明](#清单文件说明)）。
3. 编写入口脚本：

```js
const server = require("server");

function load() {
  console.log("hello plugin loaded");

  // 注册一个 HTTP 路由：GET /hello
  server.route("GET", "/hello", async (req, res) => {
    const nodes = await server.call("common:getNodes");
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        greeting: "Hello, Komari!",
        nodeCount: Object.keys(nodes).length,
      }),
    );
  });
}

function unload() {
  console.log("hello plugin unloaded");
}
```

4. 将两个文件直接打包到 ZIP **根目录**（不要套一层文件夹），在管理界面「插件」页上传。
5. 安装后插件默认处于**禁用**状态，需要手动启用（声明敏感权限时会先触发批准流程）。

### 生命周期

- 入口脚本的顶层代码在加载时立即执行；可选定义全局 `load()` / `unload()`。
- `load()` 在每次启用/启动时调用（含服务端启动恢复）；`unload()` 在禁用、卸载或服务端关闭时调用。
- 顶层脚本抛错或 `load()` 抛错 → 插件**自动禁用**（错误写入 `last_error`）。
- 插件注册的 gin 路由槽位在卸载后**保留**（访问返回 404），重新加载后自动恢复。

### 长期存储目录 `__storageDir__`

每个插件启用后拥有独立的长期存储目录 `data/plugin-data/<short>/`，通过全局 `__storageDir__` 访问：

```js
const fs = require("fs");
const path = require("path");
fs.writeFileSync(path.join(__storageDir__, "cache.json"), "{}");
```

- 与代码目录 `data/plugin/<short>`（ZIP 解压内容）完全分离，`fs` 沙箱同时覆盖两个目录。
- **更新（覆盖安装）只替换代码目录，长期存储保留**；显式删除插件时两目录一起移除。
- 无法越出 `__storageDir__`，也不能访问其他插件的存储目录。

### 调试

每个插件有独立的 64 KiB 环形日志缓冲区，`console.*` 输出与生命周期/钩子错误都会写入其中，可通过 `admin:getPluginLogs`（参数 `{short}`）获取。插件加载失败时，管理界面「插件」列表会显示 `last_error`，结合插件日志即可定位大多数问题。

## 清单文件说明

`komari-plugin.json` 必须位于插件 ZIP 的根目录，声明插件的元信息、权限、配置项和注入页面。服务端在安装、加载和启用时都会校验该文件。

| 字段            | 类型           | 必填 | 默认值        | 说明                                                   |
| --------------- | -------------- | ---- | ------------- | ------------------------------------------------------ |
| `name`          | string \| i18n | 是   | —             | 插件名称                                               |
| `short`         | string         | 是   | —             | 插件唯一短名，仅允许 `[A-Za-z0-9_-]`，不能是 `default` |
| `description`   | string \| i18n | 否   | —             | 插件描述                                               |
| `author`        | string \| i18n | 否   | —             | 作者                                                   |
| `version`       | string         | 否   | —             | 插件版本号（市场发布时必填）                           |
| `url`           | string         | 否   | —             | 项目主页 / 仓库地址                                    |
| `icon`          | string         | 否   | —             | 图标路径，必须是插件目录内的相对路径                   |
| `komari`        | string         | 否   | `""`          | 服务端版本约束，如 `>=1.0.0`                           |
| `entry`         | string         | 否   | `"script.js"` | 入口脚本，必须是插件目录内的相对路径                   |
| `permissions`   | object         | 否   | 全为零值      | 权限声明（见下）                                       |
| `configuration` | object         | 否   | —             | 配置项声明（见下）                                     |
| `pages`         | array          | 否   | `[]`          | 注入的管理页面（见下）                                 |

- `name`、`description`、`author` 以及页面 `title` 可以是普通字符串，也可以是 `{"zh_CN": "...", "en": "..."}` 形式的多语言对象。
- `komari` 版本约束：空 = 兼容任意版本；`1.0.0` = 精确匹配；`>=1.0.0` = 最低版本；`<=1.0.0` = 最高版本。约束不满足时安装被拒绝、加载失败。

最小示例：

```json
{
  "name": "Hello World",
  "short": "hello",
  "description": "一个示例插件",
  "author": "Your Name",
  "version": "1.0.0",
  "komari": ">=1.0.0",
  "entry": "script.js",
  "permissions": {
    "node": true,
    "allowSystemRPC": true,
    "allowRoutes": true
  }
}
```

## 权限申请

除 `node`、`maxHTTPBodyBytes`、`maxChildOutputBytes`、`timeout` 外，权限字段默认 `false`——**不声明即不授予**。

| 字段                  | 类型    | 默认    | 说明                                                                                                                         | 触发批准 |
| --------------------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------------------------- | -------- |
| `node`                | boolean | `false` | 启用 Node 兼容模块（events/path/os/process/fs/child_process/net/http/stream/crypto 及 `Buffer`/`process`/`global` 全局变量） | 否       |
| `allowSystemRPC`      | boolean | `false` | 允许 `server.call` 以管理员身份调用任意系统 RPC                                                                              | **是**   |
| `allowRoutes`         | boolean | `false` | 允许 `server.route` 在宿主引擎上注册 HTTP 路由                                                                               | **是**   |
| `allowHooks`          | boolean | `false` | 允许 `server.hook` 修改 HTTP 请求/响应及拦截 WebSocket                                                                       | **是**   |
| `allowHTMLInject`     | boolean | `false` | 允许 `server.injectHTML` 向每个 HTML 页面嵌入 CSS/JS                                                                         | **是**   |
| `allowExec`           | boolean | `false` | 允许 `child_process` 执行子进程                                                                                              | **是**   |
| `allowListen`         | boolean | `false` | 允许 `net`/`http` Server 监听本地端口                                                                                        | **是**   |
| `allowAllFileAccess`  | boolean | `false` | 允许访问插件目录之外的文件                                                                                                   | **是**   |
| `maxHTTPBodyBytes`    | int     | 32 MiB  | fetch 响应体与 HTTP 请求体缓冲上限                                                                                           | 否       |
| `maxChildOutputBytes` | int     | 1 MiB   | 子进程 stdout/stderr 输出上限                                                                                                | 否       |
| `timeout`             | int     | 30      | 单次执行超时（秒）                                                                                                           | 否       |

- **始终授予**（无需声明、不触发批准）：`server.registerRPC`、`server.cron`、`server.getConfig`、插件目录与 `__storageDir__` 内的文件访问。
- 任一敏感能力（上表标 **是** 的 7 个字段）为 `true` 时，启用插件需要**管理员批准**：批准哈希只覆盖这 7 个字段；之后修改 `node` / timeout / 大小上限**不会**重新触发批准，修改敏感能力会。

**缺少权限时的行为：**

| API                                                                    | 缺权限时的表现                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------- |
| `server.route` / `server.static` / `server.hook` / `server.injectHTML` | **加载时**抛 `TypeError`，插件加载失败（自动禁用） |
| `server.call`                                                          | 返回的 Promise 被**拒绝**（不阻塞加载）            |
| `require("child_process")`                                             | 抛错（无 `allowExec`）                             |
| `net` / `http` Server `listen()`                                       | 抛错（无 `allowListen`）                           |
| `fs` / `require` 越界路径                                              | 被沙箱拒绝（无 `allowAllFileAccess`）              |

## 配置项声明

`type: "managed"` 的声明式配置：管理界面自动生成表单，插件通过 `server.getConfig()` 读取。

```json
{
  "configuration": {
    "type": "managed",
    "data": [
      {
        "key": "greeting",
        "name": "Greeting",
        "type": "string",
        "default": "Hello"
      },
      { "key": "count", "name": "Count", "type": "number" },
      {
        "key": "enabled",
        "name": "Enabled",
        "type": "switch",
        "default": true
      },
      {
        "key": "mode",
        "name": "Mode",
        "type": "select",
        "options": "json,text"
      },
      { "key": "note", "name": "Note", "type": "string", "help": "使用说明" },
      { "key": "nodes", "name": "Nodes", "type": "nodes", "default": "[]" }
    ]
  }
}
```

```js
const config = await server.getConfig();
console.log(config.greeting); // 已合并默认值
```

配置项的字段含义、默认值合并规则与选择器的存储/输出规则由主题和插件共用，详见 [托管配置文档](../managed-config)。

## 自定义页面

插件可以向管理界面注入页面（显示在侧边栏插件分组下）：

```json
{
  "pages": [
    { "file": "admin.html", "title": "管理面板", "icon": "icon.png" },
    { "type": "redirect", "title": "跳转到节点列表", "url": "/" },
    { "file": "pub.html", "title": "公开页面", "visibility": "public" }
  ]
}
```

| 字段         | 类型                       | 必填          | 说明                                |
| ------------ | -------------------------- | ------------- | ----------------------------------- |
| `file`       | string                     | iframe 必填   | 插件目录内的相对路径，渲染为 iframe |
| `title`      | string \| i18n             | 是            | 页面标题                            |
| `icon`       | string                     | 否            | 图标，插件目录内的相对路径          |
| `type`       | `"iframe"` \| `"redirect"` | 否            | 默认 `iframe`                       |
| `url`        | string                     | redirect 必填 | 站内路径                            |
| `visibility` | `"admin"` \| `"public"`    | 否            | 默认 `admin`                        |

| visibility | type     | 访问路径                           | 认证             |
| ---------- | -------- | ---------------------------------- | ---------------- |
| `admin`    | `iframe` | `/api/admin/plugin/<short>/<file>` | 需要管理员登录   |
| `public`   | `iframe` | `/api/plugin/<short>/<file>`       | 无需认证（公开） |
| `redirect` | 任意     | 跳转到站内路径                     | —                |

- `public` 页面要求插件处于**启用**状态，只能访问已声明公共页面目录内的文件，并以沙箱 iframe 渲染。
- `redirect` 的 `url` 必须是同源站内路径：以 `/` 开头、不能是 `//` 开头、不能包含反斜杠、URL scheme（如 `http:`）或 `..` 段。

::: tip 跟随父页面的主题与语言
iframe 页面通过读取父文档的 `<html>` 元素即可同步主题与语言：

- **深色/浅色主题**：`window.parent.document.documentElement.classList.contains("dark")` 判断当前是否为深色主题。
- **当前语言**：`window.parent.document.documentElement.lang` 读取当前语言（如 `zh-CN`、`en`）。

建议用 `MutationObserver` 监听 `class` / `lang` 属性的变化，实时跟随主题与语言切换，而不是只在页面加载时判断一次。
:::

## 接口

插件通过 `require("server")` 获取与宿主的桥接模块（原生模块），通过全局 `load()` / `unload()` 定义生命周期钩子。

| 方法                                  | 说明                                      | 权限              |
| ------------------------------------- | ----------------------------------------- | ----------------- |
| `server.route(method, path, handler)` | 在宿主引擎注册 HTTP 路由                  | `allowRoutes`     |
| `server.static(path, dir, opts)`      | 挂载插件目录内的静态文件夹，可选 SPA 回退 | `allowRoutes`     |
| `server.hook(kind, matcher?, fn)`     | 注册请求/响应/WebSocket 钩子              | `allowHooks`      |
| `server.injectHTML(head, body)`       | 向每个 HTML 页面嵌入 CSS/JS               | `allowHTMLInject` |
| `server.call(method, params...)`      | 以管理员身份调用系统 RPC                  | `allowSystemRPC`  |
| `server.registerRPC(method, handler)` | 注册插件自己的 RPC 方法                   | 始终授予          |
| `server.cron(expr, handler)`          | 按 cron 表达式定时执行 handler            | 始终授予          |
| `server.getConfig()`                  | 读取配置（合并默认值）                    | 始终授予          |

### server.call

```js
const result = await server.call("common:getNodes");
const status = await server.call("common:getNodesLatestStatus", {
  uuid: "...",
});
```

- 参数编组：**0 个** → `null`；**1 个** → 直接作为参数；**多个** → 按位置编组为数组。
- 失败时 reject 一个携带 JSON-RPC 错误字段的 Error：`err.code`（整数）、`err.message`、`err.data`（可选）。
- 以 `RoleAdmin` 身份调用，等同于管理员在后台操作（包括 `admin:exec` 等敏感操作）。需要 `allowSystemRPC`。
- 可用方法涵盖 `common:` / `public:` / `admin:` / `client:` 命名空间（如 `common:getNodes`、`admin:getTasks`、`admin:listPlugins`、`admin:getPluginLogs` 等），完整清单见 [RPC 接口文档](../rpc)。

### server.route

```js
server.route("GET", "/plug", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
});
```

- `method` 不能为空；`path` 必须以 `/` 开头。
- `req`：`method` / `url`（含查询串）/ `headers`（键为小写，多值为数组）/ `query` / `body`（已完整读取，受 `maxHTTPBodyBytes` 限制）/ `context`（身份与来源信息）。
- `res`：`statusCode` / `statusMessage` / `streaming` / `isAborted()` / `setHeader` / `getHeader` / `removeHeader` / `write` / `end`。
- **必须调用 `res.end()`**，否则客户端在 `timeout` 后收到 **504 `plugin route handler timed out`**。
- 流式响应（SSE）：设置 `res.streaming = true` 后每次 `write()` 立即发送；客户端断开时 `isAborted()` 返回 `true`。

### server.static

```js
server.static("/ui", "dist");
server.static("/app", "dist", { spa: true }); // SPA 模式
```

- 支持 `GET` / `HEAD`；挂载路径本身返回目录的 `index.html`，目录请求回退到其 `index.html`。
- `{ spa: true }` 时，找不到文件的请求回退到文件夹根的 `index.html`（前端路由刷新不再 404）；真实存在的文件优先。

### server.hook

```js
server.hook("request", (req) => {
  req.headers["x-hooked"] = "yes";
});

server.hook("response", "/api/*", (req, res) => {
  res.statusCode = 201;
  res.body = res.body + "|hooked";
});
```

- `kind`：`"request"` / `"response"` / `"wsConnect"` / `"wsMessage"` / `"wsSend"` / `"wsClose"`。
- `matcher`（可选）：`"/api/foo"`（精确）、`"/api/*"`（子树）、`"POST /api/foo"`（方法 + 路径）；ws 类只接受路径形式。
- 请求钩子可修改 `method` / `url` / `headers` / `body`；响应钩子可修改 `statusCode` / `statusMessage` / `headers` / `body`（改写 body 后自动移除原 `Content-Length`）。
- ws 钩子：`wsConnect` 返回 `{ deny, reason }` 拒绝连接；`wsMessage` / `wsSend` 返回 `{ drop: true }` 丢弃帧或 `{ type, data }` 替换帧；`wsClose` 通知连接结束。帧大小上限 8 MiB，帧回调等待上限 1 秒；丢弃帧可能破坏协议，请谨慎使用。
- 流式响应（SSE）或超过 32 MiB 的响应直接穿透，钩子无法改写。

#### WebSocket 钩子示例

ws 类钩子作用于服务端的**全部 WebSocket 端点**（Agent 上报、前端 RPC2、终端转发、在线列表）：

```js
// 连接级：升级时调用；返回 undefined = 放行，{ deny, reason } = 拒绝
server.hook("wsConnect", (ctx) => {
  if (ctx.path === "/api/clients/v2/rpc" && ctx.remoteIp.startsWith("10.")) {
    return { deny: true, reason: "intranet agents must use the private endpoint" };
  }
});

// 帧级：每个入站（客户端 → 服务端）帧
server.hook("wsMessage", "/api/clients/v2/rpc", (ctx, msg) => {
  if (msg.type !== 1) return;                 // 1 = text，2 = binary
  const req = JSON.parse(msg.data);
  if (req.method === "agent.basicInfo") {
    req.params.info.ipv4 = "1.2.3.4";         // 改写 Agent 上报的公网 IP
    return { data: JSON.stringify(req) };     // 替换帧
  }
  // return { drop: true };                   // 丢弃该帧（可能破坏协议，谨慎使用）
});

// 帧级：每个出站（服务端 → 客户端）帧
server.hook("wsSend", (ctx, msg) => {
  return { type: msg.type, data: msg.data };  // 原样返回 = 放行
});

// 连接结束通知（wsClose 的返回值被忽略）
server.hook("wsClose", (ctx) => {
  console.log("connection closed", ctx.connId);
});
```

- `ctx`（连接上下文，连接建立时构造一次，帧回调共享同一对象）：`path`（端点路径，如 `/api/clients/v2/rpc`）、`connId`（连接唯一 ID）、`remoteIp`（TCP 来源 IP）、`userAgent`、`clientUuid`（已识别 Agent 的 uuid，v2 握手时即有，v1 需读首帧后才可知）。
- `msg`（帧对象）：`type`（`1` = text、`2` = binary）、`data`（text 为 string，binary 为 `ArrayBuffer`）、`connId`、`path`。
- 多个钩子按注册顺序**链式执行**，前一个钩子的替换结果作为下一个的输入；`drop` 优先于后续钩子。超时或钩子抛错时该帧**原样放行**并记入插件日志。卸载插件后 ws 钩子自动移除，已建立的连接恢复直通。

### server.injectHTML

```js
server.injectHTML(
  "<style>.plugin-badge{color:red}</style>",
  '<script src="/api/mjpeg_live.js"></script>',
);
```

- `head` 片段插入 `</head>` 之前，`body` 片段插入 `</body>` 之前（大小写不敏感）。
- 作用于全部 HTML 页面（含管理页、终端页、登录页、公共页）。

### server.registerRPC

```js
server.registerRPC("plugin:greet", (params) => {
  return { echo: params, from: "example" };
});
```

- 方法名不能为空，不能以 `rpc.` 开头（保留前缀）；建议使用 `plugin:<名称>:<动作>` 命名，避免与系统方法冲突。
- 抛出的 JS `Error` 会映射为 JSON-RPC 错误（`err.code` / `err.message` / `err.data` 被传递）。
- 始终授予；同一次加载内重复注册为无操作，卸载时自动注销。

### server.cron

```js
server.cron("0 0 9 * * *", async () => {
  /* 每天早上 9 点运行 */
});
server.cron("@every 1m", () => {
  /* 每分钟运行一次 */
});
```

- 支持 5 字段 / 6 字段 cron 表达式或 `@every <duration>`（如 `@every 1m`、`@every 30s`）；字段支持 `*`、`*/n`、`a-b`、逗号列表。
- 非法表达式使加载失败（错误写入 `last_error`，插件自动禁用）；handler 抛错只记录日志，不影响后续触发。

### server.getConfig

```js
const config = await server.getConfig();
console.log(config.interval); // 已合并默认值
```

返回 Promise，resolve 为 `{ [key]: value }` 对象；合并规则见 [托管配置文档](../managed-config#默认值合并规则)。始终授予。

## 兼容性说明

插件运行在基于 [goja](https://github.com/dop251/goja) 的沙箱运行时中：每个插件一个独立 VM + 事件循环，支持 CommonJS、Node 风格模块和 Web API，但**不是浏览器，也不是完整的 Node.js**。接口状态分为 `可用` / `部分实现` / `固定值或抛错` / `未实现`，本文只描述运行时**实际提供**的接口——「名称相同」不代表边界行为与浏览器或 Node.js 一致。

### 权限开关对运行时的影响

| manifest 字段                                          | 运行时效果                                                                                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `node: true`                                           | 注入 `Buffer` / `process` / `global` / `__dirname` / `__filename` 和 events/path/os/process/fs/child_process/net/http/stream/crypto 模块 |
| `allowExec: true`                                      | `child_process` 与 `process.kill()` 可用                                                                                                 |
| `allowListen: true`                                    | `net` / `http` Server 可绑定本地端口（默认 `127.0.0.1`）                                                                                 |
| `allowAllFileAccess: true`                             | `require` 与 `fs` 可访问插件目录外路径                                                                                                   |
| `maxHTTPBodyBytes` / `maxChildOutputBytes` / `timeout` | 缓冲上限 / 子进程输出上限 / 单次执行超时（默认 30 秒）                                                                                   |

### Web API 与基础接口

- **fetch**：`fetch(input, init)` 及 `Headers`、`EventTarget`、`AbortController`、`AbortSignal`（含静态 `abort/timeout/any`）、`Blob`、`File`、`FormData`、`Request`、`Response` 均可用。所有 body **完整缓冲**（`Response.body` 固定为 `null`，上限 32 MiB）；无 Cookie、CORS、同源策略、缓存语义；redirect 仅支持 `follow` / `manual` / `error`。
- **XMLHttpRequest**：`open` / `setRequestHeader` / `getResponseHeader` / `getAllResponseHeaders` / `send` / `abort`、`responseType`（`""`/`text`/`json`/`arraybuffer`/`blob`/`document`）、`timeout` 及标准事件均可用。`responseXML` 固定 `null`；同步模式 `open(..., false)` 会阻塞事件循环，且不允许非零 `timeout` 或非空 `responseType`。
- **ECMAScript**：标准 Promise/async-await、Array、Map/Set、TypedArray、JSON、`eval()`、`queueMicrotask`、`setTimeout` / `setInterval` / `setImmediate` 均可用。**不支持** `for await...of` 与 async generator（需手动循环调用 `[Symbol.asyncIterator]().next()`）；timer handle 的 `ref/unref/refresh/hasRef` 未实现。
- **console**：`assert / debug / error / exception / info / log / trace / warn`，支持基础 `%s %d %i %f %o %O %c %%` 格式化；`table`、`dir`、`time/timeEnd`、`count`、`group`、`clear` 等未实现。输出进入插件日志缓冲区（64 KiB 环形）。

### Node 兼容模块

| 模块            | 可用                                                                                                  | 说明                                                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `buffer`        | `Buffer.from/alloc/poolSize`、Uint8Array 继承、`equals/toString/write`、BE/LE 数值读写                | 无需 `node` 权限；`concat/isBuffer/byteLength/compare/allocUnsafe*` 等未实现                           |
| `url`           | `URL`（部分）、`URLSearchParams`（完整）                                                              | 无需 `node` 权限；旧式 `parse/format/resolve` 等未实现                                                 |
| `util`          | `util.format()`                                                                                       | 无需 `node` 权限；`inspect/promisify/types` 等未实现                                                   |
| `events`        | `EventEmitter` 全接口（含静态 `listenerCount/once/on`）                                               | 需 `node` 权限                                                                                         |
| `stream`        | `Readable` / `Writable` / `Duplex` / `Transform` / `PassThrough` / `pipeline` / `finished`，真实背压  | 无 Web Streams（`stream/web` 未实现）；`net.Socket` 未接入 stream                                      |
| `fs`            | 同步 / 回调 / `fs.promises` / `createReadStream` / `createWriteStream`                                | 沙箱限定在插件目录与 `__storageDir__`；`watch/cp/link/opendir/statfs` 等未实现                         |
| `path`          | `sep/normalize/isAbsolute/join/resolve/relative/...` 及 `posix`/`win32`                               | —                                                                                                      |
| `os`            | `arch/platform/hostname/homedir/tmpdir/...`                                                           | 指标读取**宿主机**而非插件；Windows 上 `loadavg()` 为零值                                              |
| `process`       | `env/argv/pid/cwd/memoryUsage/...`                                                                    | `versions.node` 固定 `"0.0.0-goja"`；`kill()` 需 `allowExec`；`exit()/abort()` 只抛错，不会退出 Komari |
| `child_process` | `spawn/exec/execFile` 及 Sync 版                                                                      | 需 `allowExec`；`fork` 抛错；无 IPC（`send()` 报告未启用）                                             |
| `net`           | TCP `createServer/connect/createConnection/isIP`；Server `listen/close/address`                       | `listen` 需 `allowListen`（默认 `127.0.0.1`）；无 UDP / TLS / Unix socket                              |
| `http`          | `createServer/request/get`、`Agent`、`IncomingMessage`、`ServerResponse`                              | `listen` 需 `allowListen`；无独立 `https` 模块（但 `fetch` 与 `http.request` 可请求 HTTPS）            |
| `crypto`        | 摘要 / 随机 / 派生（pbkdf2、scrypt）/ 对称加密（AES、ChaCha20-Poly1305）/ 签名（RSA、ECDSA、Ed25519） | `generateKeyPairSync`、`KeyObject`、`webcrypto` 等未实现                                               |

### 常见但未实现

| 类别          | 未实现示例                                                                                   |
| ------------- | -------------------------------------------------------------------------------------------- |
| 浏览器 DOM    | `window`、`document`、`navigator`、`location`、storage、canvas                               |
| 浏览器网络    | `WebSocket`、`EventSource`、WebCrypto、Web Streams                                           |
| 模块系统      | ESM `import/export`、动态 `import()`、`require.resolve/cache/extensions/main`                |
| Node 核心模块 | `https`、`tls`、`dns`、`dgram`、`zlib`、`worker_threads`、`cluster`、`readline`、`assert` 等 |
| timer         | handle 的 `ref/unref/refresh/hasRef`                                                         |
| 资源隔离      | 没有按插件的 CPU/内存/网络配额；`process.memoryUsage()` 统计整个 Komari 进程                 |

### 使用建议

1. 优先使用异步 API（Promise 版 fs、异步 fetch、异步 child process）；同步 XHR、同步 fs、`execSync` 会阻塞插件自己的事件循环。
2. 引入 npm/CommonJS 包前先核对它依赖的 Node 核心模块——纯 JavaScript 不代表能在当前兼容子集上运行。
3. 不要用「方法名是否存在」做能力检测：很多方法存在但返回固定值或抛错。
4. 每个插件的 `timeout` 约束所有单次执行；长任务请拆分为多次异步步骤。
