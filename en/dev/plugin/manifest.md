# Manifest Reference (komari-plugin.json)

`komari-plugin.json` must be located at the **root** of the plugin ZIP. It declares the
plugin's metadata, permissions, configuration items, and injected pages. The server
validates this file on install, load, and enable.

## All Fields

| Field | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `name` | string \| i18n object | Yes | — | Plugin name. An empty string or empty map fails validation |
| `short` | string | Yes | — | Unique plugin short name, also used as the directory name under `data/plugin` and `data/plugin-data` (long-term storage). Only `[A-Za-z0-9_-]`, must not be `default` |
| `description` | string \| i18n object | No | — | Plugin description |
| `author` | string \| i18n object | No | — | Author |
| `version` | string | No | — | Plugin version (required for market publishing) |
| `url` | string | No | — | Project homepage / repository URL |
| `icon` | string | No | — | Icon path; must be a relative path inside the plugin directory |
| `komari` | string | No | `""` | Server version constraint, e.g. `>=1.0.0` (see below) |
| `entry` | string | No | `"script.js"` | Entry script; must be a relative path inside the plugin directory |
| `permissions` | object | No | all zero | Capability declarations, see below |
| `configuration` | object | No | — | Configuration item declarations, same shape as themes, see below |
| `pages` | array | No | `[]` | Injected admin pages, see below |

::: tip i18n fields
`name`, `description`, `author` and page `title` can be plain strings or i18n objects
such as `{"zh_CN": "...", "en": "..."}`. The frontend resolves them against the current
locale; `-`/`_` key spellings are interchangeable (e.g. `zh-CN` equals `zh_CN`).
Resolution order: exact match → normalized match → base language (`zh`) → language
family prefix → first value.
:::

## Version Constraint `komari`

Constrains the running server version. Supported syntax (optional leading `v`):

| Syntax | Meaning |
| --- | --- |
| empty | any version |
| `1.0.0` or `=1.0.0` | exact match |
| `>=1.0.0` / `>1.0.0` | minimum version |
| `<=1.0.0` / `<1.0.0` | maximum version |

Installation is rejected when the constraint is not satisfied, and loading also fails.
The `komari` field in the market catalog must **exactly match** the manifest.

## Permissions

Except for `node`, `maxHTTPBodyBytes`, `maxChildOutputBytes`, and `timeout`, every field
defaults to `false`/`0` — **nothing is granted unless declared**.

| Field | Type | Default | Description | Triggers approval |
| --- | --- | --- | --- | --- |
| `node` | boolean | `false` | Enable Node.js compatibility modules (events/path/os/process/fs/child_process/net/http/stream/crypto and the `Buffer`/`process`/`global` globals) | No |
| `allowSystemRPC` | boolean | `false` | Allow `server.call` to invoke system RPC with admin authority | **Yes** |
| `allowRoutes` | boolean | `false` | Allow `server.route` to register HTTP routes on the host engine | **Yes** |
| `allowHooks` | boolean | `false` | Allow `server.hook` to modify HTTP requests/responses | **Yes** |
| `allowHTMLInject` | boolean | `false` | Allow `server.injectHTML` to embed CSS/JS into every HTML page | **Yes** |
| `allowExec` | boolean | `false` | Allow `child_process` to execute child processes | **Yes** |
| `allowListen` | boolean | `false` | Allow `net`/`http` Servers to listen on local ports | **Yes** |
| `allowAllFileAccess` | boolean | `false` | Allow accessing files outside the plugin directory | **Yes** |
| `maxHTTPBodyBytes` | int | 32 MiB | Buffering limit for fetch response bodies and HTTP request bodies | No |
| `maxChildOutputBytes` | int | 1 MiB | stdout/stderr cap for child processes | No |
| `timeout` | int | 30 | Per-turn execution timeout in seconds | No |

::: tip Always granted
`server.registerRPC`, `server.getConfig`, and read/write access **inside the plugin
directory** are always granted — no manifest declaration needed and no approval
triggered.
:::

::: warning Approval mechanism
When any of `allowSystemRPC` / `allowRoutes` / `allowHooks` / `allowHTMLInject` /
`allowExec` / `allowListen` / `allowAllFileAccess` is `true`, enabling the plugin
requires admin approval. The approval hash covers only these 7 fields; later changes
to `node`, timeout, or size limits do **not** re-trigger approval, but changing a
sensitive capability does.
:::

## Configuration

