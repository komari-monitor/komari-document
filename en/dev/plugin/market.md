# Publishing to the Plugin Market

The official Komari plugin market is an open-source catalog repository
(`plugin-market`) holding plugin metadata, download URLs, and SHA-256 checksums.
**Plugin packages remain hosted by their authors**; the market handles the catalog,
validation, and distribution index.

The plugin market is built into the server; the default source is the official Komari
catalog. The server supports multiple configurable market sources (REST endpoints:
see [RPC Methods - Plugin management](./rpc#plugin-management-methods-in-detail)).

## Managing market sources

On the **Market - Plugin Market** page in the admin panel you can manage JSON catalog
sources, exactly like the theme market:

- **Add a source**: enter a source name and a catalog URL (for example
  `https://raw.githubusercontent.com/owner/repo/main/v1.json`); it is enabled by default.
- **Edit a source**: change its name, URL, or enabled state.
- **Enable / disable**: disabled sources are skipped when loading catalogs but their
  configuration is kept.
- **Delete a source**: the source is removed; the official source can be re-added later
  with the same URL.

Source URLs must be HTTP(S) and must not contain userinfo (`user:pass@`); the server
rejects download hosts pointing to private or local IPs. Catalogs are fetched per source
concurrently and cached on the server for 10 minutes; the refresh button (or
`?refresh=true`) forces a re-fetch. A failing source shows an error at the top of the
page without affecting the other sources.

Each source record has the fields `id`, `name`, `url`, `enabled` and is stored in the
server configuration key `plugin_market_sources`.

## Catalog entry (v1.json)

Each installable plugin contains these fields:

```json
{
  "name": {
    "zh-CN": "Komari Test Plugin",
    "en": "Komari Test Plugin"
  },
  "short": "TestPlugin",
  "description": {
    "zh-CN": "A test plugin for Komari",
    "en": "A test plugin for Komari"
  },
  "version": "1.0.0",
  "author": "Your Name",
  "url": "https://github.com/your-name/komari-example",
  "download": "https://example.com/plugin.zip",
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "komari": ">=1.0.0"
}
```

| Field | Required | Description |
| --- | --- | --- |
| `name` | Yes | string or i18n object |
| `short` | Yes | unique plugin short name, `[A-Za-z0-9_-]`; entries sorted case-insensitively by `short`, no duplicates |
| `description` | No | string or i18n object |
| `version` | Yes | plugin version |
| `author` | Yes | string or i18n object |
| `url` | No | project homepage, HTTP(S) URL without userinfo (`user:pass@`) |
| `download` | paired with `sha256` | plugin ZIP download URL, absolute HTTP(S); may be omitted together with `sha256` for source-only entries |
| `sha256` | paired with `download` | lowercase SHA-256 of that exact ZIP (64 hex chars) |
| `komari` | No | server version constraint, **must exactly match `komari-plugin.json`** |

::: tip Install validation
When installing from the market, the server: downloads (cap 100 MiB) → verifies
SHA-256 → verifies the package manifest matches the catalog's `short` and `version` →
installs. Catalogs are cached on the server for 10 minutes.
:::

## Submitting a plugin

Choose the appropriate template on the
[plugin-market repository issues page](https://github.com/komari-monitor/plugin-market/issues/new/choose).
The submission is fully automated by GitHub Actions: after validation passes, an update
PR is created automatically.

::: warning Note
Fill in the fixed Issue Form fields as-is; do not rename or reorder field headings —
the Action reads them by name.
:::

### Option 1: Open-source GitHub plugin

Only required:

- GitHub repository URL (must be public)
- Confirmation that the latest Release ships a plugin package

The Action reads the repository's latest Release and finds the single valid plugin ZIP
among its assets (the package must contain a root-level `komari-plugin.json`).

### Option 2: Plugin hosted outside GitHub

Provide:

- Project URL (must not be GitHub-hosted)
- Package download URL (must not be GitHub-hosted)
- Plugin name, unique short name, version, description, and author
- Confirmation that the code is not malicious and the package has no auto-updates

## Validation rules (run automatically on submission)

| Category | Rule |
| --- | --- |
| URLs | credentials rejected; download hosts must not be private/internal IPs; GitHub URLs rejected for the external-hosted form |
| Package size | download ≤ 100 MiB, ≤ 10 redirects |
| Package safety | no absolute/traversal/backslash/NUL paths, no symlinks; ≤ 10,000 files, ≤ 128 MiB per file, ≤ 512 MiB extracted |
| Manifest | exactly one root `komari-plugin.json` (≤ 1 MiB); valid `name/short/version/author` |
| Consistency | `short` and `version` from the external-hosted form must match the in-package manifest |
| Catalog | SHA-256 computed, sorted case-insensitively by `short`, `updated_at` updated |

On failure the Action comments the reason on the issue and closes it; transient
failures (403/408/425/429/5xx, DNS) leave the issue open for retry.

## Release auto-updates

For catalog entries backed by GitHub repositories, an update workflow runs every 6
hours:

1. Builds the download URL from the repository URL + latest Release tag + current asset
   name (GitHub API asset URL as fallback).
2. Re-validates the in-package manifest, `short`, `version`, and SHA-256.
3. Only after all checks pass does it create an update PR.

So, for GitHub-hosted plugins, **just publish a new Release (with the plugin ZIP asset)
and the market follows automatically** — no manual catalog edits needed.

## Local quick check for catalog ordering

```text
node scripts/check-catalog-order.mjs
```
