# Compatibility Maintenance Timeline

This page records Komari's planned compatibility maintenance for historical database layouts, theme fields, Agent protocols, and HTTP endpoints. Unless release notes state otherwise, items listed for a version will no longer be available in that release.

## Timeline

### 1.3.0

Planned removal of database migrations for:

- `0.x` `client_infos` and legacy `load_notifications` table layouts.
- `1.0.x` OIDC and message sender configuration.
- `1.1.x` `configs` to `config_items` conversion and legacy Ping Task `all_clients` conversion.
- Legacy monitoring-record tables and timestamp formats.

Planned removal of legacy theme fields from `/api/public`:

- `record_enabled`
- `record_preserve_time`
- `ping_record_preserve_time`

### 1.4.0

Planned removal of the Agent v1 protocol and its endpoints:

- `GET /api/clients/report`
- `POST /api/clients/report`
- `POST /api/clients/uploadBasicInfo`
- `POST /api/clients/task/result`

Planned removal of the following legacy endpoints:

- `/api/records/*`
- `/api/clients`
- `/api/recent/:uuid`

The Agent v1 Ping payload will also be removed. Agents should migrate to protocol/v2 and `/api/clients/v2/rpc`.
