# RPC

Komari contains internal RPC helpers used by the web dashboard and server modules.

## What This Covers

- JSON-RPC transport.
- Public and admin RPC registration.
- Request and response conventions.
- Theme and settings fields exposed through RPC surfaces.

## Related Pages

- [API](/en/dev/api)
- [Agent Development](/en/dev/agent)
- [Theme Development](/en/dev/theme)

The full current reference is available in Chinese: [RPC interface](/dev/rpc).

## Database Administration

The following `/api/rpc2` methods are in the `admin` namespace and use the existing
`admin:*` ACL. `database` is `"main"` by default and may also be `"metrics"`.

### admin:dbQuery

Parameters: `{ database?: "main" | "metrics", sql: string, args?: any[], limit?: number }`.
`limit` defaults to `1000` and must be between `1` and `10000`.

Returns `{ database, driver, columns, rows, row_count, truncated }`. `rows` is an
array of arrays in `columns` order; the response is truncated when more than `limit`
rows are available. `NULL` becomes `null`, byte slices become strings, and Go times
become RFC3339Nano strings.

```json
{"jsonrpc":"2.0","id":1,"method":"admin:dbQuery","params":{"database":"main","sql":"SELECT uuid, name FROM clients WHERE name LIKE ?","args":["web%"],"limit":100}}
```

### admin:dbExec

Parameters: `{ database?: "main" | "metrics", sql: string, args?: any[] }`.

Returns `{ database, driver, rows_affected, last_insert_id }`; `last_insert_id` is
`null` when the active driver does not provide one. The server records a `warn` audit
event for every call without including the SQL text.

```json
{"jsonrpc":"2.0","id":2,"method":"admin:dbExec","params":{"database":"metrics","sql":"DELETE FROM metric_points WHERE timestamp_milli < ?","args":[1711929600000]}}
```

### admin:dbTables

Parameters: `{ database?: "main" | "metrics" }`.

Returns `{ database, driver, tables }`, with `tables` sorted in ascending order.

```json
{"jsonrpc":"2.0","id":3,"method":"admin:dbTables","params":{"database":"metrics"}}
```

Invalid database names, empty SQL, and out-of-range limits return `InvalidParams`.
Database execution failures return `InternalError` with the underlying error message.
