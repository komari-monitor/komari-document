# Notification Templates

Komari notification templates let you customize how notification events are rendered and sent.

## Use Cases

- Change message text for offline, recovery, load, and traffic events.
- Format messages for providers such as Telegram, email, webhook, Bark, and ServerChan.
- Add contextual data from the event payload.

## Template Development Notes

- Keep secrets outside public templates.
- Validate that every branch returns a readable message.
- Test templates with non-production notifications before enabling them broadly.
- Avoid sending overly large payloads to providers with strict message limits.

The full Chinese reference contains complete JavaScript examples and event payload notes: [Notification templates](/faq/notification-template).
