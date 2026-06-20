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

## Configuration

Komari server `1.0.5` and later supports managed theme configuration. A theme can expose form fields in the admin panel and read the saved values from `/api/public` through `theme_settings`.

Supported configuration modes include:

- `managed`: Komari renders a settings form from the schema.
- `raw`: the theme provides its own raw configuration page.
- `redirect`: the admin menu redirects to a theme-provided page.

## Public API

Theme pages can use public Komari APIs to read site settings, node status, and theme settings. See [API](/en/dev/api) for entry points.

## Important Notes

- The main page should provide an `index.html`.
- Respect the placeholders expected by Komari for title, description, custom head, and custom body injection.
- Treat raw HTML configuration pages as trusted code only.
- Avoid hard-coding language strings when the theme needs internationalization.

The Chinese reference is more complete and includes schema examples: [Theme development](/dev/theme).
