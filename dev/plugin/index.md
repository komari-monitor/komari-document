# 插件开发指南

Komari 支持通过 **JavaScript 插件** 扩展服务端能力。插件是一个 ZIP 包，包含清单文件
（`komari-plugin.json`）和入口脚本。插件在服务端进程中运行于独立的
goja JS 运行时（沙箱），可以注册 HTTP 路由、拦截 HTTP 请求/响应、调用系统 RPC、
注册自己的 RPC 方法、声明配置项并注入管理页面。

::: warning 安全提示
插件将继承**Komari的系统权限**，且可能申请访问文件系统、执行子进程、监听端口等敏感能力。
只安装你信任的插件；安装第三方插件前请仔细阅读其声明的权限。
:::

## 插件能做什么

| 能力                  | API                      | 需要的权限                       | 说明                                                                                             |
| --------------------- | ------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------ |
| 注册 RPC 方法         | `server.registerRPC`     | 始终授予                         | 注册 `plugin:xxx` 命名的方法，供前端或其他插件调用                                               |
| 定时任务              | `server.cron`            | 始终授予                         | 按 cron 表达式在插件事件循环上定时执行 handler                                                   |
| 调用系统 RPC          | `server.call`            | `allowSystemRPC`                 | 以管理员身份调用任意已注册 RPC 方法                                                              |
| 注册 HTTP 路由        | `server.route`           | `allowRoutes`                    | 在服务端引擎上注册 `METHOD /path`，支持流式响应                                                  |
| 挂载静态文件夹        | `server.static`          | `allowRoutes`                    | 在服务端引擎上挂载插件目录内的静态文件夹，可选 SPA 回退（`{ spa: true }`）                       |
| 拦截 HTTP 请求/响应   | `server.hook`            | `allowHooks`                     | 修改进入和离开服务端的所有 HTTP 请求/响应                                                        |
| 向所有页面嵌入 CSS/JS | `server.injectHTML`      | `allowHTMLInject`                | 向每个 HTML 响应嵌入 head/body 片段（含管理页、终端页）                                          |
| 读取插件配置          | `server.getConfig`       | 始终授予                         | 读取保存的配置（与清单默认值合并）                                                               |
| 声明配置项            | manifest `configuration` | 无需权限                         | 管理界面自动生成配置表单                                                                         |
| 注入管理页面          | manifest `pages`         | 无需权限                         | 在管理界面侧边栏显示 iframe / redirect 页面                                                      |
| 文件访问              | `fs` / `require`         | 插件目录与长期存储目录内始终授予 | 沙箱限定在插件目录和 `__storageDir__`（`data/plugin-data/<short>`）；越界需 `allowAllFileAccess` |
| Node 兼容模块         | `node` 模块              | `node`                           | events/fs/path/os/process/net/http/crypto 等                                                     |
| 子进程                | `child_process`          | `allowExec`                      | 执行外部命令                                                                                     |
| 端口监听              | `net`/`http` Server      | `allowListen`                    | 绑定本地端口（默认 `127.0.0.1`）                                                                 |

## 使用 SDK 快速开始

推荐使用已发布的 SDK 包和 `create-komari-plugin` 创建项目。它提供 TypeScript
类型提示、VS Code 补全、manifest 悬停说明、本地构建，以及自动上传和热重载。

### 前置条件

- Node.js 20 或更高版本
- 可以访问的 Komari 开发服务器
- 具有安装和管理插件权限的 API Key
- 使用 VS Code 打开生成的项目目录

开发服务器地址和 API Key 属于敏感信息。创建器会将它们保存到
`komari.local.json`，并默认加入 `.gitignore`，不要提交该文件。

### 创建项目

在希望创建项目的目录执行：

```sh
npm create komari-plugin
```

`npm run dev` 会编译 TypeScript、打包插件、上传到配置的服务器、启用插件，
并输出插件运行时日志；同时监听源码和 manifest 的变化。文件变化后会自动重复
这套流程。使用 `Ctrl+C` 停止监听。

终端中的 `[dev:log]` 来自 Komari 的插件运行时日志缓冲区，与管理界面显示的
插件日志相同；构建信息和 `enabled/running` 状态属于本地开发工具输出。

### 生成的项目结构

```text
hello/
├── src/plugin.ts          # TypeScript 插件源码
├── komari-plugin.json     # 插件 manifest
├── komari.local.json      # 本地服务器地址和 API Key，禁止提交
├── package.json
└── tsconfig.json
```

生成的 manifest 已引用 SDK Schema。在 VS Code 中可以获得字段补全、校验和英文
悬停说明：

```json
{
  "$schema": "./node_modules/@komari-monitor/plugin-sdk/schema/komari-plugin.schema.json"
}
```

## 手动 ZIP 工作流

### 1. 创建插件目录

```
hello/
├── komari-plugin.json
└── script.js
```

### 2. 编写清单 `komari-plugin.json`

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

字段说明详见 [清单文件参考](./manifest)。

### 3. 编写入口脚本 `script.js`

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

- 顶层脚本在插件加载时立即执行，但推荐把逻辑放在全局 `load()` 函数中。
- `load()` 在每次启用/启动时调用；`unload()` 在禁用、卸载或服务端关闭时调用。

### 4. 打包并安装

将 `komari-plugin.json` 和 `script.js` 直接打包到 ZIP 的**根目录**（不要套一层文件夹），
然后在管理界面「插件」页面点击上传。

### 5. 启用插件

安装后插件默认处于**禁用**状态，需要手动启用。

::: tip 安装限制
ZIP 最多 10,000 个文件、单文件 ≤ 128 MiB、解压总量 ≤ 512 MiB、清单文件 ≤ 1 MiB。
:::

## 生命周期