Same shape as theme configuration, supporting declarative config with
`type: "managed"`: the admin UI generates a form automatically, and the plugin reads
values via `server.getConfig()` (saved values are merged with manifest defaults).

```json
{
  "configuration": {
    "type": "managed",
    "data": [
      { "key": "greeting", "name": "Greeting", "type": "string", "default": "Hello" },
      { "key": "count", "name": "Count", "type": "number" },
      { "key": "enabled", "name": "Enabled", "type": "switch", "default": true },
      { "key": "mode", "name": "Mode", "type": "select", "options": "json,text" },
      { "key": "note", "name": "Note", "type": "string", "help": "Usage instructions" }
    ]
  }
}
```

### Item fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | string | Yes | Configuration key |
| `name` | string \| i18n | Yes | Form label |
| `type` | string | Yes | `string` / `number` / `select` / `switch` / `title` / `richtext` |
| `options` | string | No | Options for `select`, comma-separated |
| `default` | any | No | Default value |
| `required` | boolean | No | Whether the field is required |
| `help` | string \| i18n | No | Help text |

### Default value merge rules

`server.getConfig()` returns the merge of "saved values + manifest defaults"; saved
values take precedence. Unsaved keys are filled with these fallbacks:

| Type | Fallback without default |
| --- | --- |
| `select` | first option |
| `number` | `0` |
| `switch` | `false` |
| others | `""` |

Configuration is stored in the `plugin_configurations` table of the main database.

## Pages

Plugins can inject pages into the admin UI (shown in the plugin group of the sidebar).

```json
{
  "pages": [
    { "file": "admin.html", "title": "Admin Panel", "icon": "icon.png" },
    { "type": "redirect", "title": "Go to Nodes", "url": "/" },
    { "file": "pub.html", "title": "Public Page", "visibility": "public" }
  ]
}
```

### Page fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `file` | string | required for iframe | Relative path inside the plugin directory, rendered as an iframe |
| `title` | string \| i18n | Yes | Page title |
| `icon` | string | No | Icon, relative path inside the plugin directory |
| `type` | `"iframe"` \| `"redirect"` | No | Default `iframe` |
| `url` | string | required for redirect | Internal site path (see below) |
| `visibility` | `"admin"` \| `"public"` | No | Default `admin` |

### Access URLs

| visibility | type | Access path | Auth |
| --- | --- | --- | --- |
| `admin` | `iframe` | `/api/admin/plugin/<short>/<file>` | admin login required |
| `public` | `iframe` | `/api/plugin/<short>/<file>` | no auth (public) |
| `redirect` | any | navigates to an internal site path | — |

- `public` pages require the plugin to be **enabled** and can only serve files under a
  declared public page's directory; pages are rendered in a sandboxed iframe
  (`sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"`).
- A `redirect` `url` must be a same-origin internal path: starts with `/`, must not
  start with `//`, and must not contain backslashes, URL schemes (e.g. `http:`), or
  `..` segments.

## Complete Example

```json
{
  "name": {
    "zh_CN": "示例插件",
    "en": "Example Plugin"
  },
  "short": "example",
  "description": {
    "zh_CN": "演示插件开发",
    "en": "Demonstrates plugin development"
  },
  "author": "komari",
  "version": "1.0.0",
  "url": "https://github.com/your-name/komari-example",
  "icon": "assets/icon.png",
  "komari": ">=1.0.0",
  "entry": "script.js",
  "permissions": {
    "node": true,
    "timeout": 10,
    "maxHTTPBodyBytes": 67108864,
    "allowSystemRPC": true,
    "allowRoutes": true
  },
  "configuration": {
    "type": "managed",
    "data": [
      {
        "key": "interval",
        "name": { "zh_CN": "刷新间隔", "en": "Refresh Interval" },
        "type": "number",
        "default": 5,
        "required": true
      }
    ]
  },
  "pages": [
    {
      "file": "admin.html",
      "title": { "zh_CN": "示例页面", "en": "Example Page" }
    }
  ]
}
```

## Installation validation rules (ZIP package)

| Rule | Limit |
| --- | --- |
| `komari-plugin.json` location | must be at the ZIP root |
| File count | ≤ 10,000 |
| Per-file size | ≤ 128 MiB |
| Total extracted size | ≤ 512 MiB |
| Manifest size | ≤ 1 MiB |
| Path safety | packages containing traversal entries (`../`, absolute paths) are **rejected entirely** |
| File existence | `entry` and all page files must exist (checked at install) |
