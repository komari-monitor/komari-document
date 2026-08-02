# JS Runtime Reference

Plugins run in a server-side JavaScript runtime (`jsruntime`) built on
[goja](https://github.com/dop251/goja): one dedicated VM + event loop per plugin, with
CommonJS module loading, Node-style modules, and web APIs — but it is **not a browser
and not full Node.js**.

::: warning Compatibility
This page only describes the interfaces the runtime **actually provides**. A same-named
API does not imply identical edge-case behavior with browsers or Node.js. Consult this
page before relying on any API.
:::

## Status definitions

| Status | Meaning |
| --- | --- |
| `Available` | Core behavior implemented; usable with the documented signatures |
| `Partial` | Common usage works, but arguments, streaming, or edge semantics are incomplete |
| `Fixed value / throws` | The name exists but returns a placeholder; methods without real semantics throw explicitly |
| `Not implemented` | Not injected; calling it or `require()` fails |

## How manifest permissions affect the runtime

`permissions.node` controls whether Node compatibility modules are injected;
`allowExec`, `allowListen`, and `allowAllFileAccess` control child processes, port
listening, and out-of-directory file access respectively.

| Manifest field | Runtime effect |
| --- | --- |
| `node: true` | Injects `Buffer`/`process`/`global`/`__dirname`/`__filename` globals and the events/path/os/process/fs/child_process/net/http/stream/crypto modules |
| `allowExec: true` | `child_process` and `process.kill()` become available |
| `allowListen: true` | `net`/`http` Servers can bind local ports (default `127.0.0.1`) |
| `allowAllFileAccess: true` | `require` and `fs` can access paths outside the plugin directory |
| `maxHTTPBodyBytes` | Buffering limit for fetch response bodies and HTTP request bodies (default 32 MiB) |
| `maxChildOutputBytes` | Child process stdout/stderr cap (default 1 MiB) |
| `timeout` | Per-turn execution timeout (default 30 s), bounding script init, calls, fetch, hooks, routes, and all JS execution |

## APIs always available

### ECMAScript & event loop

- goja provides standard ECMAScript: Promise/async-await, Array, Map/Set, TypedArray,
  JSON, `eval()` (synchronous infinite loops inside it are still interruptible by
  `timeout`).
- `queueMicrotask(callback)`: available.
- `setTimeout` / `setInterval` / `setImmediate` and their clear methods: available,
  extra callback args supported; intervals are auto-cleared when a callback fails on
  execution timeout.
- Timer handle `ref/unref/refresh/hasRef`: **not implemented**.
- `for await...of` and async generators: **not supported by this goja version**; for
  async iteration, call `[Symbol.asyncIterator]().next()` manually in a loop.

### console

```text
assert  debug  error  exception  info  log  trace  warn
```

- Basic `%s %d %i %f %o %O %c %%` formatting; `exception()` is an alias of `error()`.
- `table`, `dir`, `time/timeEnd`, `count`, `group`, `clear`, `profile` etc. are
  **not implemented**.
- Output goes to the plugin log buffer (64 KiB ring), readable via
  `admin:getPluginLogs`.

### Fetch API

`fetch(input, init)` plus `Headers`, `EventTarget`, `Event`, `ProgressEvent`,
`DOMException`, `AbortController`, `AbortSignal` (incl. static `abort/timeout/any`),
`Blob`, `File`, `FormData`, `Request`, `Response`.

Key differences:

- All bodies are **fully buffered**; `Response.body` is always `null`; `Blob.stream()`
  is a one-shot reader.
- Body limit 32 MiB (`maxHTTPBodyBytes`).
- No cookies, CORS, same-origin policy, or caching semantics; `Request.destination` is
  fixed `""`, `duplex` fixed `"half"`.
- Redirects: only `follow` / `manual` / `error`.

### XMLHttpRequest

`XMLHttpRequest` is available: `open/setRequestHeader/getResponseHeader/
getAllResponseHeaders/send/abort`, `responseType` (`""`/`text`/`json`/`arraybuffer`/
`blob`/`document`), `timeout`, events `readystatechange/loadstart/progress/abort/error/
load/timeout/loadend`.

- `responseXML` is always `null`; `document` responses are `null` too.
- Synchronous mode `open(..., false)` works but blocks the event loop and forbids a
  non-zero `timeout` or non-empty `responseType`.

### Compatibility modules (no `node` permission needed)

| Module | Available | Not implemented |
| --- | --- | --- |
| `require("buffer")` | `Buffer.from/alloc/poolSize`, Uint8Array inheritance, `equals/toString/write`, BE/LE numeric reads/writes | `concat/isBuffer/byteLength/compare/allocUnsafe*/transcode` |
| `require("url")` | `URL` (partial), `URLSearchParams` (complete), `domainToASCII/domainToUnicode` | legacy `parse/format/resolve` etc. |
| `require("util")` | `util.format()` | `inspect/promisify/types` etc. |

```js
const { Buffer } = require("buffer");
const { URLSearchParams } = require("node:url");
```

## Node.js compatibility modules (`permissions.node: true`)

Injects global `Buffer`, `process`, `global`, `__dirname`, `__filename` and registers
the following modules (both `require("name")` and `require("node:name")` work):

### events

`EventEmitter`: `on/once/prependListener/prependOnceListener/emit/removeListener/off/
removeAllListeners/listeners/rawListeners/listenerCount/eventNames/...`; statics
`listenerCount/getEventListeners/once` (returns a Promise)/`on` (async iterator).

### stream

`Readable`, `Writable`, `Duplex`, `Transform`, `PassThrough`, `Stream`, `pipeline`,
`finished`, `addAbortSignal`, `isErrored`, `isReadable`, `getDefaultHighWaterMark`;
`stream/promises` provides Promise-based `pipeline`/`finished`. Real backpressure
semantics.

- No Web Streams (`stream/web`, `ReadableStream`, etc. not implemented).
- fs streams, `process.std*`, `child_process` stdio, and `http`'s `IncomingMessage`/
  `ServerResponse` are real stream instances supporting `pipe`/`pipeline`/`finished`.
- `net.Socket` is not integrated with streams.

### fs

- Sync: `readFileSync/writeFileSync/appendFileSync/existsSync/accessSync/statSync/
  lstatSync/readdirSync/mkdirSync/rmSync/unlinkSync/rmdirSync/renameSync/copyFileSync/
  realpathSync/readlinkSync/symlinkSync/truncateSync/chmodSync/utimesSync/mkdtempSync/
  openSync/closeSync/fstatSync/fsyncSync/readSync/writeSync`
- Callback: same methods minus `*Sync`, plus `exists(path, cb)` (Node legacy boolean
  callback).
- Promises: `fs.promises` provides all callback methods except `exists`; `open()`
  returns a simplified FileHandle (`fd/close/stat/sync/read/write`).
- Streams: `createReadStream` / `createWriteStream` (real streams with backpressure).
- `Stats` identity fields are fixed (`dev/ino/uid/gid/rdev=0`, `nlink=1`,
  `blksize=4096`, times from ModTime); `Dirent` provides `name` and type checks.
- Not implemented: `watch/watchFile/unwatchFile/opendir/cp/link/statfs/lutimes`, full
  FileHandle, `readdir` recursive.
- **Sandboxed to the plugin directory and the `__storageDir__` long-term storage
  directory by default** (traversal/symlink escapes are rejected at the OS level);
  relative paths resolve from the plugin directory, `__storageDir__` is absolute.

### path

`sep/delimiter/normalize/isAbsolute/join/resolve/relative/dirname/basename/extname/
parse/format/toNamespacedPath`, plus `posix`/`win32`.

### os

`arch/platform/type/release/version/machine/hostname/homedir/tmpdir/endianness/EOL/
devNull/uptime/loadavg/totalmem/freemem/availableParallelism/cpus/userInfo/
networkInterfaces/constants`. Metrics report the **host machine**, not the plugin.
`loadavg()` is zero on Windows; `userInfo().uid/gid` are strings.

### process

`env/argv/execArgv/execPath/pid/ppid/platform/arch/version/versions/release/title/
exitCode/connected/config`, `cwd()/chdir()/uptime()/memoryUsage()/cpuUsage()/
resourceUsage()/hrtime()/nextTick()/emitWarning()/kill()/exit()/abort()/stdout/
stderr/stdin`.

Differences:

- `env` is a snapshot of the host environment; `version` comes from Go,
  `versions.node` is fixed `"0.0.0-goja"`.
- `memoryUsage()/cpuUsage()/resourceUsage()` measure the **whole Komari process**, not
  the plugin.
- `kill()` requires `allowExec`; `exit()/abort()` only throw — they never exit Komari.
- `stdout/stderr` are Writable (synchronous writes may block the event loop); `stdin`
  is a Readable that never produces data.

### child_process (requires `allowExec`)

`spawn/exec/execFile`, `spawnSync/execSync/execFileSync`; `fork` throws. Options:
`cwd` (confined to the plugin dir)/`env`/`shell`/`timeout`/`encoding`/`maxBuffer` (can
only tighten the 1 MiB global cap). No IPC (`connected=false`, `send()` reports not
enabled, `ref/unref` throw).

### net (TCP only)

Module: `createServer/connect/createConnection/isIP/isIPv4/isIPv6`; Server:
`listen` (requires `allowListen`, default `127.0.0.1`)/`close/address/getConnections`;
Socket: `write/end/destroy/setEncoding/setTimeout/setNoDelay/setKeepAlive/address`.
`connect()` is an outbound connection and needs no permission.

- No Unix sockets / pipes / UDP / TLS; `pause/resume`, `ref/unref`,
  `closeAllConnections` etc. throw.
- `maxConnections` is not enforced; placeholder sockets have no `write/end/destroy`
  before the async dial completes (wait for the `connect` event).

### http

Module: `createServer/request/get/METHODS/STATUS_CODES/maxHeaderSize/
validateHeaderName/validateHeaderValue/Agent/ClientRequest/globalAgent/
IncomingMessage/ServerResponse`. There is no separate `https` module, but `fetch` and
`http.request` can request HTTPS URLs.

- Server `listen` requires `allowListen`; request bodies are buffered once (limited by
  `maxHTTPBodyBytes`); handlers must call `end()` within `timeout` or the client gets
  504.
- `IncomingMessage` is a Readable (body fully buffered, `complete` fixed `true`);
  `ServerResponse` is a Writable (`setHeader/appendHeader/getHeader*/hasHeader/
  removeHeader/writeHead/write/end/destroy`, etc.).
- ClientRequest is simplified: the body is buffered until `end()` and sent via fetch;
  `Agent.destroy()`, `flushHeaders/setNoDelay/setSocketKeepAlive` throw.

### crypto

- Hashes: `createHash/createHmac/hash/getHashes` (md5, sha1, sha224/256/384/512,
  sha512-224/256, sha3-*, ripemd160, blake2b512, blake2s256).
- Random: `randomBytes/randomFillSync/randomFill/randomInt/randomUUID/getRandomValues/
  timingSafeEqual`.
- Derivation: `pbkdf2/pbkdf2Sync/scrypt/scryptSync`.
- Symmetric: `createCipheriv/createDecipheriv` (AES-CBC/CTR/ECB/GCM,
  ChaCha20-Poly1305). Note: GCM/ChaCha `update()` returns an **empty Buffer**; data
  arrives at `final()`. GCM `authTagLength` only supports 12–16.
- Signing: `createSign/createVerify/sign/verify` (RSA PKCS1v15, ECDSA, Ed25519, PEM
  keys).
- Not implemented: `generateKeyPairSync`, `KeyObject`, `webcrypto/SubtleCrypto`,
  RSA-OAEP/PSS, DH/ECDH.

## Common but not implemented

| Category | Examples |
| --- | --- |
| Browser DOM | `window`, `document`, `navigator`, `location`, storage, canvas |
| Browser networking | `WebSocket`, `EventSource`, WebCrypto, Web Streams |
| Module system | ESM `import/export`, dynamic `import()`, top-level `module/exports`, `require.resolve/cache/extensions/main` |
| Node core modules | `https`, `tls`, `dns`, `dgram`, `zlib`, `worker_threads`, `cluster`, `readline`, `assert`, etc. |
| Timers | handle `ref/unref/refresh/hasRef` |
| Resource isolation | no per-plugin CPU/memory/network quotas; `process.memoryUsage()` measures the whole Komari process |

## Recommendations

1. Prefer async APIs (Promise-based fs, async fetch, async child processes);
   synchronous XHR, sync fs, and `execSync` block the plugin's own event loop.
2. Before adding npm/CommonJS packages, verify the Node core modules they depend on —
   pure JavaScript does not guarantee compatibility with this subset.
3. Do not use "the name exists" as a capability check: many methods exist but return
   fixed values or throw, as listed above.
4. The plugin's `timeout` bounds every single execution; split long-running work into
   multiple async steps.
