# API

This page is the English entry point for Komari API documentation.

## Public API

The public API exposes site-level information and theme-facing data. Theme developers commonly use it to read:

- Site name and description.
- Current theme.
- Public theme settings.
- Node and status data exposed by the server.

## Agent API

Agents use authenticated endpoints with a node token. See [Agent Development](/en/dev/agent) for protocol details, WebSocket usage, JSON-RPC v2, and POST fallback behavior.

## Admin API

Admin APIs require authentication and are intended for the dashboard and management workflows.

## Full Reference

The complete API reference is currently maintained in Chinese and includes detailed endpoint tables and payload examples: [API reference](/dev/api).
