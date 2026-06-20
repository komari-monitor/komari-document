# Upload via HTTP

Komari agents normally report through the official agent protocol. HTTP upload is useful for custom integrations and compatibility tools.

## When to Use It

- You are writing a custom agent.
- You need to bridge metrics from another monitoring tool.
- WebSocket is not available and your integration only needs one-way reporting.

## Basic Guidance

- Use the token assigned to the node.
- Send values in the formats expected by Komari.
- Avoid sending sensitive information in public status messages.
- Keep the report interval reasonable to avoid unnecessary load.

For detailed request and payload definitions, see [API](/en/dev/api) and [Agent Development](/en/dev/agent).