### 加载 `load()`

1. 服务端读取并校验 `komari-plugin.json`，检查 `komari` 版本约束。
2. 创建独立 JS 运行时（沙箱根目录为 `data/plugin/<short>`，长期存储目录
   `data/plugin-data/<short>` 以 `__storageDir__` 注入），**立即执行**入口脚本。
3. 如果脚本定义了全局 `load()` 函数，则调用它。
4. 顶层脚本抛错或 `load()` 抛错 → 插件被**自动禁用**。

### 卸载 `unload()`

禁用、删除插件或服务端关闭时触发：

1. 先从实例表移除插件（此时 `server.call` 会以「not loaded」拒绝）。
2. 调用全局 `unload()`（若定义；错误仅记录，不阻塞）。
3. 注销该插件注册的 RPC 方法，清除路由处理器和钩子，关闭运行时。

::: tip 路由槽位
插件注册的 gin 路由槽位在卸载后**仍然保留**：此时访问该路由返回 **404**，插件重新加载后
自动恢复。重新安装（覆盖安装）也会先卸载再恢复其持久化的启用状态。
:::

## 长期存储目录 `__storageDir__`

每个插件在启用时会获得独立的长期存储目录：

```text
data/plugin-data/<short>/   # 长期存储
```

- 与代码目录 `data/plugin/<short>`（ZIP 解压内容）完全分离，`fs` 沙箱同时覆盖两个目录。
- 脚本通过全局 `__storageDir__` 访问它（`NodeJS` 模式注入，绝对路径）：
  ```js
  const fs = require("fs");
  const path = require("path");
  fs.writeFileSync(path.join(__storageDir__, "cache.json"), "{}");
  ```
- **更新（覆盖安装）只替换代码目录，长期存储保留**，适合存放缓存、用户数据等。
- **显式删除插件时两目录一起移除**（删除即彻底清除）。
- 沙箱规则与插件目录一致：无法越出 `__storageDir__`，也不能访问其他插件的存储目录；
  跨目录的 `fs.renameSync`（插件目录 ↔ 存储目录）会被拒绝。

## 权限与批准

### 权限模型

- **始终授予**（无需声明，不触发批准）：`server.registerRPC`、`server.cron`、
  `server.getConfig`、插件目录内及 `__storageDir__` 内的文件访问。
- **声明即授予**：`permissions.node`（Node 兼容模块）、`maxHTTPBodyBytes`、
  `maxChildOutputBytes`、`timeout` —— 运行时设置，不触发批准。
- **需管理员批准**：
  `allowSystemRPC`、`allowRoutes`、`allowHooks`、`allowHTMLInject`、`allowExec`、
  `allowListen`、`allowAllFileAccess`。

### 权限缺失时的行为

| API                                                                    | 缺权限时的表现                                     |
| ---------------------------------------------------------------------- | -------------------------------------------------- |
| `server.route` / `server.static` / `server.hook` / `server.injectHTML` | **加载时**抛 `TypeError`，插件加载失败（自动禁用） |
| `server.call`                                                          | 返回的 Promise 被**拒绝**（不阻塞加载）            |
| `require("child_process")`                                             | 抛错（无 `allowExec`）                             |
| `net`/`http` Server `listen()`                                         | 抛错（无 `allowListen`）                           |
| `fs` / `require` 越界路径                                              | 被沙箱拒绝（无 `allowAllFileAccess`）              |

## 调试

每个插件有一个独立的 64 KiB 环形日志缓冲区，`console.*` 输出和生命周期/钩子错误都会
写入其中（每次加载时清空）。通过 RPC2 方法 `admin:getPluginLogs`（参数 `{short}`）获取：

```
POST /api/rpc2
{"jsonrpc":"2.0","id":1,"method":"admin:getPluginLogs","params":{"short":"hello"}}
```

::: tip
插件加载失败时，管理界面「插件」列表会显示 `last_error`。结合插件日志即可定位大多数
问题（如权限缺失、运行时 API 使用不当）。
:::

## 安全与限制

- 插件沙箱根目录为 `data/plugin/<short>` 与 `data/plugin-data/<short>`（`__storageDir__`）：
  `fs` 和 `require` 被限制在这两个目录内，路径穿越和指向目录外的软链接在操作系统层
  （`os.Root`）被拒绝。
- `server.call` 以**管理员身份**执行——插件调用 `admin:*` 方法等于管理员本人操作。
- JS 运行时**不是**浏览器也不是完整 Node.js：没有 DOM、WebSocket、ESM、`for await...of`、
  完整 `fs` 等。依赖任何 API 前请先阅读 [JS 运行时参考](./runtime)。
- 单次执行受 `timeout`（默认 30 秒）限制：脚本初始化、`load()`、路由处理器、钩子、
  RPC 处理器、fetch 都受此约束。路由处理器超时未 `end()` 会返回 **504**。
- 没有按插件的 CPU/内存/网络配额；`process.memoryUsage()` 等读取的是整个 Komari 进程。

## 继续阅读

| 文档                        | 内容                                                                                                                                                              |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [清单文件参考](./manifest)  | `komari-plugin.json` 全部字段、权限、配置项、页面                                                                                                                 |
| [server 模块](./server-api) | `server.route` / `server.static` / `server.hook` / `server.injectHTML` / `server.call` / `server.registerRPC` / `server.cron` / `server.getConfig` 与生命周期钩子 |
| [JS 运行时](./runtime)      | 沙箱内可用的全部 JavaScript API 与兼容性                                                                                                                          |
| [RPC 接口](./rpc)           | `server.call` 可调用的全部系统 RPC 方法                                                                                                                           |
| [发布到插件市场](./market)  | 将插件发布到官方插件市场                                                                                                                                          |
