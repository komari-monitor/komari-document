# Plugin Development Guide

## Introduction

Komari supports extending the server with **JavaScript plugins**. A plugin is a ZIP package containing a manifest (`komari-plugin.json`) and an entry script (default `script.js`). Plugins run inside the server process in their own sandboxed goja JS runtime, and can register HTTP routes, intercept HTTP requests/responses, call system RPC methods, register their own RPC methods, declare configuration items, and inject admin pages.

::: warning Security
Plugins run with **admin privileges** and may request sensitive capabilities such as filesystem access, child process execution, or port listening. Only install plugins you trust; review the declared permissions carefully before enabling third-party plugins.
:::

### What a plugin can do

| Capability | API | Required permission | Notes |
| --- | --- | --- | --- |
| Register RPC methods | `server.registerRPC` | always granted | Register `plugin:xxx` methods callable by the UI or other plugins |
| Schedule periodic tasks | `server.cron` | always granted | Run a handler on a cron schedule |
| Call system RPC | `server.call` | `allowSystemRPC` | Invoke any registered system RPC with admin authority |
| Register HTTP routes | `server.route` | `allowRoutes` | Register `METHOD /path`; supports streaming |
| Mount a static folder | `server.static` | `allowRoutes` | Optional SPA fallback |
| Intercept HTTP requests/responses | `server.hook` | `allowHooks` | Modify requests/responses entering or leaving the server |
| Intercept WebSocket | `server.hook` (ws kinds) | `allowHooks` | wsConnect / wsMessage / wsSend / wsClose |
| Embed CSS/JS | `server.injectHTML` | `allowHTMLInject` | Embed fragments into every HTML page |
| Read configuration | `server.getConfig` | always granted | Read saved config merged with manifest defaults |
| Declare configuration items | manifest `configuration` | no permission | Admin UI generates a config form automatically |
| Inject admin pages | manifest `pages` | no permission | iframe / redirect pages in the admin sidebar |
| File access | `fs` / `require` | inside plugin dir: always granted | Escaping requires `allowAllFileAccess` |
| Node compatibility modules | `node` modules | `node` | events / fs / path / os / process / net / http / crypto, etc. |
| Child processes | `child_process` | `allowExec` | Execute external commands |
| Port listening | `net` / `http` Server | `allowListen` | Binds `127.0.0.1` by default |

### Installation limits

ZIP packages: up to 10,000 files, each file ≤ 128 MiB, total extracted ≤ 512 MiB, manifest ≤ 1 MiB. Any path-traversal entry (`../`, absolute paths) rejects the **entire** package. `komari-plugin.json` must be at the ZIP root.

## Quick Start

### Using `npm create komari-plugin` (recommended)

Prerequisites: Node.js 20 or later, a reachable Komari development server, and an API key with permission to install and manage plugins.

```sh
npm create komari-plugin
```

`npm run dev` builds the TypeScript source, packages the plugin, uploads it to the configured server, enables it, prints the runtime plugin log, and watches the source and manifest for changes — a file change automatically repeats that cycle. Use `Ctrl+C` to stop watching. The development server URL and API key are stored in `komari.local.json` (git-ignored by default); never commit them.

Generated project layout:

```text
hello/
├── src/plugin.ts          # TypeScript plugin source
├── komari-plugin.json     # Plugin manifest
├── komari.local.json      # Local server URL and API key; never commit
├── package.json
└── tsconfig.json
```

The generated manifest references the SDK Schema, enabling field completion, validation, and hover docs in VS Code. SDK example:

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

### Manual ZIP workflow

