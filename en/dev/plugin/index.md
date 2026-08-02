# Plugin Development Guide

Komari supports extending the server with **JavaScript plugins**. A plugin is a ZIP
package containing a manifest (`komari-plugin.json`) and an entry script (default
`script.js`). Plugins run inside the server process in their own sandboxed goja JS
runtime, and can register HTTP routes, intercept HTTP requests/responses, call system
RPC methods, register their own RPC methods, declare configuration items, and inject
admin pages.

::: warning Security
Plugins run with **admin privileges** and may request sensitive capabilities such as
filesystem access, child process execution, or port listening. Only install plugins
you trust; review the declared permissions carefully before enabling third-party
plugins.
:::

## What a plugin can do

| Capability | API | Required permission | Notes |
| --- | --- | --- | --- |
| Register RPC methods | `server.registerRPC` | always granted | Register `plugin:xxx` methods callable by the UI or other plugins |
| Schedule periodic tasks | `server.cron` | always granted | Run a handler on the plugin event loop on a cron schedule |
| Call system RPC | `server.call` | `allowSystemRPC` | Invoke any registered RPC method with admin authority |
| Register HTTP routes | `server.route` | `allowRoutes` | Register `METHOD /path` on the host engine; supports streaming |
| Mount a static folder | `server.static` | `allowRoutes` | Serve a folder from the plugin directory on the host engine; optional SPA fallback (`{ spa: true }`) |
| Intercept HTTP requests/responses | `server.hook` | `allowHooks` | Modify every HTTP request/response entering or leaving the server |
| Embed CSS/JS into every page | `server.injectHTML` | `allowHTMLInject` | Embed head/body fragments into every HTML response (incl. admin and terminal pages) |
| Read plugin configuration | `server.getConfig` | always granted | Read saved configuration merged with manifest defaults |
| Declare configuration items | manifest `configuration` | no permission | Admin UI generates a config form automatically |
| Inject admin pages | manifest `pages` | no permission | Show iframe / redirect pages in the admin sidebar |
| File access | `fs` / `require` | inside plugin dir and storage dir: always granted | Sandboxed to the plugin directory and `__storageDir__` (`data/plugin-data/<short>`); escaping requires `allowAllFileAccess` |
| Node compatibility modules | `node` modules | `node` | events/fs/path/os/process/net/http/crypto, etc. |
| Child processes | `child_process` | `allowExec` | Execute external commands |
| Port listening | `net`/`http` Server | `allowListen` | Bind local ports (default `127.0.0.1`) |

## Quick Start

### 1. Create the plugin directory

```
hello/
├── komari-plugin.json
└── script.js
```

### 2. Write the manifest `komari-plugin.json`

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

See [Manifest Reference](./manifest) for all fields.

### 3. Write the entry script `script.js`

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

- The top-level script runs immediately when the plugin loads, but it is recommended
  to put logic in the global `load()` function.
- `load()` runs every time the plugin is enabled/started; `unload()` runs on disable,
  uninstall, or server shutdown.

### 4. Package and install

Put `komari-plugin.json` and `script.js` directly at the ZIP's **root** (no wrapping
folder), then upload it on the admin "Plugins" page, or install via the admin API:

```powershell
curl -X POST -H "Cookie: session_token=<your session>" --data-binary "@hello.zip" http://localhost:25774/api/admin/plugin/install
```

### 5. Enable the plugin

After installation the plugin is **disabled** by default and must be enabled manually.

Because `hello` declares `allowSystemRPC` and `allowRoutes`, enabling it triggers the
**permission approval** flow: the admin must confirm the permissions in a dialog before
the plugin can be enabled (see "Permissions & Approval" below).

Once enabled, visit `GET /hello` to see the plugin's JSON response.

::: tip Installation limits
ZIP packages: up to 10,000 files, each file ≤ 128 MiB, total extracted ≤ 512 MiB,
manifest ≤ 1 MiB. Any path-traversal entry (`../`, absolute paths) rejects the
**entire** package.
:::

## Lifecycle

### Load `load()`

1. The server reads and validates `komari-plugin.json` and checks the `komari` version
   constraint.
2. A dedicated JS runtime is created (sandbox root: `data/plugin/<short>`, plus the
   long-term storage directory `data/plugin-data/<short>` injected as `__storageDir__`),
   and the entry script is **executed immediately**.
3. If the script defines a global `load()` function, it is invoked.
4. A top-level error or a `load()` error → the plugin is **auto-disabled** and the
   error is persisted in `last_error`.

### Unload `unload()`

Triggered on disable, delete, or server shutdown:

1. The plugin is removed from the instance registry first (so `server.call` rejects
   with "not loaded" from inside `unload()`).
2. The global `unload()` is called if defined (errors are recorded, not blocking).
3. Registered RPC methods are unregistered, handlers and hooks cleared, and the
   runtime closed.

::: warning Route slots persist
Gin route slots registered by a plugin **remain after unload**: requests to those
routes receive **404** until the plugin is loaded again. Reinstalling a running plugin
unloads it first and restores its persisted enabled state.
:::

### Startup recovery

