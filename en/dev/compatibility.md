# Compatibility Maintenance Timeline

This page tracks the compatibility status of historical database layouts, theme fields, Agent protocols, and HTTP endpoints in Komari.

## Removed Compatibility Items

### `/api/mjpeg_live` and `load_notifications`

- The `/api/mjpeg_live` endpoint has been removed from the server.
- Legacy `load_notifications` table migrations and endpoints have been removed.

### Agent v2-only

The Agent v1 protocol has been officially retired. The following endpoints have been removed:

- `GET /api/clients/report`
- `POST /api/clients/report`
- `POST /api/clients/uploadBasicInfo`
- `POST /api/clients/task/result`

Agents must use `protocol/v2` and `/api/clients/v2/rpc` for `agent.report`, `agent.basicInfo`, `agent.pingResult`, and `agent.taskResult`.

## Remaining Compatibility Items Pending Removal

The following legacy compatibility items are still retained for transition and may be removed in a future cleanup release:

### Legacy Database Migrations

- `0.x` `client_infos` table layout migration.
- `1.0.x` OIDC and message sender configuration migrations.
- `1.1.x` `configs` to `config_items` conversion and legacy Ping Task `all_clients` conversion.
- Legacy monitoring-record tables and timestamp format migrations.

### Legacy `/api/public` Theme Fields

- `record_enabled`
- `record_preserve_time`
- `ping_record_preserve_time`

### Legacy Endpoints Pending Separate Cleanup

- `/api/records/*`
- `/api/clients`
- `/api/recent/:uuid`