1. Create the plugin directory containing `komari-plugin.json` and `script.js`.
2. Write the manifest (see [Manifest](#manifest)).
3. Write the entry script:

```js
const server = require("server");

function load() {
  console.log("hello plugin loaded");

  // Register an HTTP route: GET /hello
  server.route("GET", "/hello", async (req, res) => {
    const nodes = await server.call("common:getNodes");
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({
      greeting: "Hello, Komari!",
      nodeCount: Object.keys(nodes).length
    }));
  });
}

function unload() {
  console.log("hello plugin unloaded");
}
```

4. Put the two files directly at the ZIP **root** (no wrapping folder) and upload on the admin "Plugins" page.
5. After installation the plugin is **disabled** by default and must be enabled manually (declaring sensitive permissions triggers the approval flow first).

### Lifecycle

- The entry script's top-level code runs immediately at load; you may define global `load()` / `unload()` functions.
- `load()` runs every time the plugin is enabled/started (including startup recovery); `unload()` runs on disable, uninstall, or server shutdown.
- A top-level error or a `load()` error → the plugin is **auto-disabled** (the error is persisted in `last_error`).
- Gin route slots registered by a plugin **remain after unload** (requests return 404) and are restored on reload.

### Long-term storage `__storageDir__`

Every plugin gets a dedicated long-term storage directory `data/plugin-data/<short>/` when enabled, accessed via the global `__storageDir__`:

```js
const fs = require("fs");
const path = require("path");
fs.writeFileSync(path.join(__storageDir__, "cache.json"), "{}");
```

- Fully separated from the code directory `data/plugin/<short>` (the ZIP contents); the `fs` sandbox covers both.
- **Updates (reinstall) replace only the code directory; long-term storage survives.** Deleting a plugin removes both directories.
- Nothing escapes `__storageDir__`, and other plugins' storage directories are unreachable.

### Debugging

Each plugin has a dedicated 64 KiB ring log buffer; `console.*` output and lifecycle/hook errors are written to it, readable via `admin:getPluginLogs` (param `{short}`). When a plugin fails to load, the admin "Plugins" list shows `last_error`; combined with the plugin logs this diagnoses most issues.

## Manifest

`komari-plugin.json` must be located at the **root** of the plugin ZIP. It declares the plugin's metadata, permissions, configuration items, and injected pages. The server validates this file on install, load, and enable.

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | string \| i18n | Yes | — | Plugin name |
| `short` | string | Yes | — | Unique plugin short name; only `[A-Za-z0-9_-]`, must not be `default` |
| `description` | string \| i18n | No | — | Plugin description |
| `author` | string \| i18n | No | — | Author |
| `version` | string | No | — | Plugin version (required for market publishing) |
| `url` | string | No | — | Project homepage / repository URL |
| `icon` | string | No | — | Icon path; must be a relative path inside the plugin directory |
| `komari` | string | No | `""` | Server version constraint, e.g. `>=1.0.0` |
| `entry` | string | No | `"script.js"` | Entry script; must be a relative path inside the plugin directory |
| `permissions` | object | No | all zero | Capability declarations (see below) |
| `configuration` | object | No | — | Configuration declarations (see below) |
| `pages` | array | No | `[]` | Injected admin pages (see below) |

- `name`, `description`, `author` and page `title` can be plain strings or i18n objects such as `{"zh_CN": "...", "en": "..."}`.
- `komari` version constraint: empty = any version; `1.0.0` = exact match; `>=1.0.0` = minimum; `<=1.0.0` = maximum. Installation is rejected when the constraint is not satisfied, and loading also fails.

Minimal example:

```json
{
  "name": "Hello World",
  "short": "hello",
  "description": "An example plugin",
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

## Permissions

Except for `node`, `maxHTTPBodyBytes`, `maxChildOutputBytes`, and `timeout`, every permission field defaults to `false` — **nothing is granted unless declared**.

| Field | Type | Default | Description | Triggers approval |
| --- | --- | --- | --- | --- |
| `node` | boolean | `false` | Enable Node.js compatibility modules (events/path/os/process/fs/child_process/net/http/stream/crypto and the `Buffer`/`process`/`global` globals) | No |
| `allowSystemRPC` | boolean | `false` | Allow `server.call` to invoke system RPC with admin authority | **Yes** |
| `allowRoutes` | boolean | `false` | Allow `server.route` to register HTTP routes on the host engine | **Yes** |
| `allowHooks` | boolean | `false` | Allow `server.hook` to modify HTTP requests/responses and intercept WebSocket | **Yes** |
| `allowHTMLInject` | boolean | `false` | Allow `server.injectHTML` to embed CSS/JS into every HTML page | **Yes** |
| `allowExec` | boolean | `false` | Allow `child_process` to execute child processes | **Yes** |
| `allowListen` | boolean | `false` | Allow `net`/`http` Servers to listen on local ports | **Yes** |
| `allowAllFileAccess` | boolean | `false` | Allow accessing files outside the plugin directory | **Yes** |
| `maxHTTPBodyBytes` | int | 32 MiB | Buffering limit for fetch response bodies and HTTP request bodies | No |
| `maxChildOutputBytes` | int | 1 MiB | stdout/stderr cap for child processes | No |
| `timeout` | int | 30 | Per-turn execution timeout in seconds | No |

- **Always granted** (no declaration needed, no approval): `server.registerRPC`, `server.cron`, `server.getConfig`, and file access inside the plugin directory and `__storageDir__`.
- When any sensitive capability (the 7 fields marked **Yes** above) is `true`, enabling the plugin requires **admin approval**: the approval hash covers only those 7 fields; later changes to `node` / timeout / size limits do **not** re-trigger approval, but changing a sensitive capability does.

**Behavior when a permission is missing:**

| API | Behavior without permission |
| --- | --- |
| `server.route` / `server.static` / `server.hook` / `server.injectHTML` | Throws `TypeError` at **load time**; plugin load fails (auto-disabled) |
| `server.call` | The returned Promise is **rejected** (load not blocked) |
| `require("child_process")` | Throws (no `allowExec`) |
| `net` / `http` Server `listen()` | Throws (no `allowListen`) |
| `fs` / `require` outside plugin dir | Rejected by the sandbox (no `allowAllFileAccess`) |

## Configuration

Declarative configuration with `type: "managed"`: the admin UI generates a form automatically, and the plugin reads values via `server.getConfig()` (saved values are merged with manifest defaults).

```json
{
  "configuration": {
    "type": "managed",
    "data": [
      { "key": "greeting", "name": "Greeting", "type": "string", "default": "Hello" },
      { "key": "count", "name": "Count", "type": "number" },
      { "key": "enabled", "name": "Enabled", "type": "switch", "default": true },
      { "key": "mode", "name": "Mode", "type": "select", "options": "json,text" },
      { "key": "note", "name": "Note", "type": "string", "help": "Usage instructions" },
      { "key": "nodes", "name": "Nodes", "type": "nodes", "default": "[]" }
    ]
  }
}
```

```js
const config = await server.getConfig();
console.log(config.greeting); // defaults already merged
```

Item fields, default value merge rules, and selector storage/output rules are shared with themes. See [Managed Configuration](../managed-config).

## Pages

Plugins can inject pages into the admin UI (shown in the plugin group of the sidebar):

```json
{
  "pages": [
    { "file": "admin.html", "title": "Admin Panel", "icon": "icon.png" },
    { "type": "redirect", "title": "Go to Nodes", "url": "/" },
    { "file": "pub.html", "title": "Public Page", "visibility": "public" }
  ]
}
```

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | string | required for iframe | Relative path inside the plugin directory, rendered as an iframe |
| `title` | string \| i18n | Yes | Page title |
| `icon` | string | No | Icon, relative path inside the plugin directory |
| `type` | `"iframe"` \| `"redirect"` | No | Default `iframe` |
| `url` | string | required for redirect | Internal site path |
| `visibility` | `"admin"` \| `"public"` | No | Default `admin` |

| visibility | type | Access path | Auth |
| --- | --- | --- | --- |
| `admin` | `iframe` | `/api/admin/plugin/<short>/<file>` | admin login required |
| `public` | `iframe` | `/api/plugin/<short>/<file>` | no auth (public) |
| `redirect` | any | navigates to an internal site path | — |

- `public` pages require the plugin to be **enabled**, can only serve files under a declared public page's directory, and are rendered in a sandboxed iframe.
- A `redirect` `url` must be a same-origin internal path: starts with `/`, must not start with `//`, and must not contain backslashes, URL schemes (e.g. `http:`), or `..` segments.

::: tip Follow the parent page's theme & language
Iframe pages can read the parent document's `<html>` element to sync theme and language:

- **Dark/light theme**: `window.parent.document.documentElement.classList.contains("dark")` tells you whether the dark theme is active.
- **Current language**: `window.parent.document.documentElement.lang` gives the active locale (e.g. `zh-CN`, `en`).

Use a `MutationObserver` on the `class` / `lang` attributes to react to theme and language switches live, instead of checking only once on load.
:::

## Interfaces

Plugins get their bridge to the host via `require("server")` (a **native module** injected by the plugin system) and define lifecycle hooks via global `load()` / `unload()`.

| Method | Description | Permission |
| --- | --- | --- |
| `server.route(method, path, handler)` | Register an HTTP route on the host engine | `allowRoutes` |
| `server.static(path, dir, opts)` | Mount a static folder from the plugin directory, optional SPA fallback | `allowRoutes` |
| `server.hook(kind, matcher?, fn)` | Register request/response/WebSocket hooks | `allowHooks` |
| `server.injectHTML(head, body)` | Embed CSS/JS into every HTML page | `allowHTMLInject` |
| `server.call(method, params...)` | Call system RPC with admin authority | `allowSystemRPC` |
| `server.registerRPC(method, handler)` | Register a plugin-owned RPC method | Always granted |
| `server.cron(expr, handler)` | Run handler on a cron schedule | Always granted |
| `server.getConfig()` | Read configuration (merged with defaults) | Always granted |

### server.call

```js
const result = await server.call("common:getNodes");
const status = await server.call("common:getNodesLatestStatus", { uuid: "..." });
```

- Param marshalling: **0 args** → `null`; **1 arg** → passed as-is; **N args** → marshalled into a positional array.
- On failure the Promise rejects with an Error carrying JSON-RPC error fields: `err.code` (integer), `err.message`, `err.data` (optional).
- Runs with `RoleAdmin`, equivalent to an admin operating the panel — including sensitive operations such as `admin:exec`. Requires `allowSystemRPC`.
- Available methods cover the `common:` / `public:` / `admin:` / `client:` namespaces (e.g. `common:getNodes`, `admin:getTasks`, `admin:listPlugins`, `admin:getPluginLogs`). For the full inventory see the [RPC documentation](../rpc).

### server.route

```js
server.route("GET", "/plug", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
});
```

- `method` is uppercased automatically and must not be empty; `path` must start with `/`.
- `req`: `method` / `url` (with query string) / `headers` (lower-cased keys, multi-values as arrays) / `query` / `body` (fully read, limited by `maxHTTPBodyBytes`) / `context` (identity and origin info).
- `res`: `statusCode` / `statusMessage` / `streaming` / `isAborted()` / `setHeader` / `getHeader` / `removeHeader` / `write` / `end`.
- **You must call `res.end()`**, otherwise the client receives **504 `plugin route handler timed out`** after `timeout`.
- Streaming (SSE): set `res.streaming = true` so each `write()` is flushed immediately; `isAborted()` returns `true` when the client disconnects.

### server.static

```js
server.static("/ui", "dist");
server.static("/app", "dist", { spa: true }); // SPA mode
```

- Serves `GET` / `HEAD`; the mount path itself returns `index.html`, and a directory resolves to its own `index.html`.
- With `{ spa: true }`, requests that resolve to no file fall back to the folder root `index.html` (client-side routing refreshes no longer 404); real files always win.
- Traversal requests (`..`) are rejected with 404; file resolution stays confined to `dir`.

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

- `kind`: `"request"` / `"response"` / `"wsConnect"` / `"wsMessage"` / `"wsSend"` / `"wsClose"` (case-insensitive).
- `matcher` (optional): `"/api/foo"` (exact), `"/api/*"` (subtree), `"POST /api/foo"` (method + path); the ws kinds accept path-only matchers.
- Request hooks can mutate `method` / `url` / `headers` / `body`; response hooks can mutate `statusCode` / `statusMessage` / `headers` / `body` (rewriting the body drops the original `Content-Length`).
- WebSocket hooks: `wsConnect` returns `{ deny, reason }` to reject a connection; `wsMessage` / `wsSend` return `{ drop: true }` to drop a frame or `{ type, data }` to replace it; `wsClose` notifies connection teardown. Frame size cap is 8 MiB, and the frame callback wait is capped at 1 second. Dropping frames can break the protocol — use with care.
- Streaming responses (SSE) or responses larger than 32 MiB pass through untouched; hooks cannot rewrite them.

#### WebSocket hook example

The ws kinds target **every WebSocket endpoint** on the server (agent reporting, the web RPC2 channel, terminal forwarding, and the online list):

```js
// Connection-level: runs at upgrade time; undefined = allow, { deny, reason } = reject
server.hook("wsConnect", (ctx) => {
  if (ctx.path === "/api/clients/v2/rpc" && ctx.remoteIp.startsWith("10.")) {
    return { deny: true, reason: "intranet agents must use the private endpoint" };
  }
});

// Frame-level: every inbound (client → server) frame
server.hook("wsMessage", "/api/clients/v2/rpc", (ctx, msg) => {
  if (msg.type !== 1) return;                 // 1 = text, 2 = binary
  const req = JSON.parse(msg.data);
  if (req.method === "agent.basicInfo") {
    req.params.info.ipv4 = "1.2.3.4";         // rewrite the agent-reported public IP
    return { data: JSON.stringify(req) };     // replace the frame
  }
  // return { drop: true };                   // drop the frame (can break the protocol; use with care)
});

// Frame-level: every outbound (server → client) frame
server.hook("wsSend", (ctx, msg) => {
  return { type: msg.type, data: msg.data };  // returning the same values = pass through
});

// Connection teardown notification (the return value is ignored)
server.hook("wsClose", (ctx) => {
  console.log("connection closed", ctx.connId);
});
```

- `ctx` (connection context, built once at connect; frame callbacks share it): `path` (endpoint path, e.g. `/api/clients/v2/rpc`), `connId` (unique connection ID), `remoteIp` (TCP source IP), `userAgent`, `clientUuid` (resolved agent uuid; available at upgrade for v2, may be `undefined` for v1 until the first frame).
- `msg` (frame object): `type` (`1` = text, `2` = binary), `data` (string for text, `ArrayBuffer` for binary), `connId`, `path`.
- Multiple hooks run **in registration order as a chain** — each hook sees the previous hook's replacement, and `drop` wins over later hooks. On timeout or a hook error the frame **passes through unchanged** and the plugin log records it. Unloading a plugin removes its ws hooks; established connections revert to pass-through.

### server.injectHTML

```js
server.injectHTML(
  "<style>.plugin-badge{color:red}</style>",
  '<script src="/api/mjpeg_live.js"></script>'
);
```

- The `head` fragment is inserted before `</head>`, the `body` fragment before `</body>` (case-insensitive).
- Applies to **all** HTML pages (incl. admin, terminal, login, and public pages); non-HTML responses, responses larger than 32 MiB, streaming responses, and WebSocket upgrade requests pass through without injection.

### server.registerRPC

```js
server.registerRPC("plugin:greet", (params) => {
  return { echo: params, from: "example" };
});
```

- The method name must not be empty and must not start with `rpc.` (reserved prefix); prefer the `plugin:<name>:<action>` naming convention to avoid clashes with system methods.
- Thrown JS `Error`s map to JSON-RPC errors (`err.code` / `err.message` / `err.data` are propagated).
- Always granted; re-registering within one load is a no-op, and methods are unregistered on unload.

### server.cron

```js
server.cron("0 0 9 * * *", async () => { /* Runs every day at 09:00 */ });
server.cron("@every 1m", () => { /* Runs every minute */ });
```

- Supports 5-field / 6-field cron expressions or `@every <duration>` (e.g. `@every 1m`, `@every 30s`); fields support `*`, `*/n`, `a-b`, and comma lists.
- An invalid expression fails the load (error written to `last_error`, plugin auto-disabled); handler errors are logged and do not stop future fires.

### server.getConfig

```js
const config = await server.getConfig();
console.log(config.interval); // defaults already merged
```

Returns a Promise resolving to a `{ [key]: value }` object. Merge rules: see [Managed Configuration](../managed-config#default-value-merge-rules). Always granted.

## Compatibility

Plugins run in a sandboxed runtime built on [goja](https://github.com/dop251/goja): one dedicated VM + event loop per plugin, with CommonJS loading, Node-style modules, and web APIs — but it is **not a browser and not full Node.js**. Interface status is one of `Available` / `Partial` / `Fixed value or throws` / `Not implemented`. This section only describes what the runtime **actually provides** — a same-named API does not imply identical edge-case behavior with browsers or Node.js.

### How manifest permissions affect the runtime

| Manifest field | Runtime effect |
| --- | --- |
| `node: true` | Injects `Buffer` / `process` / `global` / `__dirname` / `__filename` and the events/path/os/process/fs/child_process/net/http/stream/crypto modules |
| `allowExec: true` | `child_process` and `process.kill()` become available |
| `allowListen: true` | `net` / `http` Servers can bind local ports (default `127.0.0.1`) |
| `allowAllFileAccess: true` | `require` and `fs` can access paths outside the plugin directory |
| `maxHTTPBodyBytes` / `maxChildOutputBytes` / `timeout` | Buffer cap / child output cap / per-turn timeout (default 30 s) |

### Web APIs & base interfaces

- **fetch**: `fetch(input, init)` plus `Headers`, `EventTarget`, `AbortController`, `AbortSignal` (incl. static `abort/timeout/any`), `Blob`, `File`, `FormData`, `Request`, `Response`. All bodies are **fully buffered** (`Response.body` is always `null`, 32 MiB cap); no cookies, CORS, same-origin policy, or caching; redirects only support `follow` / `manual` / `error`.
- **XMLHttpRequest**: `open` / `setRequestHeader` / `getResponseHeader` / `getAllResponseHeaders` / `send` / `abort`, `responseType` (`""`/`text`/`json`/`arraybuffer`/`blob`/`document`), `timeout`, and the standard events. `responseXML` is always `null`; synchronous mode `open(..., false)` blocks the event loop and forbids a non-zero `timeout` or non-empty `responseType`.
- **ECMAScript**: standard Promise/async-await, Array, Map/Set, TypedArray, JSON, `eval()`, `queueMicrotask`, `setTimeout` / `setInterval` / `setImmediate`. **No** `for await...of` or async generators (call `[Symbol.asyncIterator]().next()` manually in a loop); timer handle `ref/unref/refresh/hasRef` is not implemented.
- **console**: `assert / debug / error / exception / info / log / trace / warn` with basic `%s %d %i %f %o %O %c %%` formatting; `table`, `dir`, `time/timeEnd`, `count`, `group`, `clear` etc. are not implemented. Output goes to the plugin log buffer (64 KiB ring).

### Node compatibility modules

| Module | Available | Notes |
| --- | --- | --- |
| `buffer` | `Buffer.from/alloc/poolSize`, Uint8Array inheritance, `equals/toString/write`, BE/LE numeric reads/writes | No `node` permission needed; `concat/isBuffer/byteLength/compare/allocUnsafe*` etc. not implemented |
| `url` | `URL` (partial), `URLSearchParams` (complete) | No `node` permission needed; legacy `parse/format/resolve` not implemented |
| `util` | `util.format()` | No `node` permission needed; `inspect/promisify/types` not implemented |
| `events` | Full `EventEmitter` (incl. static `listenerCount/once/on`) | Requires `node` |
| `stream` | `Readable` / `Writable` / `Duplex` / `Transform` / `PassThrough` / `pipeline` / `finished`, real backpressure | No Web Streams (`stream/web` not implemented); `net.Socket` is not integrated with streams |
| `fs` | Sync / callback / `fs.promises` / `createReadStream` / `createWriteStream` | Sandboxed to the plugin directory and `__storageDir__`; `watch/cp/link/opendir/statfs` etc. not implemented |
| `path` | `sep/normalize/isAbsolute/join/resolve/relative/...`, plus `posix`/`win32` | — |
| `os` | `arch/platform/hostname/homedir/tmpdir/...` | Metrics report the **host machine**, not the plugin; `loadavg()` is zero on Windows |
| `process` | `env/argv/pid/cwd/memoryUsage/...` | `versions.node` fixed `"0.0.0-goja"`; `kill()` requires `allowExec`; `exit()/abort()` only throw — they never exit Komari |
| `child_process` | `spawn/exec/execFile` and Sync versions | Requires `allowExec`; `fork` throws; no IPC (`send()` reports not enabled) |
| `net` | TCP `createServer/connect/createConnection/isIP`; Server `listen/close/address` | `listen` requires `allowListen` (default `127.0.0.1`); no UDP / TLS / Unix sockets |
| `http` | `createServer/request/get`, `Agent`, `IncomingMessage`, `ServerResponse` | `listen` requires `allowListen`; no separate `https` module (but `fetch` and `http.request` can request HTTPS) |
| `crypto` | Hashes / random / derivation (pbkdf2, scrypt) / symmetric (AES, ChaCha20-Poly1305) / signing (RSA, ECDSA, Ed25519) | `generateKeyPairSync`, `KeyObject`, `webcrypto` etc. not implemented |

### Common but not implemented

| Category | Examples |
| --- | --- |
| Browser DOM | `window`, `document`, `navigator`, `location`, storage, canvas |
| Browser networking | `WebSocket`, `EventSource`, WebCrypto, Web Streams |
| Module system | ESM `import/export`, dynamic `import()`, `require.resolve/cache/extensions/main` |
| Node core modules | `https`, `tls`, `dns`, `dgram`, `zlib`, `worker_threads`, `cluster`, `readline`, `assert`, etc. |
| Timers | handle `ref/unref/refresh/hasRef` |
| Resource isolation | no per-plugin CPU/memory/network quotas; `process.memoryUsage()` measures the whole Komari process |

### Recommendations

1. Prefer async APIs (Promise-based fs, async fetch, async child processes); synchronous XHR, sync fs, and `execSync` block the plugin's own event loop.
2. Before adding npm/CommonJS packages, verify the Node core modules they depend on — pure JavaScript does not guarantee compatibility with this subset.
3. Do not use "the name exists" as a capability check: many methods exist but return fixed values or throw.
4. The plugin's `timeout` bounds every single execution; split long-running work into multiple async steps.
