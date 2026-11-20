# Theme Development

Komari themes are packaged web assets plus a `komari-theme.json` metadata file.

## Theme Structure

Komari themes are distributed as ZIP archives containing all required files and static assets:

```text
theme.zip
├── komari-theme.json    # Theme manifest
├── dist/                # Build output directory
│   ├── index.html       # Main page template
│   └── ...              # Other built assets
└── ...                  # Additional files (e.g. preview image)
```

## Theme Manifest

### `komari-theme.json`

Every theme must include `komari-theme.json` at the root of the ZIP package:

```json
{
  "name": { "zh-CN": "Komari 测试主题", "en": "Komari Test Theme" },
  "short": "TestTheme",
  "description": { "zh-CN": "用于 Komari 的测试主题", "en": "A test theme for Komari" },
  "version": "1.0.0",
  "author": "Akizon77",
  "url": "https://github.com/komari-monitor/komari",
  "preview": "preview.png",
  "configuration": {}
}
```

#### Manifest Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `name` | `string \| object` | Yes | Full theme name; supports an i18n object. |
| `short` | `string` | Yes | Unique theme identifier (`[A-Za-z0-9_-]`); cannot be empty or `default`. |
| `description` | `string \| object` | No (recommended) | Theme description; supports an i18n object. |
| `version` | `string` | No (recommended) | Theme version (SemVer recommended). |
| `author` | `string \| object` | No (recommended) | Theme author; supports an i18n object. |
| `url` | `string` | No | Project repository or author homepage URL. |
| `preview` | `string` | No | Relative path to the preview image from the theme root (served under `/themes/{short}/{preview}`). |
| `configuration` | `object` | No | Dynamic configuration declaration (supported since Komari `1.0.5`). |

::: tip Tip
The backend only enforces `name` and `short` during installation, but filling in `description`, `version`, and `author` is recommended so the admin theme list displays complete metadata.

`name`, `description`, and `author` accept either a plain string or an i18n object such as `{ "zh-CN": "...", "en": "..." }`. The admin UI resolves the current locale, then its base language, then the first available value.
:::

## Dynamic Configuration (`>= 1.0.5`)

Starting with Komari server `1.0.5`, a theme can declare `configuration` in `komari-theme.json` to expose a configuration entry in the admin panel. If `configuration.type` is omitted, it defaults to `managed`.

### `configuration` Modes

