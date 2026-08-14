# Managed Configuration

Themes and plugins share the same declarative `managed` configuration: declare
`type: "managed"` and a `data` array of configuration items under `configuration`,
and the admin UI renders a form automatically. Storage and output rules are shared.

- Themes read saved values from `data.theme_settings` in `GET /api/public`.
  See [Theme Development](./theme).
- Plugins read saved values with `await server.getConfig()`; admins can use
  `admin:getPluginConfiguration`. See [Plugin Development](./plugin/index).

## Shape

```json
{
  "type": "managed",
  "name": "Settings panel title",
  "icon": "/themes/example/icon.svg",
  "data": [
    { "type": "title", "name": "Group" },
    { "key": "greeting", "name": "Greeting", "type": "string", "default": "Hello" }
  ]
}
```

`name` and `icon` are only used by the admin panel; `data` is the item array.

## Item Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `key` | string | Yes, except `title` / `textbox` | Unique configuration key |
| `name` | string \| i18n | Yes | Form label; for `textbox`, this is rendered as HTML |
| `type` | string | Yes | See field types below |
| `options` | string | No | Options for `select`, comma-separated |
| `default` | any | No | Default value |
| `required` | boolean | No | Whether the field is required |
| `help` | string \| i18n | No | Help text |

## Field Types

- `title`: group heading used for settings-page navigation; no `key` or `default`.
- `textbox`: static HTML block with no stored value or navigation tab; install only
  trusted sources.
- `string`: text input.
- `number`: number input.
- `select`: dropdown; `options` is required.
- `switch`: boolean switch.
- `richtext`: long text input for HTML fragments or longer values.
- `nodes`: node multi-select opened by a "Select nodes" button.
- `pingtasks`: Ping task multi-select opened by a "Select Ping tasks" button.

After selecting, both selector types show the selected names below the field,
comma-separated, capped at 50 characters with an ellipsis.

## i18n Text

`configuration.name`, item `name`, and `help` accept either a string or an i18n object:

```json
{
  "name": {
    "zh-CN": "背景图片 URL",
    "en": "Background Image URL"
  }
}
```

The frontend resolves values in this order: exact match → normalized match
(`-` / `_` are interchangeable, e.g. `zh-CN` equals `zh_CN`) → base language
(`zh`) → language family prefix → first value.

## Default Value Merge Rules

Saved values take precedence. Unsaved keys are filled with these fallbacks:

| Type | Fallback without default |
| --- | --- |
| `select` | first option |
| `number` | `0` |
| `switch` | `false` |
| `nodes` / `pingtasks` | stored as `"[]"`, returned as `[]` |
| others | `""` |

## Selector Storage and Output

`nodes` and `pingtasks` are always JSON-array text strings in storage. The server
decodes them to typed arrays on read and filters deleted nodes and Ping tasks:

```json
{
  "selected_nodes": "[\"uuid-a\",\"uuid-b\"]",
  "selected_ping_tasks": "[1,2]"
}
```

The corresponding output is:

```json
{
  "selected_nodes": ["uuid-a", "uuid-b"],
  "selected_ping_tasks": [1, 2]
}
```

The theme admin page saves through `POST /api/admin/theme/settings?theme=<short>`;
the plugin admin page saves through `admin:setPluginConfiguration`. Selector fields
stay as JSON strings in requests and are converted to arrays only when output.
