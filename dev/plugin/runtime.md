# JS 运行时参考

插件运行在基于 [goja](https://github.com/dop251/goja) 的服务端 JavaScript 运行时
（`jsruntime`）中：每个插件一个独立 VM + 事件循环，CommonJS 模块加载、Node 风格
模块、Web API 一应俱全，但**不是浏览器，也不是完整的 Node.js**。

::: warning 兼容性
本文只描述运行时**实际提供**的接口。「名称相同」不代表所有边界行为与浏览器或
Node.js 一致。依赖任何 API 前请先查阅本文状态。
:::

## 状态定义

| 状态 | 含义 |
| --- | --- |
| `可用` | 主要行为已实现，可按列出的签名使用 |
| `部分实现` | 常见用法可用，但参数、流式或边界语义不完整 |
| `固定值/调用抛错` | 名称存在但返回占位值；无真实语义的方法明确抛错 |
| `未实现` | 未注入，调用或 `require()` 会失败 |

## 权限开关对运行时的影响

插件的 `permissions.node` 决定是否注入 Node 兼容模块；`allowExec`、`allowListen`、
`allowAllFileAccess` 分别决定子进程、端口监听、越界文件访问。

| manifest 字段 | 运行时效果 |
| --- | --- |
| `node: true` | 注入 `Buffer`/`process`/`global`/`__dirname`/`__filename` 全局变量和 events/path/os/process/fs/child_process/net/http/stream/crypto 模块 |
| `allowExec: true` | `child_process` 与 `process.kill()` 可用 |
| `allowListen: true` | `net`/`http` Server 可绑定本地端口（默认 `127.0.0.1`） |
| `allowAllFileAccess: true` | `require` 与 `fs` 可访问插件目录外路径 |
| `maxHTTPBodyBytes` | fetch 响应体、HTTP 请求体缓冲上限（默认 32 MiB） |
| `maxChildOutputBytes` | 子进程 stdout/stderr 上限（默认 1 MiB） |
| `timeout` | 单次执行超时（默认 30 秒），约束脚本初始化、调用、fetch、钩子、路由等一切 JS 执行 |

## 始终可用的 API

### ECMAScript 与事件循环

- goja 提供标准 ECMAScript：Promise/async-await、Array、Map/Set、TypedArray、JSON、
  `eval()`（其中的同步死循环仍可被 `timeout` 中断）。
- `queueMicrotask(callback)`：可用。
- `setTimeout` / `setInterval` / `setImmediate` 与对应 clear 方法：可用，支持附加参数；
  interval 在回调执行超时失败时自动清理。
- timer handle 的 `ref/unref/refresh/hasRef`：**未实现**。
- `for await...of` 与 async generator 语法：**当前 goja 版本不支持**，异步迭代请手动
  循环调用 `[Symbol.asyncIterator]().next()`。

### console

```text
assert  debug  error  exception  info  log  trace  warn
```

- 支持 `%s %d %i %f %o %O %c %%` 基础格式化；`exception()` 是 `error()` 别名。
- `table`、`dir`、`time/timeEnd`、`count`、`group`、`clear`、`profile` 等**未实现**。
- 输出进入插件日志缓冲区（64 KiB 环形），可用 `admin:getPluginLogs` 读取。

### Fetch API

`fetch(input, init)` 及 `Headers`、`EventTarget`、`Event`、`ProgressEvent`、
`DOMException`、`AbortController`、`AbortSignal`（含静态 `abort/timeout/any`）、
`Blob`、`File`、`FormData`、`Request`、`Response` 均可用。

主要差异：

- 所有 body **完整缓冲**，`Response.body` 固定为 `null`；`Blob.stream()` 是一次性读取器。
- body 上限 32 MiB（`maxHTTPBodyBytes`）。
- 没有 Cookie、CORS、同源策略、缓存语义；`Request.destination` 固定 `""`，
  `duplex` 固定 `"half"`。
- redirect 只支持 `follow` / `manual` / `error`。

### XMLHttpRequest

`XMLHttpRequest` 可用：`open/setRequestHeader/getResponseHeader/getAllResponseHeaders/
send/abort`、`responseType`（`""`/`text`/`json`/`arraybuffer`/`blob`/`document`）、
`timeout`、事件 `readystatechange/loadstart/progress/abort/error/load/timeout/loadend`。

- `responseXML` 固定 `null`；`document` 类型的 response 固定 `null`。
- 同步模式 `open(..., false)` 可用，但会阻塞事件循环，且不允许非零 `timeout` 或非空
  `responseType`。

### 兼容模块（无需 `node` 权限）

| 模块 | 可用接口 | 未实现 |
| --- | --- | --- |
| `require("buffer")` | `Buffer.from/alloc/poolSize`、Uint8Array 继承、`equals/toString/write`、BE/LE 数值读写 | `concat/isBuffer/byteLength/compare/allocUnsafe*/transcode` |
| `require("url")` | `URL`（部分）、`URLSearchParams`（完整）、`domainToASCII/domainToUnicode` | 旧式 `parse/format/resolve` 等 |
| `require("util")` | `util.format()` | `inspect/promisify/types` 等 |

```js
const { Buffer } = require("buffer");
const { URLSearchParams } = require("node:url");
```

## Node.js 兼容模块（`permissions.node: true`）

启用后注入全局 `Buffer`、`process`、`global`、`__dirname`、`__filename`，并注册以下
模块（`require("name")` 与 `require("node:name")` 均可）：

### events

`EventEmitter`：`on/once/prependListener/prependOnceListener/emit/removeListener/off/
removeAllListeners/listeners/rawListeners/listenerCount/eventNames/...`；
静态 `listenerCount/getEventListeners/once`（返回 Promise）/`on`（async iterator）。

### stream

`Readable`、`Writable`、`Duplex`、`Transform`、`PassThrough`、`Stream`、`pipeline`、
`finished`、`addAbortSignal`、`isErrored`、`isReadable`、`getDefaultHighWaterMark`；
`stream/promises` 提供 Promise 版 `pipeline`/`finished`。真实背压语义。

- 无 Web Streams（`stream/web`、`ReadableStream` 等未实现）。
- fs 流、`process.std*`、`child_process` stdio、`http` 的 `IncomingMessage`/
  `ServerResponse` 都是真实 stream 实例，可 `pipe`/`pipeline`/`finished`。
- `net.Socket` 未接入 stream 模块。

### fs

- 同步：`readFileSync/writeFileSync/appendFileSync/existsSync/accessSync/statSync/
  lstatSync/readdirSync/mkdirSync/rmSync/unlinkSync/rmdirSync/renameSync/copyFileSync/
  realpathSync/readlinkSync/symlinkSync/truncateSync/chmodSync/utimesSync/mkdtempSync/
  openSync/closeSync/fstatSync/fsyncSync/readSync/writeSync`
- 回调：同名方法 + `exists(path, cb)`（旧式 boolean 回调）。
- Promise：`fs.promises` 提供回调版除 `exists` 外的全部方法；`open()` 返回简化
  FileHandle（`fd/close/stat/sync/read/write`）。
- 流：`createReadStream` / `createWriteStream`（真实 stream，支持背压）。
- `Stats` 身份字段固定（`dev/ino/uid/gid/rdev=0`、`nlink=1`、`blksize=4096`，
  时间取自 ModTime）；`Dirent` 提供 `name` 与类型判断。
- 未实现：`watch/watchFile/unwatchFile/opendir/cp/link/statfs/lutimes`、完整 FileHandle、
  `readdir` recursive。
- **默认沙箱在插件目录和 `__storageDir__` 长期存储目录内**（路径穿越/软链接越界在系统层
  拒绝）；相对路径从插件目录解析，`__storageDir__` 为绝对路径。

### path

`sep/delimiter/normalize/isAbsolute/join/resolve/relative/dirname/basename/extname/
parse/format/toNamespacedPath`，以及 `posix`/`win32`。

### os

`arch/platform/type/release/version/machine/hostname/homedir/tmpdir/endianness/EOL/
devNull/uptime/loadavg/totalmem/freemem/availableParallelism/cpus/userInfo/
networkInterfaces/constants`。指标读取**宿主机**而非插件。Windows 上 `loadavg()` 为
零值；`userInfo().uid/gid` 是字符串。

### process

`env/argv/execArgv/execPath/pid/ppid/platform/arch/version/versions/release/title/
exitCode/connected/config`、`cwd()/chdir()/uptime()/memoryUsage()/cpuUsage()/
resourceUsage()/hrtime()/nextTick()/emitWarning()/kill()/exit()/abort()/stdout/
stderr/stdin`。

差异：

- `env` 是宿主环境快照；`version` 来自 Go，`versions.node` 固定 `"0.0.0-goja"`。
- `memoryUsage()/cpuUsage()/resourceUsage()` 统计**整个 Komari 进程**，不能用于衡量
  插件自身。
- `kill()` 需要 `allowExec`；`exit()/abort()` 只抛错，不会退出 Komari。
- `stdout/stderr` 是 Writable（同步写入可能阻塞事件循环）；`stdin` 是永不产生数据的
  Readable。

### child_process（需 `allowExec`）

`spawn/exec/execFile`、`spawnSync/execSync/execFileSync`；`fork` 抛错。options 支持
`cwd`（限定在插件目录内）/`env`/`shell`/`timeout`/`encoding`/`maxBuffer`（只能收紧
1 MiB 全局上限）。无 IPC（`connected=false`、`send()` 报告未启用、`ref/unref` 抛错）。

### net（仅 TCP）

模块：`createServer/connect/createConnection/isIP/isIPv4/isIPv6`；Server：
`listen`（需 `allowListen`，默认 `127.0.0.1`）/`close/address/getConnections`；
Socket：`write/end/destroy/setEncoding/setTimeout/setNoDelay/setKeepAlive/address`。
`connect()` 是出站连接，不需要权限。

- 无 Unix socket / pipe / UDP / TLS；`pause/resume`、`ref/unref`、
  `closeAllConnections` 等调用抛错。
- `maxConnections` 不强制执行；异步 dial 完成前没有 `write/end/destroy`（等
  `connect` 事件）。

### http

模块：`createServer/request/get/METHODS/STATUS_CODES/maxHeaderSize/
validateHeaderName/validateHeaderValue/Agent/ClientRequest/globalAgent/
IncomingMessage/ServerResponse`。没有独立的 `https` 模块，但 `fetch` 与
`http.request` 可请求 HTTPS。

- Server `listen` 需 `allowListen`；请求体一次缓冲（受 `maxHTTPBodyBytes`）；
  handler 必须在 `timeout` 内 `end()`，否则 504。
- `IncomingMessage` 是 Readable（body 已完整缓冲，`complete` 固定 `true`）；
  `ServerResponse` 是 Writable（`setHeader/appendHeader/getHeader*/hasHeader/
  removeHeader/writeHead/write/end/destroy` 等）。
- ClientRequest 简化实现：请求体缓冲到 `end()` 后经 fetch 发送；
  `Agent.destroy()`、`flushHeaders/setNoDelay/setSocketKeepAlive` 调用抛错。

### crypto

- 摘要：`createHash/createHmac/hash/getHashes`（md5、sha1、sha224/256/384/512、
  sha512-224/256、sha3-*、ripemd160、blake2b512、blake2s256）。
- 随机：`randomBytes/randomFillSync/randomFill/randomInt/randomUUID/getRandomValues/
  timingSafeEqual`。
- 派生：`pbkdf2/pbkdf2Sync/scrypt/scryptSync`。
- 对称加密：`createCipheriv/createDecipheriv`（AES-CBC/CTR/ECB/GCM、
  ChaCha20-Poly1305）。注意 GCM/ChaCha 的 `update()` 返回**空 Buffer**，数据在
  `final()` 一次性返回；GCM `authTagLength` 仅支持 12–16。
- 签名：`createSign/createVerify/sign/verify`（RSA PKCS1v15、ECDSA、Ed25519，PEM 密钥）。
- 未实现：`generateKeyPairSync`、`KeyObject`、`webcrypto/SubtleCrypto`、RSA-OAEP/PSS、
  DH/ECDH。

## 常见但未实现的接口

| 类别 | 未实现示例 |
| --- | --- |
| 浏览器 DOM | `window`、`document`、`navigator`、`location`、storage、canvas |
| 浏览器网络 | `WebSocket`、`EventSource`、WebCrypto、Web Streams |
| 模块系统 | ESM `import/export`、动态 `import()`、顶层 `module/exports`、`require.resolve/cache/extensions/main` |
| Node 核心模块 | `https`、`tls`、`dns`、`dgram`、`zlib`、`worker_threads`、`cluster`、`readline`、`assert` 等 |
| timer | handle 的 `ref/unref/refresh/hasRef` |
| 资源隔离 | 没有单插件的 CPU/内存/网络配额；`process.memoryUsage()` 统计整个 Komari 进程 |

## 使用建议

1. 优先使用异步 API（Promise 版 fs、异步 fetch、异步 child process）；同步 XHR、
   同步 fs、`execSync` 等会阻塞插件自己的事件循环。
2. 引入 npm/CommonJS 包前先核对它依赖的 Node 核心模块——纯 JavaScript 不代表能在
   当前兼容子集上运行。
3. 不要用「方法名是否存在」做能力检测：存在但固定值/抛错的方法很多，详见上文。
4. 每个插件的 `timeout` 约束所有单次执行；长任务请拆分为多次异步步骤。
