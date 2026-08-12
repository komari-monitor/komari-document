# Theme Development

Komari themes are packaged web assets plus a `komari-theme.json` metadata file.

## Basic Package Shape

```text
theme.zip
├── komari-theme.json
└── dist/
    ├── index.html
    └── assets/
```

## Metadata

Every theme must include `komari-theme.json`. It declares the theme name, short identifier, description, version, author, and optional configuration.

`name`, `description`, and `author` each accept either a plain string or an i18n object. The admin UI resolves the current locale, then its base language, then the first available value.

```json
{
  "name": { "zh-CN": "示例主题", "en": "Example Theme" },
  "description": { "zh-CN": "用于演示", "en": "For demonstration" },
  "author": "Example Author"
}
```

## Configuration

Komari server `1.0.5` and later supports managed theme configuration. A theme can expose form fields in the admin panel and read the saved values from `/api/public` through `theme_settings`.

Supported configuration modes include:

- `managed`: Komari renders a settings form from the schema.
- `raw`: the theme provides its own raw configuration page.
- `redirect`: the admin menu redirects to a theme-provided page.

### Managed Field Types

Managed configuration supports `string`, `number`, `select`, `switch`, `richtext`,
`nodes`, `pingtasks`, `title`, and `textbox`.

- `title` starts a settings group and its navigation tab; it has no `key`.
- `textbox` renders its `name` as static HTML. It has no saved value or navigation tab,
  so only install themes you trust.
- `nodes` opens the shared node selector. Database storage is a string containing a JSON
  array of node UUIDs, such as `"[\"node-a\",\"node-b\"]"`; `/api/public` returns `string[]`.
  Selected names are shown below the field, comma-separated, capped at 50 characters with
  an ellipsis.
- `pingtasks` opens the Ping task selector. Database storage is a string containing a JSON
  array of numeric task IDs, such as `"[1,2]"`; `/api/public` returns `number[]`. Selected
  names are shown below the field with the same 50-character truncation.

When a selector has no declared default, its stored default is the string `"[]"` and its
public API value is `[]`. `number` defaults to `0`, `switch` defaults to `false`, and other
value fields default to `""`. Deleted nodes and Ping tasks are omitted from `/api/public`.

```json
{
  "configuration": {
    "type": "managed",
    "data": [
      { "name": "Display", "type": "title" },
      { "name": "<strong>Choose the visible data.</strong>", "type": "textbox" },
      { "key": "visible_nodes", "name": "Visible Nodes", "type": "nodes", "default": "[]" },
      { "key": "visible_tasks", "name": "Visible Ping Tasks", "type": "pingtasks", "default": "[]" }
    ]
  }
}
```

## Public API

Theme pages can use public Komari APIs to read site settings, node status, and theme settings. See [API](/en/dev/api) for entry points.

### Selector Storage and Output

The theme admin page saves through `POST /api/admin/theme/settings?theme=<short>`.
`nodes` and `pingtasks` are JSON-array text strings in the request:

```json
{
  "headline": "Komari configuration demo",
  "selected_nodes": "[\"8832553d-a03f-4312-af8b-c5d9ed959c93\",\"76d47ce1-bb17-4f03-adf5-c9a795dc1fe2\"]",
  "selected_ping_tasks": "[8,7]"
}
```

The JSON text stored in `ThemeConfiguration.Data` is the same as the request: selector
values are always **strings** containing JSON arrays. Other fields keep their normal JSON
types:

```json
{
  "headline": "Komari configuration demo",
  "selected_nodes": "[\"8832553d-a03f-4312-af8b-c5d9ed959c93\",\"76d47ce1-bb17-4f03-adf5-c9a795dc1fe2\"]",
  "selected_ping_tasks": "[8,7]"
}
```

`GET /api/public` uses the standard response envelope. Theme code reads
`data.theme_settings`; its selector values are typed arrays rather than storage strings:

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

For installed, non-`default` managed themes, missing values are filled from manifest
defaults; a selector without a declared default returns `[]`. Deleted node and Ping task
IDs remain in storage but are omitted from the `theme_settings` output.

## Theme Market and Releases

Komari's built-in theme market uses the catalog in [komari-monitor/theme-market](https://github.com/komari-monitor/theme-market) by default. Administrators can search, install, update, and add JSON catalog sources from **Market - Theme Market**.

Publish an installable ZIP in a GitHub Release. The ZIP must contain `komari-theme.json` at its root together with the built static assets; source archives are not installable theme packages.

Catalog fields `name`, `description`, and `author` accept either a string or an i18n object:

```json
{
  "name": { "zh-CN": "示例主题", "en": "Example Theme" },
  "description": { "zh-CN": "用于演示", "en": "For demonstration" },
  "author": "Example Author"
}
```

The market resolves the current locale, then its base language, then the first available value. Submit catalog additions through pull requests. CI enforces case-insensitive A-Z ordering and unique `short` values; the scheduled release monitor opens a pull request only after verifying the package manifest and SHA-256.

## Important Notes

- The main page should provide an `index.html`.
- Respect the placeholders expected by Komari for title, description, custom head, and custom body injection.
- Treat raw HTML configuration pages as trusted code only.
- Avoid hard-coding language strings when the theme needs internationalization.

The Chinese reference includes the complete package and configuration schema: [Theme development](/dev/theme).
