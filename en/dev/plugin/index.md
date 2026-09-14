# Plugin Development Guide

## Introduction

Komari supports extending the server with **JavaScript plugins**. A plugin is a ZIP package containing a manifest (`komari-plugin.json`) and an entry script (default `script.js`). Plugins run inside the server process in their own goja JavaScript runtime (sandbox), and can register HTTP routes, intercept HTTP requests and responses, call system RPC methods, register their own RPC methods, declare configuration items, and inject admin pages.

::: warning Security
Plugins inherit Komari's system privileges and may request sensitive capabilities such as filesystem access, child process execution, or port listening. Only install plugins you trust, and review the declared permissions carefully before enabling a third-party plugin.
:::

## Table of Contents

- [1. Quick Start](#1-quick-start)
- [2. Plugin Package and Manifest](#2-plugin-package-and-manifest)
- [3. Lifecycle Interfaces](#3-lifecycle-interfaces)
- [4. JavaScript Runtime and Compatibility Modules](#4-javascript-runtime-and-compatibility-modules)
- [5. `server` Module](#5-server-module)
- [6. Plugin Pages](#6-plugin-pages)
- [7. Plugin Configuration](#7-plugin-configuration)
- [8. Plugin-owned RPC](#8-plugin-owned-rpc)
- [9. Plugin Management HTTP Interfaces](#9-plugin-management-http-interfaces)
- [10. Permissions, Limits, and Errors](#10-permissions-limits-and-errors)

## 1. Quick Start

### 1.1 Using `npm create komari-plugin`

In addition to writing a plugin manually, you can create a project with the official scaffold:

```sh
npm create komari-plugin
```

The template provides these common development features:

- **Plugin hot reload**: `npm run dev` watches the source files and manifest, then automatically builds, packages, uploads, and re-enables the plugin. Changes are applied without repeating the installation manually.
- **Log tracking**: the development command continuously prints plugin runtime logs, making load results and runtime errors easy to inspect.
- **Type hints**: the template uses TypeScript and `@komari-monitor/plugin-sdk`, providing API types, parameter hints, and manifest field completion.
- **Local development configuration**: the development server URL and API key are stored in `komari.local.json`, which is ignored by Git by default. Do not commit this file.

The template requires Node.js 20 or later, a reachable Komari development server, and an administrator API key.

The generated project looks like this:

```text
hello/
├── src/plugin.ts          # TypeScript plugin source
├── komari-plugin.json     # Plugin manifest
├── komari.local.json      # Local server URL and API key; do not commit
├── package.json
└── tsconfig.json
```

SDK example:

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

### 1.2 Writing a Minimal Plugin Manually

A plugin package is a ZIP file. Its root must contain `komari-plugin.json`, and the default entry script is `script.js`:

```text
my-plugin.zip
├── komari-plugin.json
└── script.js
```

`komari-plugin.json`:

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

`script.js`:

```js
const server = require("server");

function load() {
  console.log("hello plugin loaded");
}

function unload() {
  console.log("hello plugin unloaded");
}
```

## 2. Plugin Package and Manifest

### 2.1 Package Structure

```text
<plugin>.zip
├── komari-plugin.json            # Required and must be in the ZIP root
├── script.js                     # Default entry
├── pages/                        # Optional iframe pages and assets
│   └── admin.html
└── assets/
```

Archive limits:

| Limit | Current value |
| --- | --- |
| Maximum number of files | 10000 |
| Maximum uncompressed file size | 128 MiB |
| Maximum total uncompressed size | 512 MiB |
| Maximum manifest size | 1 MiB |

### 2.2 `komari-plugin.json` Fields

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | `string \| Record<string,string>` | Yes | - | Plugin name. Accepts a plain string or an i18n object such as `{"zh_CN":"Example","en":"Example"}`. |
| `short` | `string` | Yes | - | Plugin short name. Only letters, digits, `_`, and `-` are allowed. It cannot be `default` and is also used as the directory name. |
| `description` | `string \| Record<string,string>` | No | - | Plugin description. |
| `author` | `string \| Record<string,string>` | No | - | Author. |
| `version` | `string` | No | - | Plugin version. Market installation compares it with the catalog version. |
| `url` | `string` | No | - | Project homepage or repository URL. |
| `icon` | `string` | No | - | Plugin icon. Must be a relative path inside the plugin directory. |
| `komari` | `string` | No | - | Komari version constraint, such as `>=0.0.1` or `1.2.3`. |
| `entry` | `string` | No | `script.js` | Entry script. Must be a relative path inside the plugin directory. |
| `permissions` | `PluginPermissions` | No | Zero values | Runtime permissions and limits. |
| `configuration` | `Configuration` | No | - | Configuration item declarations, using the same shape as themes. |
| `pages` | `PluginPage[]` | No | - | Plugin page declarations. |

Supported `komari` constraints:

| Syntax | Meaning |
| --- | --- |
| Empty string | No restriction |
| `x.y.z` | Exact match |
| `>=x.y.z` | Greater than or equal to |
| `>x.y.z` | Greater than |
| `<=x.y.z` | Less than or equal to |
| `<x.y.z` | Less than |

The version may have a leading `v` and contains at most three numeric components.

### 2.3 `permissions` Fields

| Field | Type | Default | Requires approval | Description |
| --- | --- | --- | --- | --- |
| `node` | `boolean` | `false` | No | Enables the Node.js compatibility modules. |
| `allowSystemRPC` | `boolean` | `false` | Yes | Allows `server.call()` to invoke system RPC methods with administrator authority. |
| `allowRoutes` | `boolean` | `false` | Yes | Allows `server.route()` and `server.static()`. |
| `allowHooks` | `boolean` | `false` | Yes | Allows HTTP and WebSocket hooks. |
| `allowHTMLInject` | `boolean` | `false` | Yes | Allows `server.injectHTML()` to inject fragments into HTML responses. |
| `allowExec` | `boolean` | `false` | Yes | Allows `child_process` to execute child processes. |
| `allowListen` | `boolean` | `false` | Yes | Allows `net` and `http` servers to listen on local ports. |
| `allowAllFileAccess` | `boolean` | `false` | Yes | Allows access to files outside the plugin directory. |
| `maxHTTPBodyBytes` | `integer` | `33554432` | No | Buffer limit for fetch response bodies, HTTP server request bodies, and route request bodies. |
| `maxChildOutputBytes` | `integer` | `1048576` | No | Buffer limit for each stdout or stderr stream from a child process. |
| `timeout` | `integer` | `30` | No | Per-turn execution timeout in seconds. |

Changing permissions invalidates the stored approval hash, so the plugin must be approved again before it can be enabled.

### 2.4 `configuration` Field

See [Managed Configuration](../managed-config.md).

To read the saved managed configuration, call [`server.getConfig()`](#58-servergetconfig).

Example:

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

### 2.5 `pages` Field

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `file` | `string` | Required for `iframe` | - | Relative HTML file inside the plugin directory. Not used by `redirect`. |
| `title` | `string \| Record<string,string>` | Yes | - | Page title. |
| `icon` | `string` | No | - | Page icon. Relative path inside the plugin directory. |
| `type` | `"iframe" \| "redirect"` | No | `"iframe"` | How the page is presented. |
| `url` | `string` | Required for `redirect` | - | Internal absolute path. It must start with `/` and cannot contain `//`, a backslash, or `..`. |
| `visibility` | `"admin" \| "public"` | No | `"admin"` | Page access scope. |

`visibility: "public"` only applies to `iframe` pages. Public pages are served by `/api/plugin/:short/*filepath` without authentication, and only files in the directory of the declared public page and its subdirectories are accessible.

See [Plugin Pages](#6-plugin-pages) for details.

### 2.6 Complete Manifest Example

```json
{
  "name": {
    "zh_CN": "Status Extension",
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

## 3. Lifecycle Interfaces

The plugin entry script is not a CommonJS wrapper. Its top-level code runs directly. The runtime recognizes only the optional global functions `load` and `unload`.

### 3.1 `load()`

**Description:** Called once after the plugin is loaded. Use it to register routes, hooks, HTML injections, cron jobs, and RPC methods, and to initialize plugin resources.

**Parameters:** None.

**Return value:** No value is required. It can return `undefined` or a Promise. When it returns a Promise, the runtime waits for it to settle.

**Caller:** The Komari plugin manager.

**Example:**

```js
const server = require("server");

function load() {
  console.log("plugin loaded");
  server.registerRPC("plugin:hello", () => ({ ok: true }));
}
```

Async example:

```js
const server = require("server");

async function load() {
  await new Promise((resolve) => setTimeout(resolve, 100));
  server.registerRPC("plugin:hello", () => ({ ok: true }));
}
```

If `load()` throws or its Promise rejects, plugin loading fails, the plugin is disabled automatically, and the error is stored as `last_error`.

### 3.2 `unload()`

**Description:** Called once before the plugin is unloaded. Use it to release resources created by the plugin. Komari automatically unregisters the plugin's hooks, HTML injections, cron jobs, and RPC methods.

**Parameters:** None.

**Return value:** No value is required. It can return `undefined` or a Promise. When it returns a Promise, the runtime waits for it to settle.

**Caller:** The Komari plugin manager.

**Example:**

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

If `unload()` throws or its Promise rejects, the error is reported, but the manager still completes its cleanup.

## 4. JavaScript Runtime and Compatibility Modules

Plugins run in an isolated goja JavaScript runtime with CommonJS `require()`, Promise and async/await support, an event loop, and common web APIs. It is not a browser and not a complete Node.js implementation. A same-named API does not necessarily have the same edge-case behavior as a browser or Node.js.

The following are available without any additional permission:

| Category | APIs |
| --- | --- |
| Base interfaces | `console`, `setTimeout` / `setInterval` / `setImmediate` and their clear functions, `queueMicrotask` |
| HTTP clients | `fetch`, `XMLHttpRequest` |
| Always-available modules | `buffer`, `url`, `util` |
| File access | The plugin code directory and `data/plugin-data/<short>`. The latter is available as `__storageDir__` when `node: true`. |

When `permissions.node` is `true`, the runtime also injects `Buffer`, `process`, `global`, `__dirname`, and `__filename`, and provides these Node.js compatibility modules:

| Module | Description |
| --- | --- |
| `events`, `stream`, `path`, `os`, `process` | Events, streams, paths, host information, and process interfaces. |
| `fs` | File access. It is restricted to the plugin code directory and `__storageDir__` by default; escaping those roots requires `allowAllFileAccess`. |
| `child_process` | Child process execution. Requires `allowExec`. |
| `net`, `http` | TCP and HTTP. Server listening requires `allowListen` and binds to `127.0.0.1` by default. |
| `crypto` | Hashes, random values, key derivation, AES and ChaCha20-Poly1305, and common signing and verification operations. |

The runtime does not provide the browser DOM, `WebSocket`, `EventSource`, Web Streams, ESM `import` or `export`, or complete implementations of Node core modules such as `https`, `tls`, `dns`, `zlib`, and `worker_threads`. Metrics from `process.memoryUsage()` and `cpuUsage()` describe the whole Komari process, not an individual plugin. For complete compatibility boundaries, see `pkg/jsruntime/README.md` in the Komari repository.

## 5. `server` Module

```js
const server = require("server");
```

### 5.1 `server.route(method, path, handler)`

**Description:** Registers a route on the Komari HTTP engine.

**Permission:** `allowRoutes`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `method` | `string` | Yes | HTTP method. It is converted to uppercase and cannot be empty. |
| `path` | `string` | Yes | Route path. It must start with `/`. |
| `handler` | `(req, res) => void \| Promise<void>` | Yes | Request handler. It may return a Promise but must eventually call `res.end()`. |

**Return value:** `undefined`.

**`req` object:**

| Field | Type | Description |
| --- | --- | --- |
| `method` | `string` | Request method. |
| `url` | `string` | Request URI, including the query string. |
| `headers` | `Record<string,string \| string[]>` | Request headers with lowercase keys. |
| `query` | `Record<string,string>` | Query parameters. Multiple values with the same name are joined with commas. |
| `body` | `string` | Request body text. |
| `context` | `RequestContext` | Caller and network information. |

**`req.context` object:**

| Field | Type | Description |
| --- | --- | --- |
| `principal` | `object` | The resolved caller identity. |
| `principal.type` | `"anonymous" \| "agent" \| "user" \| "api_key"` | Identity type. |
| `principal.roles` | `string[]` | Role list. |
| `principal.user_uuid` | `string` | User UUID, or an empty string when absent. |
| `principal.client_uuid` | `string` | Client UUID, or an empty string when absent. |
| `principal.is_api_key` | `boolean` | Whether the request uses an API key. |
| `role` | `string` | Current request role. Omitted when absent. |
| `user_uuid` | `string` | Current user UUID. Omitted when absent. |
| `client_uuid` | `string` | Current client UUID. Omitted when absent. |
| `remote_ip` | `string` | Remote IP address. |
| `user_agent` | `string` | User-Agent header. |

**`res` object:**

| Member | Type | Description |
| --- | --- | --- |
| `statusCode` | `number` | Response status code, default `200`. |
| `statusMessage` | `string` | Status text field. It is currently exposed only as a writable field. |
| `streaming` | `boolean` | When `true`, `write()` pushes data immediately. |
| `setHeader(name, value)` | `(string, string \| string[]) => res` | Sets a response header. |
| `getHeader(name)` | `(string) => string \| string[] \| undefined` | Reads a response header. |
| `removeHeader(name)` | `(string) => void` | Removes a response header. |
| `write(data)` | `(string \| Buffer \| ArrayBuffer \| Uint8Array) => boolean` | Writes response data. In streaming mode it sends data immediately. |
| `end(data?)` | `(string?) => res` | Ends the response and optionally appends text. |
| `isAborted()` | `() => boolean` | Reports whether the client disconnected or the stream was aborted. |

**Request example:**

```js
const server = require("server");

function load() {
  server.route("GET", "/status", (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify({
      message: "ok",
      viewer: req.context.principal.type,
      query: req.query
    }));
  });
}
```

Async and error handling example:

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

Streaming example:

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

Route slots remain after the plugin is unloaded, but requests return `404`. A non-streaming handler times out after `permissions.timeout` seconds and returns `504`.

### 5.2 `server.static(mount, dir, options?)`

**Description:** Mounts a static directory from the plugin directory on an HTTP path.

**Permission:** `allowRoutes`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `mount` | `string` | Yes | Mount path. It must start with `/` and cannot be `/`. |
| `dir` | `string` | Yes | Relative directory path inside the plugin directory. |
| `options` | `object` | No | `{ spa?: boolean }`. With `spa: true`, unmatched paths fall back to `index.html`. |

**Return value:** `undefined`.

**Static file behavior:**

- Registers both `GET` and `HEAD`.
- The mount root resolves to `index.html`.
- A subdirectory resolves to that directory's `index.html`.
- In non-SPA mode, a missing file returns `404`.
- In SPA mode, failed resolution falls back to the mount directory's `index.html`.

**Example:**

```js
const server = require("server");

function load() {
  server.static("/panel", "dist", { spa: true });
}
```

In this example, files are served from `data/plugin/<short>/dist`.

### 5.3 `server.call(method, params?)`

**Description:** Calls a registered Komari RPC method with administrator authority.

**Permission:** `allowSystemRPC`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `method` | `string` | Yes | RPC method name, such as `common:getVersion`. |
| `params` | `any` | No | RPC parameters. A single value is passed directly; multiple values are passed positionally. |

**Return value:** `Promise<any>`. It resolves to the RPC result. On failure it rejects with an `Error` carrying `code`, `message`, and optional `data`.

**Basic calls:**

```js
const version = await server.call("common:getVersion");
const result = await server.call("plugin:echo", { text: "hello" });
```

**Example:**

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
      res.end(JSON.stringify({
        code: error.code,
        message: error.message,
        data: error.data
      }));
    }
  });
}
```

For the parameters, return values, and errors of individual RPC methods, see the [RPC documentation](../rpc.md).

### 5.4 `server.hook(kind, fn)` / `server.hook(kind, matcher, fn)`

**Description:** Registers HTTP request or response hooks, or WebSocket connection and frame hooks.

**Permission:** `allowHooks`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `kind` | `string` | Yes | `request`, `response`, `wsConnect`, `wsMessage`, `wsSend`, or `wsClose`. |
| `matcher` | `string` | No | HTTP hooks support `"METHOD /path"`, `"/path"`, and `"/path/*"`. WebSocket hooks accept only path matchers. |
| `fn` | `function` | Yes | Hook callback. |

**Return value:** `undefined`.

**Callback signatures:**

| `kind` | Callback signature | Return value |
| --- | --- | --- |
| `request` | `(req) => void` | None |
| `response` | `(req, res) => void` | None |
| `wsConnect` | `(ctx) => object \| void` | `{ deny?: boolean, reason?: string }` |
| `wsMessage` | `(ctx, msg) => object \| void` | `{ type?: number, data?: any, drop?: boolean }` |
| `wsSend` | `(ctx, msg) => object \| void` | `{ type?: number, data?: any, drop?: boolean }` |
| `wsClose` | `(ctx) => void` | None |

**Example:**

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

The HTTP hook matcher, execution order, and error behavior, as well as the WebSocket hook context and frame handling rules, are described below.

#### 5.4.1 `request` Hook

**Description:** Modifies a request before the business handler runs.

**Registration:** `server.hook("request", fn)` or `server.hook("request", matcher, fn)`.

**Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `req` | `Request` | Mutable request object. |

**`Request` fields:**

| Field | Type | Writable | Description |
| --- | --- | --- | --- |
| `method` | `string` | Yes | Request method. |
| `url` | `string` | Yes | Request URI, including the query string. |
| `headers` | `Record<string,string \| string[]>` | Yes | Request headers with lowercase keys. |
| `query` | `Record<string,string>` | No | Parsed query parameters. Changing this object does not write back to the URL. |
| `body` | `string` | Yes | Request body text. |
| `context` | `HookContext` | No | Network information. |

**`HookContext` fields:**

| Field | Type | Description |
| --- | --- | --- |
| `remote_ip` | `string` | Uses the first `X-Forwarded-For` entry, then `X-Real-IP`, then the host from `RemoteAddr`. |
| `user_agent` | `string` | User-Agent header. |

**Return value:** None. Direct changes to `req.method`, `req.url`, `req.headers`, and `req.body` take effect.

**Example:**

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

When a request matches the matcher, the request body is read and buffered. Requests that do not match skip both the hook and buffering. If the request body exceeds `permissions.maxHTTPBodyBytes`, the server returns `413`.

#### 5.4.2 `response` Hook

**Description:** Modifies response status, headers, and body after the business handler returns.

**Registration:** `server.hook("response", fn)` or `server.hook("response", matcher, fn)`.

**Parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `req` | `Request` | Same request object as in 5.4.1. In a response hook, `body` is `""`. |
| `res` | `Response` | Mutable response object. |

**`Response` fields:**

| Field | Type | Writable | Description |
| --- | --- | --- | --- |
| `statusCode` | `number` | Yes | HTTP status code. |
| `statusMessage` | `string` | Yes | Currently always an empty string. |
| `headers` | `Record<string,string \| string[]>` | Yes | Response headers with lowercase keys. |
| `body` | `string` | Yes | Response body text. |

**Return value:** None. Direct changes to `res` take effect.

**Example:**

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

If the body changes, the original `Content-Length` is removed. Once the internal response buffer limit is reached, the response passes through directly and response hooks can no longer rewrite it. A streaming response enters pass-through mode after the first `Flush()`, after which hooks no longer rewrite it.

#### 5.4.3 Hook Matcher

**Formats:**

```text
"METHOD /path"
"/path"
"/path/*"
```

**Rules:**

| Rule | Description |
| --- | --- |
| Matcher omitted | Matches every request. |
| `"METHOD /path"` | Matches the specified HTTP method and exact path. |
| `"/path"` | Matches the exact path for any HTTP method. |
| `"/path/*"` | Matches `/path` and every descendant path. |
| `"/*"` | Matches every path. |

Path comparison is case-insensitive. HTTP methods must be `GET`, `HEAD`, `POST`, `PUT`, `PATCH`, `DELETE`, or `OPTIONS`. If the method in `"METHOD..."` is not recognized, the whole string is treated as a path and fails because it does not start with `/`.

#### 5.4.4 HTTP Hook Execution and Errors

- Multiple request hooks run in registration order, and each hook sees the request modifications made by the previous hook.
- Multiple response hooks run in registration order, and each hook sees the response modifications made by the previous hook.
- When a request hook reaches `timeout`, the request returns `500`. When a response hook reaches `timeout`, the error is logged and the original response is sent. Either hook may continue running after the timeout, and later side effects are not guaranteed to be rolled back.
- If a request hook throws, the request returns `500 plugin request hook failed`. If a response hook throws, the error is logged and the original response is sent.
- WebSocket upgrade requests bypass `request` and `response` hooks and use the connection and frame hooks beginning in 5.4.5.

#### 5.4.5 WebSocket Hooks

WebSocket hooks share the `allowHooks` permission with HTTP hooks. Every upgrade is a GET request, so WebSocket matchers accept only paths:

```js
server.hook("wsMessage", "/api/clients/v2/rpc", (ctx, msg) => {
  return { data: "replaced" };
});
```

#### 5.4.6 Common `ctx` Object

| Field | Type | Description |
| --- | --- | --- |
| `path` | `string` | WebSocket endpoint path. |
| `connId` | `number` | Connection ID. |
| `remoteIp` | `string` | Remote IP address. |
| `userAgent` | `string` | User-Agent header. |
| `clientUuid` | `string` | Client UUID. Omitted when empty. |

#### 5.4.7 `wsConnect`

**Callback:** `(ctx) => object | void`

**Return value:**

| Field | Type | Description |
| --- | --- | --- |
| `deny` | `boolean` | When `true`, reject the connection. |
| `reason` | `string` | Rejection reason. |

**Example:**

```js
const server = require("server");

function load() {
  server.hook("wsConnect", "/api/clients/v2/rpc", (ctx) => {
    if (ctx.remoteIp === "203.0.113.9") {
      return {
        deny: true,
        reason: "blocked by plugin"
      };
    }
  });
}
```

The first hook returning `deny: true` rejects the connection. Returning `undefined`, `null`, or an object without `deny` allows the connection.

#### 5.4.8 `wsMessage`

**Callback:** `(ctx, msg) => object | void`

**Inbound `msg`:**

| Field | Type | Description |
| --- | --- | --- |
| `type` | `number` | WebSocket frame type. |
| `data` | `string \| ArrayBuffer` | String for a text frame, ArrayBuffer for a binary frame. |
| `connId` | `number` | Connection ID. |
| `path` | `string` | Endpoint path. |

**Return value:**

| Field | Type | Description |
| --- | --- | --- |
| `type` | `number` | Replacement frame type. |
| `data` | `string \| ArrayBuffer \| Buffer \| Uint8Array` | Replacement frame payload. |
| `drop` | `boolean` | When `true`, drop the frame. This takes precedence over `type` and `data`. |

**Example:**

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

Multiple `wsMessage` hooks run in registration order as a chain. Each hook sees the frame produced by the previous hook. Oversized frames pass through directly.

#### 5.4.9 `wsSend`

**Callback:** `(ctx, msg) => object | void`

Its parameters, return shape, and chaining rules are the same as `wsMessage`, but it applies to frames sent from the server to the client.

**Example:**

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

**Callback:** `(ctx) => void`

Called once when the connection ends. Its return value is ignored.

**Example:**

```js
const server = require("server");

function load() {
  server.hook("wsClose", "/api/clients/v2/rpc", (ctx) => {
    console.log("websocket closed: " + ctx.connId);
  });
}
```

#### 5.4.11 WebSocket Hook Limits

- `wsMessage` and `wsSend` allow at most 8 MiB per frame. Larger frames skip every hook and pass through unchanged.
- Each frame-level hook waits at most one second. After a timeout, the event is logged and the frame passes through unchanged.
- Connection-level hooks use `permissions.timeout`.
- After 16 consecutive dropped frames, the read loop ends with an error.
- If the runtime closes, a hook times out, or a hook throws, the connection or frame continues with safe pass-through behavior.

### 5.5 `server.injectHTML(head, body)`

**Description:** Injects HTML fragments into every `text/html` response. `head` is inserted before `</head>`, and `body` is inserted before `</body>`.

**Permission:** `allowHTMLInject`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `head` | `string` | Yes | Fragment inserted before `</head>`. Pass an empty string when unused. |
| `body` | `string` | Yes | Fragment inserted before `</body>`. Pass an empty string when unused. |

**Return value:** `undefined`.

**Example:**

```js
const server = require("server");

function load() {
  server.injectHTML(
    '<link rel="stylesheet" href="/api/plugin/status-extension/assets/panel.css">',
    '<script src="/api/plugin/status-extension/assets/panel.js"></script>'
  );
}
```

Injection applies to every HTML page, including admin and terminal pages. Responses larger than the internal HTML buffer limit are not injected.

### 5.6 `server.cron(expr, fn)`

**Description:** Runs a callback on the plugin event loop according to a cron expression.

**Permission:** Granted by default; no manifest declaration is required.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `expr` | `string` | Yes | A 5-field or 6-field cron expression, or `@every <duration>`. |
| `fn` | `() => void` | Yes | Scheduled callback. Its return value does not affect scheduling. |

**Return value:** `undefined`.

**Expression formats:**

| Format | Fields |
| --- | --- |
| 5 fields | `minute hour day-of-month month day-of-week` |
| 6 fields | `second minute hour day-of-month month day-of-week` |
| Interval | `@every 30s`, `@every 1m`, `@every 1h` |

Fields support `*`, `*/n`, `a-b`, `a-b/n`, comma-separated lists, and specific numbers. In `day-of-week`, `7` is equivalent to `0`.

**Example:**

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

Cron jobs registered by a plugin are cancelled when the plugin is unloaded.

### 5.7 `server.registerRPC(method, handler)`

**Description:** Registers a plugin-owned RPC method.

**Permission:** Granted by default; no manifest declaration is required.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `method` | `string` | Yes | RPC method name. It cannot be empty or start with `rpc.`. |
| `handler` | `(params) => any` | Yes | RPC handler. It receives the raw `params` and returns a synchronously JSON-serializable value. |

**Return value:** `undefined`.

**Example:**

```js
const server = require("server");

function load() {
  server.registerRPC("plugin:statusEcho", (params) => {
    return {
      echo: params,
      at: new Date().toISOString()
    };
  });
}
```

A normal `Error` thrown by the handler becomes JSON-RPC `-32603`. To return a business error code, attach `code` and `data` to the Error:

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

See section 10 for the invocation entry point and permission rules.

### 5.8 `server.getConfig()`

**Description:** Reads the saved plugin configuration and merges it with defaults declared in the manifest.

**Permission:** Granted by default; no manifest declaration is required.

**Parameters:** None.

**Return value:** `Promise<Record<string, any>>`.

**Example:**

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

For example, if the configuration contains `message` and `enabled`, the return shape is:

```json
{
  "message": "hello",
  "enabled": true
}
```

## 6. Plugin Pages

### 6.1 Admin iframe Pages

**Description:** An iframe page with `visibility: "admin"` is loaded by the admin navigation.

**File route:** `GET /api/admin/plugin/:short/*filepath`

**Authentication:** Administrator.

**Path parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `short` | `string` | Plugin short name. |
| `filepath` | `string` | File path inside the plugin directory. |

**Return value:** File contents. Returns `404` if the file is missing, the path is invalid, or the plugin is not installed.

**Example:**

```bash
curl -s "$BASE/api/admin/plugin/status-extension/pages/admin.html" \
  -H "Cookie: $COOKIE"
```

Resources from the same origin in `pages/admin.html` can use the same prefix:

```html
<link rel="stylesheet" href="/api/admin/plugin/status-extension/pages/admin.css">
<script src="/api/admin/plugin/status-extension/pages/admin.js"></script>
```

### 6.2 Public iframe Pages

**Description:** A page with `visibility: "public"` and `type: "iframe"` can be accessed without authentication.

**File route:** `GET /api/plugin/:short/*filepath`

**Authentication:** None.

**Path parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `short` | `string` | Plugin short name. |
| `filepath` | `string` | File path inside the directory of the public page. |

**Return value:** File contents. Returns `404` if the plugin is disabled, the file is outside the public page directory, or the path is invalid.

**Example:**

```bash
curl -s "http://127.0.0.1:8080/api/plugin/status-extension/pages/public.html"
```

If the public page is `pages/public.html`, relative resources such as `pages/public.js` and `pages/public.css` in the same directory are also accessible. Files outside that directory, such as `script.js` or an admin page, and paths containing `../` are not accessible.

### 6.3 `redirect` Pages

A page with `type: "redirect"` is not served from the plugin's static file route. The admin UI navigates to the internal path specified by `url`. The URL must start with `/`, must not start with `//`, and cannot contain backslashes, a URL scheme, or a `..` path segment.

**Example:**

```json
{
  "title": "Open dashboard",
  "type": "redirect",
  "url": "/admin/dashboard",
  "visibility": "admin"
}
```

## 7. Plugin Configuration

### 7.1 Reading Configuration in a Plugin

Use `server.getConfig()` inside the plugin. See 5.8. The result merges saved values with manifest defaults.

### 7.2 Reading Configuration Declarations and Values as an Administrator

**Interface:** `GET /api/admin/plugin/configuration?short=<short>`

**Authentication:** Administrator.

**Query parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `short` | `string` | Yes | Plugin short name. |

**Return value:** Standard envelope. `data.configuration` is the manifest configuration declaration, and `data.data` is the resolved saved values.

**Example:**

```bash
curl -s "$BASE/api/admin/plugin/configuration?short=status-extension" \
  -H "Cookie: $COOKIE"
```

Example response:

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

### 7.3 Saving Configuration as an Administrator

**Interface:** `POST /api/admin/plugin/configuration`

**Authentication:** Administrator.

**Request body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `short` | `string` | Yes | Plugin short name. |
| `data` | `object` | No | Complete configuration value object. When omitted or `null`, an empty object is saved. |

**Return value:** Standard success envelope. If the plugin is enabled, it is reloaded immediately after saving.

**Example:**

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

If saving succeeds but the reload fails, the configuration has already been written and the call returns an error containing `plugin configuration saved but reload failed`.

## 8. Plugin-owned RPC

### 8.1 Registration

Plugins register methods through `server.registerRPC(method, handler)`. See 5.7.

### 8.2 Invocation

Registered methods enter the Komari RPC registry. They can be called through the existing `/api/rpc2` endpoint or by another plugin through `server.call()`. This document does not repeat the RPC request envelope, error codes, or authentication details; see the [RPC documentation](../rpc.md).

**HTTP example:**

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

**Calling another plugin's method:**

```js
const result = await server.call("plugin:statusEcho", {
  text: "hello"
});
```

### 8.3 Rules

- The method name cannot be empty and cannot start with `rpc.`.
- Registering the same method more than once during a single load of the same plugin is ignored.
- The handler receives one raw `params` value and does not automatically unwrap named parameters.
- The handler is called synchronously. Returning a Promise does not wait for its asynchronous result.
- The return value must be JSON-serializable. Export failures such as circular references return `-32603`.
- The handler times out after `permissions.timeout` seconds and returns `-32011`.
- When the plugin unloads, its methods are unregistered. Later calls return `-32601`.
- If a method name conflicts with an existing method, registration fails and plugin loading fails.
- Plugin methods still go through the unified ACL. Registering a `plugin:*` method without an additional permission declaration requires the administrator role.

## 9. Plugin Management HTTP Interfaces

This section documents the HTTP routes exposed by plugin management. Except for chunked uploads and the market, most routes bridge to `admin:*` RPC methods. Their response shape depends on the target RPC result, which is not repeated here.

All interfaces require administrator authentication. "Standard envelope" means a successful response shaped like `{ "status": "success", "message": "...", "data": ... }`, while errors use `{ "status": "error", "message": "..." }` with an appropriate HTTP status.

### 9.1 Plugin List

**Interface:** `GET /api/admin/plugin/list`

**Path parameters:** None.

**Query parameters:** None.

**Request body:** None.

**Return value:** Standard envelope whose `data` is `PluginInfo[]`.

**`PluginInfo`:**

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string \| Record<string,string>` | Manifest name. |
| `short` | `string` | Plugin short name. |
| `description` | `string \| Record<string,string>` | Manifest description. |
| `author` | `string \| Record<string,string>` | Manifest author. |
| `version` | `string` | Version. |
| `url` | `string` | Plugin URL. |
| `icon` | `string` | Relative icon path. |
| `komari` | `string` | Server version constraint. |
| `entry` | `string` | Entry script. |
| `permissions` | `PluginPermissions` | Permission object. |
| `configuration` | `Configuration` | Configuration declaration. |
| `pages` | `PluginPage[]` | Page declarations. Omitted when absent. |
| `enabled` | `boolean` | Whether the plugin is persistently enabled. |
| `running` | `boolean` | Whether the plugin is currently running. |
| `last_error` | `string` | Latest load error, or an empty string. |

**Example:**

```bash
curl -s "$BASE/api/admin/plugin/list" \
  -H "Cookie: $COOKIE"
```

### 9.2 Enabling or Disabling a Plugin

**Interface:** `POST /api/admin/plugin/enabled`

**Authentication:** Administrator.

**Request body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `short` | `string` | Yes | Plugin short name. |
| `enabled` | `boolean` | No | `true` enables and `false` disables. Omitted values are treated as `false`. |
| `approved` | `boolean` | No | Whether to approve the current permission set. It is `false` when omitted and approval is required. |

**Return value:** Standard success envelope. When permissions are not approved, `data` is `{ "requires_approval": true }`. After approving, retry with `approved: true`.

**Example:**

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

### 9.3 Getting Plugin Logs

**Interface:** `GET /api/admin/plugin/logs?short=<short>`

**Authentication:** Administrator.

**Query parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `short` | `string` | Yes | Plugin short name. |

**Return value:** Standard envelope whose `data.logs` is the log string.

**Example:**

```bash
curl -s "$BASE/api/admin/plugin/logs?short=status-extension" \
  -H "Cookie: $COOKIE"
```

Example response:

```json
{
  "status": "success",
  "data": {
    "logs": "[plugin] loading status-extension\n[plugin] loaded status-extension\n"
  }
}
```

### 9.4 Deleting a Plugin

**Interface:** `POST /api/admin/plugin/delete`

**Authentication:** Administrator.

**Request body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `short` | `string` | Yes | Plugin short name. |

**Return value:** Standard success envelope. Returns an error when the plugin is not installed.

**Example:**

```bash
curl -s -X POST "$BASE/api/admin/plugin/delete" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"short":"status-extension"}'
```

Deletion unloads the runtime and removes `data/plugin/<short>`, `data/plugin-data/<short>`, and the persisted state.

### 9.5 Installing a Plugin with Chunked Upload

Plugin installation uses the shared archive upload interface with `purpose` set to `plugin`.

#### 9.5.1 Initialization

**Interface:** `POST /api/admin/upload/init`

**Request body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `purpose` | `string` | Yes | Must be `"plugin"`. |
| `filename` | `string` | No | ZIP filename. The plugin installation flow does not depend on this field. |
| `size` | `integer` | Yes | Total file size in bytes. It must be greater than `0` and no larger than the backup archive limit. |

**Return value:** Standard envelope. `data.upload_id` is a UUID and `data.chunk_size` is 5 MiB.

**Example:**

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

#### 9.5.2 Uploading a Chunk

**Interface:** `POST /api/admin/upload/chunk`

**Content-Type:** `multipart/form-data`

**Form fields:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `upload_id` | `string` | Yes | UUID returned by initialization. |
| `chunk_index` | `integer` | Yes | Zero-based chunk index. |
| `chunk_data` | `file` | Yes | Chunk bytes. Every chunk must be exactly 5 MiB except the final chunk. |

**Return value:** Standard envelope. `data` contains `received: true` and `chunk_index`.

**Example:**

```bash
curl -s -X POST "$BASE/api/admin/upload/chunk" \
  -H "Cookie: $COOKIE" \
  -F "upload_id=<upload-id>" \
  -F "chunk_index=0" \
  -F "chunk_data=@chunk-0.bin"
```

#### 9.5.3 Merging and Installing

**Interface:** `POST /api/admin/upload/merge`

**Request body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `upload_id` | `string` | Yes | UUID returned by initialization. |

**Return value:** Standard envelope. The server currently returns `插件上传成功` as `message` (Chinese for "plugin uploaded successfully"), and `data` is the installed `Plugin` manifest.

**Example:**

```bash
curl -s -X POST "$BASE/api/admin/upload/merge" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"upload_id":"<upload-id>"}'
```

#### 9.5.4 Cancelling an Upload

**Interface:** `POST /api/admin/upload/cancel`

**Request body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `upload_id` | `string` | Yes | UUID returned by initialization. |

**Return value:** Standard success envelope.

**Example:**

```bash
curl -s -X POST "$BASE/api/admin/upload/cancel" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{"upload_id":"<upload-id>"}'
```

### 9.6 Plugin Market Sources

#### 9.6.1 Listing Sources

**Interface:** `GET /api/admin/plugin/market/sources`

**Request body:** None.

**Return value:** Standard envelope whose `data` is `PluginMarketSource[]`.

**Example:**

```bash
curl -s "$BASE/api/admin/plugin/market/sources" \
  -H "Cookie: $COOKIE"
```

#### 9.6.2 Creating a Source

**Interface:** `POST /api/admin/plugin/market/sources`

**Request body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string` | Yes | Source name. |
| `url` | `string` | Yes | HTTP or HTTPS catalog URL. |
| `enabled` | `boolean` | No | Whether the source is enabled. Defaults to `false`. |
| `id` | `string` | No | Ignored. The server generates a new ID. |

**Return value:** Standard success envelope whose `data` is the created `PluginMarketSource`.

**Example:**

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

#### 9.6.3 Updating a Source

**Interface:** `PUT /api/admin/plugin/market/sources/:id`

**Path parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | Source ID. |

**Request body:** Same as creating a source. The path parameter overrides `id` in the request body.

**Return value:** Standard success envelope whose `data` is the updated source.

**Example:**

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

#### 9.6.4 Deleting a Source

**Interface:** `DELETE /api/admin/plugin/market/sources/:id`

**Path parameters:**

| Parameter | Type | Description |
| --- | --- | --- |
| `id` | `string` | Source ID. |

**Return value:** Standard success envelope.

**Example:**

```bash
curl -s -X DELETE "$BASE/api/admin/plugin/market/sources/<source-id>" \
  -H "Cookie: $COOKIE"
```

### 9.7 Plugin Market Catalog

**Interface:** `GET /api/admin/plugin/market/catalog`

**Query parameters:**

| Parameter | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `refresh` | `boolean` | No | `false` | When `true`, bypass the cache. |

**Return value:** Standard envelope. `data.plugins` is the merged plugin list and `data.sources` is the status of each source.

**`PluginMarketPlugin`:**

| Field | Type | Description |
| --- | --- | --- |
| `name` | `string \| Record<string,string>` | Plugin name. |
| `short` | `string` | Plugin short name. |
| `description` | `string \| Record<string,string>` | Description. |
| `version` | `string` | Version. |
| `author` | `string \| Record<string,string>` | Author. |
| `url` | `string` | Plugin page URL. |
| `download` | `string` | ZIP download URL, or an empty string when no package is available. |
| `sha256` | `string` | ZIP SHA-256, or an empty string when no package is available. |
| `komari` | `string` | Server version constraint. |
| `installable` | `boolean` | Whether an installable package exists and the version constraint is satisfied. |
| `source_id` | `string` | Source ID. |
| `source_name` | `string` | Source name. |

**`sources[]`:**

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | Source ID. |
| `name` | `string` | Source name. |
| `url` | `string` | Source URL. |
| `count` | `integer` | Number of plugins read from this source. |
| `error` | `string` | Source read error. Omitted on success. |

**Example:**

```bash
curl -s "$BASE/api/admin/plugin/market/catalog?refresh=true" \
  -H "Cookie: $COOKIE"
```

### 9.8 Installing a Plugin from the Market

**Interface:** `POST /api/admin/plugin/market/install`

**Request body:**

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `source_id` | `string` | Yes | ID of an enabled market source. |
| `short` | `string` | Yes | Short name of the plugin to install. |

**Return value:** Standard success envelope whose `data` is the installed manifest.

**Example:**

```bash
curl -s -X POST "$BASE/api/admin/plugin/market/install" \
  -H "Cookie: $COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "source_id": "official",
    "short": "status-extension"
  }'
```

The server fetches the catalog again, downloads the ZIP, validates its SHA-256, and confirms that the installed `short` and `version` match the catalog.

## 10. Permissions, Limits, and Errors

### 10.1 Permission Matrix

| Interface | Permission |
| --- | --- |
| `server.route()` | `allowRoutes` |
| `server.static()` | `allowRoutes` |
| `server.hook()` | `allowHooks` |
| `server.injectHTML()` | `allowHTMLInject` |
| `server.call()` | `allowSystemRPC` |
| `server.registerRPC()` | Granted by default |
| `server.getConfig()` | Granted by default |
| `server.cron()` | Granted by default |
| File access inside the plugin directory | Granted by default |
| File access outside the plugin directory | `allowAllFileAccess` |
| `child_process` | `allowExec` and `node: true` |
| Listening on a local port | `allowListen` and `node: true` |

### 10.2 Time and Capacity Limits

| Item | Current value |
| --- | --- |
| Default execution timeout | 30 seconds |
| Default HTTP body limit | 32 MiB |
| Default child process output limit | 1 MiB |
| HTTP hook response buffer limit | 32 MiB |
| HTML injection buffer limit | 32 MiB |
| WebSocket frame hook limit | 8 MiB |
| WebSocket frame hook timeout | 1 second |
| Consecutive WebSocket frame drops | 16 frames |

### 10.3 Error Objects

`server.call()` rejection:

```js
{
  name: "Error",
  message: "method not found",
  code: -32601,
  data: "optional detail"
}
```

Error thrown by a `server.registerRPC()` handler:

```js
const error = new Error("boom");
error.code = -32045;
error.data = { detail: "x" };
throw error;
```

Common JSON-RPC error codes:

| Code | Meaning |
| --- | --- |
| `-32700` | Parse error |
| `-32600` | Invalid request |
| `-32601` | Method not found |
| `-32602` | Invalid params |
| `-32603` | Internal error |
| `-32011` | Deadline exceeded |
| `-32040` | Unauthenticated |
| `-32041` | Permission denied |
| `-32044` | Not found |
| `-32045` | Already exists |
| `-32051` | Unavailable |

### 10.4 Lifecycle Cleanup

| Resource | Behavior when the plugin unloads |
| --- | --- |
| Route slot registered by `server.route()` | Retained; requests return `404`. |
| Static route slot registered by `server.static()` | Retained; requests return `404`. |
| HTTP request and response hooks | Removed. |
| WebSocket hooks | Removed. |
| Fragments registered by `server.injectHTML()` | Removed. |
| Jobs registered by `server.cron()` | Cancelled and removed. |
| Methods registered by `server.registerRPC()` | Unregistered. |
| Plugin-created timers, listeners, and processes | The runtime closes registered resources. The script should release them explicitly in `unload()`. |
