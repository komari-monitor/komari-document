# Notification Templates

Komari notification templates let you customize how notification messages are rendered before being passed to built-in notification channels (`webhook` and `Javascript`) or plugin-registered notification channels.

## Template Variables

Wrap variables in double curly braces (for example `{{event}}`):

| Variable | Type | Description | Example |
| --- | --- | --- | --- |
| `event` | string | Event name (`Offline`, `Online`, `Expire`, `Renew`, `Login`, `Traffic`, `Alert`, or `Test`) | `Offline` |
| `client` | string | Comma-separated client names (`clients` is an alias) | `web-01, db-01` |
| `time` | string | Event time formatted in the server's local timezone (`YYYY-MM-DD HH:MM:SS`) | `2024-01-15 22:30:25` |
| `message` | string | Detailed message or error description | `Server offline` |
| `emoji` | string | Emoji icon associated with the event | `🔴` |

## Example Template

```text
{{emoji}}{{emoji}}{{emoji}}
Event: {{event}}
Clients: {{client}}
Message: {{message}}
Time: {{time}}
```

## JavaScript Channel Contract

The built-in `Javascript` channel requires `sendMessage(message, title)` returning a boolean (or `Promise<boolean>`). You can also optionally implement `sendEvent(event)` to receive the raw event object (`{ event, clients, time, message, emoji }`, where `time` is serialized as UTC RFC3339 `...Z`).

## Notes

- Keep secrets outside public templates and test changes with **Send Test Message** before enabling broadly.
- Built-in channels are `webhook` and `Javascript`; additional channels can be added through JavaScript plugins (`server.registerNotificationChannel`).

The full Chinese reference includes complete Telegram, Bark, and Webhook JavaScript examples: [Notification templates](/faq/notification-template).