On server startup (`LoadAll`), every **enabled and approved** plugin is loaded
automatically; plugins that fail to load are auto-disabled with `last_error` persisted
(this does not stop the server from starting).

## Long-term storage directory `__storageDir__`

Every plugin gets a dedicated long-term storage directory when enabled:

```text
data/plugin-data/<short>/   # long-term storage (untouched by updates)
```

- Fully separated from the code directory `data/plugin/<short>` (the ZIP contents); the
  `fs` sandbox covers both directories.
- Scripts access it via the global `__storageDir__` (injected in NodeJS mode, absolute
  path):
  ```js
  const fs = require("fs");
  const path = require("path");
  fs.writeFileSync(path.join(__storageDir__, "cache.json"), "{}");
  ```
- **Updates (reinstall) replace only the code directory; the long-term storage survives**
  — suitable for caches, user data, and similar state.
- **Deleting a plugin removes both directories** (delete means full removal).
- Same sandbox rules as the plugin directory: nothing escapes `__storageDir__`, other
  plugins' storage directories are unreachable, and cross-directory `fs.renameSync`
  (plugin dir ↔ storage dir) is rejected.

## Permissions & Approval

### Permission model

- **Always granted** (no declaration needed, no approval): `server.registerRPC`,
  `server.cron`, `server.getConfig`, file access inside the plugin directory and
  `__storageDir__`.
- **Granted by declaration** (runtime settings, no approval): `permissions.node`,
  `maxHTTPBodyBytes`, `maxChildOutputBytes`, `timeout`.
- **Require admin approval** (7 sensitive capabilities; any of them being `true`
  triggers the flow): `allowSystemRPC`, `allowRoutes`, `allowHooks`,
  `allowHTMLInject`, `allowExec`, `allowListen`, `allowAllFileAccess`.

### Approval flow

When `admin:setPluginEnabled` enables a plugin, the server compares the declared
capability set with the hash saved at the last approval:

- Matches → enabled directly.
- Differs and the plugin is not yet approved → returns `{ requires_approval: true }`;
  the admin UI shows a permission dialog, and retries with `approved: true` after
  confirmation.
- Changing sensitive capabilities after approval → requires re-approval (changes to
  `node`/timeout/size limits do **not** re-trigger approval).

::: tip Capability hash
The approval hash covers only the 7 sensitive capabilities (a `sha256:`-prefixed JSON
hash); `node`, `maxHTTPBodyBytes`, `maxChildOutputBytes`, and `timeout` are excluded.
:::

### Behavior when a permission is missing

| API | Behavior without permission |
| --- | --- |
| `server.route` / `server.static` / `server.hook` / `server.injectHTML` | Throws `TypeError` at **load time**; plugin load fails (auto-disabled) |
| `server.call` | The returned Promise is **rejected** (load not blocked) |
| `require("child_process")` | Throws (no `allowExec`) |
| `net`/`http` Server `listen()` | Throws (no `allowListen`) |
| `fs` / `require` outside plugin dir | Rejected by the sandbox (no `allowAllFileAccess`) |

## Debugging

Each plugin has a dedicated 64 KiB ring log buffer; `console.*` output and
lifecycle/hook errors are written to it (reset on every load). Read it via the RPC2
method `admin:getPluginLogs` (param `{short}`):

```
POST /api/rpc2
{"jsonrpc":"2.0","id":1,"method":"admin:getPluginLogs","params":{"short":"hello"}}
```

::: tip
When a plugin fails to load, the admin "Plugins" list shows `last_error`. Combined with
the plugin logs, this diagnoses most issues (e.g. missing permissions, unsupported
runtime APIs).
:::

## Security & Limitations

- The plugin sandbox roots are `data/plugin/<short>` and
  `data/plugin-data/<short>` (`__storageDir__`): `fs` and `require` are confined to
  them, and path traversal / symlink escapes are rejected at the OS level (`os.Root`).
- `server.call` runs with **admin authority** — a plugin calling `admin:*` methods is
  equivalent to the admin doing it themselves.
- The JS runtime is **not a browser and not full Node.js**: no DOM, WebSocket, ESM,
  `for await...of`, or complete `fs`. Read the [JS Runtime Reference](./runtime) before
  relying on any API.
- Each JS turn is bounded by `timeout` (default 30 s): script init, `load()`, route
  handlers, hooks, RPC handlers, and fetch all obey it. A route handler that never
  calls `end()` produces **504**.
- There are no per-plugin CPU/memory/network quotas; `process.memoryUsage()` etc.
  report the whole Komari process.

## Continue Reading

| Document | Contents |
| --- | --- |
| [Manifest Reference](./manifest) | All `komari-plugin.json` fields, permissions, configuration, pages |
| [server Module](./server-api) | `server.route` / `server.static` / `server.hook` / `server.injectHTML` / `server.call` / `server.registerRPC` / `server.cron` / `server.getConfig` and lifecycle hooks |
| [JS Runtime](./runtime) | Every JavaScript API available in the sandbox and its compatibility |
| [RPC Methods](./rpc) | All system RPC methods callable via `server.call` |
| [Publishing to the Plugin Market](./market) | Publish your plugin to the official plugin market |
