# server Module & Lifecycle Hooks

Plugins get their bridge to the host via `require("server")`. This **native module**
is injected by the plugin system and provides routing, hooks, RPC invocation, and
configuration access.

```js
const server = require("server");
```

| Method | Description | Permission |
| --- | --- | --- |
| [`server.route(method, path, handler)`](#server-route) | Register an HTTP route on the host engine | `allowRoutes` |
| [`server.static(path, dir, opts)`](#server-static) | Mount a static folder from the plugin directory, optional SPA fallback | `allowRoutes` |
| [`server.hook(kind, fn)`](#server-hook) | Register request/response hooks | `allowHooks` |
| [`server.injectHTML(head, body)`](#server-injecthtml) | Embed CSS/JS into every HTML page | `allowHTMLInject` |
| [`server.call(method, params...)`](#server-call) | Call system RPC with admin authority | `allowSystemRPC` |
| [`server.registerRPC(method, handler)`](#server-registerrpc) | Register a plugin-owned RPC method | Always granted |
| [`server.getConfig()`](#server-getconfig) | Read configuration (merged with defaults) | Always granted |

Missing `allowRoutes` / `allowHooks` / `allowHTMLInject` throws `TypeError` at
**load time** (plugin load fails); missing `allowSystemRPC` rejects the Promise
returned by `server.call`.

## Lifecycle Hooks

The entry script's **top-level code** runs immediately at load. Additionally, two
optional global functions may be defined:

```js
function load() {
  // Called every time the plugin is enabled/started (including startup recovery)
}

function unload() {
  // Called on disable, uninstall, or server shutdown
}
```

- A `load()` error (or a top-level script error) → the plugin is auto-disabled and the
  error is written to `last_error`.
- `unload()` errors are recorded but do not block unloading.
- Omitting `load()` is valid, but it is recommended to put route/hook/RPC registration
  inside `load()`.
- During `unload()` the plugin is already removed from the instance registry, so
  `server.call` rejects with "not loaded".

## server.route

Registers an HTTP route on the host gin engine:

```js
server.route("GET", "/plug", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true }));
});
```

| Arg | Type | Description |
| --- | --- | --- |
| `method` | string | HTTP method, uppercased automatically; must not be empty |
| `path` | string | Path; must start with `/` |
| `handler` | (req, res) => void | Handler; must call `res.end()` to finish |

- Requires `allowRoutes`, otherwise a `TypeError` is thrown at load time.
- Route slots survive unload (they return 404) and are restored on reload; re-registering
  the same route within one load is a no-op.

### Request object `req`

| Field | Type | Description |
| --- | --- | --- |
| `method` | string | Request method, e.g. `"GET"` |
| `url` | string | Raw request URL (with query string), e.g. `"/plug?x=7"` |
| `headers` | object | Request headers; keys are **lower-cased**, single values are strings, multi-values are arrays |
| `query` | object | Query parameters; multi-values joined with `,` |
| `body` | string | Request body (fully read, limited by `maxHTTPBodyBytes`) |
| `context` | object | Request context, see below |

`context` carries identity and origin information:

```js
{
  principal: {           // only when the identity middleware ran
    type: "agent" | "user" | "api_key" | "anonymous",
    roles: [...],
    user_uuid,
    client_uuid,
    is_api_key
  },
  role,                  // user role
  user_uuid,             // user UUID
  client_uuid,           // client UUID (agent requests)
  remote_ip,             // client IP
  user_agent             // User-Agent
}
```

### Response object `res`

| Member | Type | Description |
| --- | --- | --- |
| `statusCode` | number | Status code, default `200`, writable |
| `statusMessage` | string | Status text |
| `streaming` | boolean | Set `true` to enable streaming: every `write()` is flushed immediately |
| `isAborted()` | () => boolean | Returns `true` after the client disconnects (or streaming idle timeout) |
| `setHeader(name, value)` | fn | Set a header (`value` can be a string or array) |
| `getHeader(name)` | fn | Read a header (string / array / undefined) |
| `removeHeader(name)` | fn | Remove a header |
| `write(data)` | (Buffer \| string) => boolean | Write data; buffered until `end()` unless streaming |
| `end([data])` | fn | **Must be called** to finish the response |

::: warning Must call end()
If the handler never calls `res.end()` (and is not streaming), the client receives
**504 `plugin route handler timed out`** after `timeout`.
:::

### Streaming responses (SSE)

```js
server.route("GET", "/stream", async (req, res) => {
  res.streaming = true;
  res.setHeader("Content-Type", "text/event-stream");
  while (!res.isAborted()) {
    const data = ...; // fetch one frame
    res.write("data: " + data + "\n\n");
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
});
```

- With `res.streaming = true`, each `res.write()` is sent to the client and flushed
  immediately.
- When the client disconnects, `isAborted()` returns `true`; the script should exit its
  loop and return (returning ends the stream).
- Streaming idle timeout beyond `timeout` also aborts and closes the stream.

## server.static

Mounts a **static folder** from the plugin directory at a given path, without writing a
handler per file:

```js
server.static("/ui", "dist");
server.static("/app", "dist", { spa: true }); // SPA mode
```

| Arg | Type | Description |
| --- | --- | --- |
| `path` | string | Mount path; must start with `/` and must not be `/`; a trailing `/` is ignored |
| `dir` | string | Relative folder inside the plugin directory (e.g. `"dist"`); must exist |
| `opts` | object | Optional; `{ spa: true }` enables SPA fallback |

- Requires `allowRoutes`, otherwise a `TypeError` is thrown at load time.
- Serves `GET` and `HEAD`: the mount path itself returns `index.html` from the folder,
  subpaths return the matching file; a directory resolves to its own `index.html`.
- With `spa: true`, requests that **resolve to no file** fall back to the folder root
  `index.html` (client-side routing refreshes no longer 404); real files always win.
- Traversal requests (`..`) are rejected with 404; file resolution stays confined to `dir`.
- Like `server.route`: mount slots survive unload (they return 404) and are restored on
  reload; re-mounting the same path within one load refreshes the config.

## server.hook

Registers **request** or **response** hooks on the host HTTP chain, affecting **all**
HTTP requests entering/leaving the server (except WebSocket upgrade requests, which
pass through untouched):

```js
server.hook("request", (req) => {
  req.headers["x-hooked"] = "yes";
});

server.hook("response", (req, res) => {
  res.statusCode = 201;
  res.body = res.body + "|hooked";
});
```

| Arg | Type | Description |
| --- | --- | --- |
| `kind` | `"request"` \| `"response"` | Hook type |
| `fn` | function | Request hook `fn(req)`; response hook `fn(req, res)` |

Requires `allowHooks`, otherwise a `TypeError` is thrown at load time.

### Request hook `req`

```js
{
  method,                 // mutable: applied to the real request
  url,                    // mutable: applied to the real request
  headers,                // mutable: replaces the real request headers
  query,                  // query params (read-only snapshot)
  body,                   // mutable: replaces the request body
  context: { remote_ip, user_agent }   // no identity (hooks run before the identity middleware)
}
```

- Request bodies are read up to 32 MiB (`maxHTTPBodyBytes`).
- Hooks run in registration order; a hook error → client receives
  `500 plugin request hook failed` and remaining hooks are skipped.
- Hook execution is bounded by `timeout`; a timeout is treated as a failure.

### Response hook `res`

```js
{
  statusCode,             // mutable
  statusMessage,          // mutable
  headers,                // mutable: replaces the real response headers
  body                    // mutable: replaces the response body
}
```

- Responses are buffered (up to 32 MiB) so hooks can rewrite them.
- **Streaming responses (SSE, after the first `Flush()`) or responses larger than
  32 MiB pass through untouched**; hooks can no longer rewrite them (logged).
- Hook errors are logged only and do not block the response.

## server.injectHTML

Embeds custom CSS/JS into **every** `text/html` response: the `head` fragment is
inserted before `</head>`, the `body` fragment before `</body>` (case-insensitive; if
`</head>` is absent the `head` fragment is prepended, if `</body>` is absent the `body`
fragment is appended):

```js
server.injectHTML(
  "<style>.plugin-badge{color:red}</style>",
  '<script src="/api/mjpeg_live.js"></script>'
);
```

| Arg | Type | Description |
| --- | --- | --- |
| `head` | string | HTML embedded into `<head>` (style sheets, `<style>`, `<meta>`, ...); may be empty |
| `body` | string | HTML embedded into `<body>` (`<script>`, ...); may be empty |

- Applies to **all** HTML pages, including the `/admin` pages, the `/terminal` pages,
  the login page, public pages and plugin iframe pages (these are not affected by the
  site's `custom_head`/`custom_body` settings).
- **Non-HTML responses are never modified**: JSON, images, fonts, MJPEG/SSE streams,
  etc. pass through unmodified and are not buffered.
- Injection runs **after** the plugin response hooks, so it sees the final rewritten
  HTML.
- Responses larger than 32 MiB, streaming responses (after the first `Flush()`) and
  WebSocket upgrade requests pass through without injection.
- Multiple plugins accumulate in registration order; unloading a plugin removes its
  fragments automatically.
- Requires `allowHTMLInject`, otherwise a `TypeError` is thrown at load time.

## server.call

Invokes any registered system RPC method with **admin authority**:

```js
const result = await server.call("common:getNodes");
const status = await server.call("common:getNodesLatestStatus", { uuid: "..." });
```

| Arg | Description |
| --- | --- |
| `method` | RPC method name, e.g. `common:getNodes`, `admin:getTasks` |
| `params...` | Params. **0 args** → `null`; **1 arg** → passed as-is; **N args** → marshalled into a positional array |

Returns a Promise:

- Success → resolves to the RPC result.
- Failure → rejects an Error carrying JSON-RPC error fields:
  - `err.code` (integer)
  - `err.message`
  - `err.data` (optional)

::: warning Admin authority
`server.call` runs with `RoleAdmin`, equivalent to an admin operating the panel —
including sensitive operations such as `admin:exec`. Requires `allowSystemRPC`.
:::

See [RPC Methods](./rpc) for the full method inventory.

## server.registerRPC

Registers a plugin-owned RPC method, callable by the frontend or by other plugins (via
`server.call`):

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

| Arg | Description |
| --- | --- |
| `method` | Method name; must not be empty and must not start with `rpc.` (reserved prefix) |
| `handler` | `(params) => result`; return a result or throw an error |

- **Always granted**, no permission declaration needed.
- Re-registering the same method within one load is a no-op; methods are unregistered
  on unload.
- Handlers run on the plugin event loop; thrown JS `Error`s map to JSON-RPC errors
  (`err.code` / `err.message` / `err.data` are propagated).
- Prefer the `plugin:<name>:<action>` naming convention to avoid clashes with system
  methods.

## server.getConfig

Reads the plugin's saved configuration (merged with manifest defaults):

```js
const config = await server.getConfig();
console.log(config.interval); // defaults already merged
```

- Returns a Promise resolving to a `{ [key]: value }` object.
- Merge rules: see [Manifest Reference - Default value merge rules](./manifest#default-value-merge-rules).
- **Always granted**.
