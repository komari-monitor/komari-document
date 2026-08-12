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

### Managed Configuration

Field tables, type meanings, i18n text, default value merge rules, and selector
storage/output rules are shared with plugins. See [Managed Configuration](./managed-config).

## Public API

Theme pages can use public Komari APIs to read site settings, node status, and theme settings. See [API](/en/dev/api) for entry points.

The theme admin page saves through `POST /api/admin/theme/settings?theme=<short>` and
exposes the values through `data.theme_settings` in `GET /api/public`:

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
defaults and deleted node and Ping task IDs are omitted from the `theme_settings` output.

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