| `type` | `configuration.data` | Admin Behavior |
| --- | --- | --- |
| `managed` | Array of configuration items | Generates a theme settings form in the admin panel; saved values are exposed via `theme_settings` in [`GET /api/public`](/en/dev/api#_3-7-public-settings-and-version). |
| `raw` | Non-empty HTML string (`> 1.2.0`) | Renders the HTML inside an iframe in the admin content area for custom configuration UIs. |
| `redirect` | Site-relative path string (`> 1.2.0`) | Clicking the theme menu entry navigates to that path relative to the site root. |

`redirect` paths must be site-relative paths resolved against the deployed site root (typically configured via `VITE_BASE_URL`), not `/admin`. For example, at root `/`, `settings` or `../settings` navigates to `/settings`; if deployed under `/abc/`, it navigates to `/abc/settings`. Query strings and hashes are allowed; absolute URLs, `//`-prefixed URLs, backslashes, and intermediate `..` traversal segments are rejected.

### `managed` Example

```json
{
  "name": "Komari Web Mochi",
  "short": "Mochi",
  "description": "Another Komari Web Theme with enhanced mobile UI and beautiful design",
  "version": "1.0.3",
  "author": "Mochi DEV Team",
  "url": "https://github.com/svnmoe/komari-web-mochi",
  "preview": "preview.png",
  "configuration": {
    "type": "managed",
    "icon": "/themes/Mochi/dist/assets/os-debian.svg",
    "name": "Mochi Settings",
    "data": [
      { "name": { "zh-CN": "基础设置", "en": "General" }, "type": "title" },
      {
        "key": "switch_A",
        "name": "Test Switch",
        "type": "switch",
        "default": true,
        "help": "A sample switch"
      },
      {
        "key": "select_A",
        "name": "Test Select",
        "type": "select",
        "options": "Option 1,Option 2,Option 3",
        "default": "Option 1",
        "help": "A sample dropdown"
      },
      {
        "key": "number_A",
        "name": "Test Number",
        "type": "number",
        "default": 10,
        "help": "A sample number input"
      },
      {
        "key": "string_A",
        "name": "Test String",
        "type": "string",
        "required": true,
        "help": "A sample text input"
      },
      {
        "key": "footer_html",
        "name": "Footer HTML",
        "type": "richtext",
        "default": "",
        "help": "Supports longer HTML snippets"
      },
      {
        "name": "<strong>Selectors store JSON strings and return arrays in the public API.</strong>",
        "type": "textbox"
      },
      {
        "key": "featured_nodes",
        "name": "Featured Nodes",
        "type": "nodes",
        "default": "[]",
        "help": "Stored as a JSON string of node UUIDs, returned as string[]"
      },
      {
        "key": "featured_ping_tasks",
        "name": "Featured Ping Tasks",
        "type": "pingtasks",
        "default": "[]",
        "help": "Stored as a JSON string of Ping task IDs, returned as number[]"
      }
    ]
  }
}
```

### `raw` Example

```json
{
  "name": "Komari Raw Panel",
  "short": "RawPanel",
  "description": "Theme with a custom admin panel",
  "version": "1.0.0",
  "author": "Komari",
  "preview": "preview.png",
  "configuration": {
    "type": "raw",
    "icon": "Code",
    "name": {
      "zh-CN": "自定义面板",
      "en": "Custom Panel"
    },
    "data": "<!doctype html><html><body><h1>Hello Komari</h1></body></html>"
  }
}
```

### `redirect` Example

```json
{
  "name": "Komari Redirect Panel",
  "short": "RedirectPanel",
  "description": "Theme with a redirected admin entry",
  "version": "1.0.0",
  "author": "Komari",
  "preview": "preview.png",
  "configuration": {
    "type": "redirect",
    "icon": "Settings",
    "name": {
      "zh-CN": "主题设置",
      "en": "Theme Settings"
    },
    "data": "settings/site"
  }
}
```

### `configuration` Root Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `type` | `string` | No (recommended) | `managed`, `raw`, or `redirect`; defaults to `managed` when omitted. |
| `icon` | `string` | No | Icon URL for the admin panel menu; `/themes/{short}/` maps to the theme root. |
| `name` | `string \| object` | No | Display title in the admin panel; supports an i18n object and falls back to the theme name. |
| `data` | `array \| string` | Depends on `type` | Item array for `managed`, HTML string for `raw`, site-relative path for `redirect`. |

### Managed Configuration & Public Output

Field schemas, field types, i18n resolution, default merge rules, and selector storage/output rules are shared with plugins. See [Managed Configuration](./managed-config).

The theme admin page saves values via `POST /api/admin/theme/settings?theme=<short>` and exposes them through `data.theme_settings` in `GET /api/public`:

```json
{
  "status": "success",
  "message": "",
  "data": {
    "sitename": "Komari",
    "theme": "managed-config-demo",
    "theme_settings": {
      "headline": "Komari configuration demo",
      "selected_nodes": [
        "8832553d-a03f-4312-af8b-c5d9ed959c93",
        "76d47ce1-bb17-4f03-adf5-c9a795dc1fe2"
      ],
      "selected_ping_tasks": [8, 7]
    }
  }
}
```

For installed, non-`default` managed themes, missing values are filled from manifest defaults and deleted node and Ping task IDs are omitted from `theme_settings`. Because `theme_settings` is publicly readable, never store secrets, tokens, or private URLs in theme configuration.

`raw` and `redirect` do not populate `theme_settings`. Treat `raw` HTML as trusted code and install only themes from trusted sources. Because `/admin` and `/terminal` are always served by Komari's built-in UI, place `redirect` target pages on other routes outside `/admin`.

### Static Asset Paths (`/themes/{short}/`)

Any path starting with `/themes/{short}/` is mapped by the server to the extracted root directory of that theme:

```text
/themes/Mochi/dist/assets/os-debian.svg  ->  {theme_root}/dist/assets/os-debian.svg
```

## Theme Market and Releases

Komari's built-in theme market uses the catalog in [komari-monitor/theme-market](https://github.com/komari-monitor/theme-market) by default. Administrators can search, install, update, and add JSON catalog sources from **Market - Theme Market**.

Publish an installable ZIP in a GitHub Release. The ZIP must contain `komari-theme.json` at its root together with `dist/` and static assets; GitHub's automatic source archives are not installable theme packages.

Catalog fields `name`, `description`, and `author` accept either a string or an i18n object:

```json
{
  "name": { "zh-CN": "示例主题", "en": "Example Theme" },
  "description": { "zh-CN": "用于演示", "en": "For demonstration" },
  "author": "Example Author"
}
```

The market resolves the current locale, then its base language, then the first available value. Submit catalog additions through pull requests. CI enforces case-insensitive A-Z ordering and unique `short` values; the scheduled release monitor opens a pull request only after verifying the package manifest, `short`, `version`, and SHA-256.

## Main Page Template (`dist/index.html`)

### Required Placeholders

To allow Komari's custom site title, description, header, and footer injection to work, `dist/index.html` must include:

```html
<title>Komari Monitor</title>
<meta name="description" content="A simple server monitor tool." />
```

```html
<body>
  <!-- Page content -->
</body>
```

### Server Replacement Rules

| Original Content | Replaced With |
| --- | --- |
| `<title>Komari Monitor</title>` | Custom site title configured by the admin |
| `A simple server monitor tool.` | Custom site description configured by the admin |
| `</head>` | Custom head HTML + `</head>` |
| `</body>` | Custom body HTML + `</body>` |

::: warning Important
Keep the `<title>Komari Monitor</title>` and `A simple server monitor tool.` strings exact; otherwise custom title and description replacement will not take effect.
:::

### SPA Routing & Built-in Routes

Komari serves `dist/index.html` as the SPA fallback when a requested static file is not found, so themes can use client-side routers (React Router, Vue Router, History API, etc.).

However, `/admin` and `/terminal` are always handled by Komari's built-in UI and cannot be overridden by themes.

## Development Notes

### Guidelines

1. **Avoid route conflicts**: Do not use `/admin` or `/terminal` in theme routes.
2. **Separation of concerns**: Keep administrative actions in the built-in admin panel rather than duplicating them in public theme pages.
3. **Preserve attribution**: Keep the `Powered by Komari Monitor.` footer.

### `localStorage` Keys

The default theme uses the following `localStorage` keys for user preferences, which custom themes can reuse for consistency:

| Key | Type | Description |
| --- | --- | --- |
| `appearance` | `"light" \| "dark" \| "system"` | Light/dark theme mode |
| `language` | `string` | Preferred language code, e.g. `"zh-CN"` |

### Semantic `km-*` Class Hooks

The default theme exposes semantic `km-` prefixed classes as stable DOM hooks for custom head/body scripts and browser extensions:

| Category | Pattern | Examples |
| --- | --- | --- |
| Page root | `km-page-<route>` | `km-page-instance`, `km-page-admin-dashboard`, `km-page-admin-settings-general` |
| Layout container | `km-layout` / `km-main`, etc. | `km-layout`, `km-main`, `km-navbar`, `km-footer`, `km-admin-layout` |
| Shared component | `km-<component>` | `km-node-card`, `km-node-display`, `km-login-dialog`, `km-upload-dialog` |
| Page section | `km-<page>-<section>` | `km-instance-server-list`, `km-dashboard-card`, `km-plugins-toolbar` |
| UI primitive | `km-ui-<component>` | `km-ui-button`, `km-ui-input`, `km-ui-table`, `km-ui-checkbox` |

See [API Documentation](/en/dev/api) for public endpoints.
