# RPC Methods for Plugins

Plugins call the system's JSON-RPC 2.0 methods via `server.call(method, params...)`
(with admin authority), and can register their own methods via `server.registerRPC` so
the frontend and other plugins can call them.

For invocation semantics, argument marshalling, and error handling, see
[the server module](./server-api#server-call). For full parameter and return-structure
documentation of each method, see the [RPC documentation](/en/dev/rpc).

::: warning Permission
`server.call` requires the `allowSystemRPC` permission, and invocations run with
**admin authority** — every `admin:*` method is callable, including sensitive ones like
`admin:exec`. Only declare capabilities you actually need.
:::

## Namespaces & Methods

### common: (general)

| Method | Description |
| --- | --- |
| `common:getNodes` | Get node info (`{uuid}` optional; returns a single `Client` or `{[uuid]: Client}`) |
| `common:getNodesLatestStatus` | Get latest node status (`{uuid}` / `{uuids}` optional) |
| `common:getNodeRecentStatus` | Get a node's recent status records (`{uuid}`) |
| `common:getRecords` | Query historical records by time range (load or ping; metric filtering and point caps) |
| `common:getMe` | Current logged-in user |
| `common:getPublicInfo` | Public site & runtime configuration |
| `common:getVersion` | Server version and build hash |

### public: (public)

| Method | Description |
| --- | --- |
| `public:getMe` | Current user (Guest placeholder for visitors) |
| `public:getNodesInformation` | Public node basic info (hidden nodes are excluded for unauthenticated callers; IPs, private remarks, versions, and tokens are filtered for all callers) |
| `public:getPublicSettings` | Public site settings |
| `public:getVersion` | Server version |
| `public:getClientRecentRecords` | Node's recent status cache |
| `public:getRecordsByUUID` | Load records for one node over a relative window |
| `public:getPingRecords` | Ping history & statistics by node or task |
| `public:getPublicPingTasks` | Public ping tasks |
| `public:listMetricDefinitions` | Public metric definitions & retention policies |
| `public:queryMetrics` | Query metric time series (aggregation, tag filtering, empty-bucket filling) |
| `public:getPingMetricStats` | Ping latency/loss/percentile statistics |
| `public:recordVisitorEvent` | Report a visitor event |

### admin: (administration, full list)

| Method | Description |
| --- | --- |
| `admin:addClient` / `editClient` / `removeClient` / `getClient` / `listClients` / `getClientToken` / `orderClients` | Node management |
| `admin:clearRecords` / `clearAllRecords` | Clear history records |
| `admin:getTasks` / `getTaskById` / `getTasksByClientId` / `getSpecificTaskResult` / `getTaskResultsByTaskId` / `exec` | Remote exec tasks |
| `admin:addPingTask` / `deletePingTask` / `editPingTask` / `getAllPingTasks` / `orderPingTask` | Ping tasks |
| `admin:addLoadNotification` / `deleteLoadNotification` / `editLoadNotification` / `getAllLoadNotifications` | Load notifications |
| `admin:listOfflineNotifications` / `editOfflineNotification` / `enableOfflineNotification` / `disableOfflineNotification` | Offline notifications |
| `admin:listTrafficReportNotifications` / `editTrafficReportNotifications` / `enableTrafficReportNotifications` / `disableTrafficReportNotifications` | Traffic reports |
| `admin:sendNotification` | Send a notification (event message; clients/template supported) |
| `admin:getSessions` / `deleteSession` / `deleteAllSessions` | Login sessions |
| `admin:getSettings` / `editSettings` | System settings |
| `admin:getClipboard` / `listClipboard` / `createClipboard` / `updateClipboard` / `deleteClipboard` / `batchDeleteClipboard` | Clipboard |
| `admin:getMessageSenderProvider` / `setMessageSenderProvider` | Notification sender config |
| `admin:getOidcProvider` / `setOidcProvider` | OIDC config |
| `admin:getLogs` | Paged audit logs |
| `admin:testSendMessage` / `testGeoip` | Test utilities |
| `admin:getXtermjsSettings` / `setXtermjsSettings` | Terminal settings |
| `admin:listMetricDefinitions` / `updateMetricDefinition` / `getMetricMigrationStatus` / `startMetricMigration` / `cancelMetricMigration` | Metric management |
| `admin:getDatabaseSize` / `vacuumDatabase` | Database maintenance |
| `admin:dbQuery` / `dbExec` / `dbTables` | Query, execute SQL, or list tables in the main/metrics database (`{database?: "main" \| "metrics"}`) |
| `admin:listPlugins` / `setPluginEnabled` / `getPluginLogs` / `deletePlugin` / `getPluginConfiguration` / `setPluginConfiguration` | **Plugin management** |

### client: (agents)

| Method | Description |
| --- | --- |
| `client:getPingTasks` | Get ping tasks assigned to the client |
| `client:uploadPingResult` | Report a ping execution result |
| `client:taskResult` | Report a remote exec result |

### Methods registered by plugins

Any method registered by another plugin via `server.registerRPC` (preferably with the
`plugin:` prefix) can be called through `server.call`. The `rpc.` prefix is reserved;
plugins cannot register it.

## Examples

```js
const server = require("server");

async function collect() {
  // 1. Get all node basic info
  const nodes = await server.call("common:getNodes");

  // 2. Get live status
  const status = await server.call("common:getNodesLatestStatus");

  // 3. Create a ping task
  await server.call("admin:addPingTask", {
    name: "google",
    target: "8.8.8.8",
    type: "icmp",
    interval: 30,
    clients: [Object.keys(nodes)[0]],
    default_on: true
  });

  return { online: Object.keys(status).length };
}
```

## Error handling

```js
try {
  await server.call("admin:getClient", { uuid: "not-exist" });
} catch (err) {
  console.log(err.code);    // integer JSON-RPC error code
  console.log(err.message); // error message
  console.log(err.data);    // extra data (optional)
}
```

## Plugin management methods in detail

| Method | Params | Returns | Notes |
| --- | --- | --- | --- |
| `admin:listPlugins` | none | `Plugin[]` | manifest + `{enabled, running, last_error}` |
| `admin:setPluginEnabled` | `{short, enabled, approved?}` | `null` or `{requires_approval: true}` | approval flow: see [Plugin Development Guide](./index#permissions--approval) |
| `admin:getPluginLogs` | `{short}` | `{logs}` | 64 KiB ring buffer |
| `admin:deletePlugin` | `{short}` | `null` | 404 error if not installed |
| `admin:getPluginConfiguration` | `{short}` | `{configuration, data}` | declared items + merged saved values |
| `admin:setPluginConfiguration` | `{short, data}` | `null` | save configuration |

REST endpoints (admin only):

| Endpoint | Description |
| --- | --- |
| `POST /api/admin/plugin/install` | Upload a ZIP (raw ZIP binary body) |
| `GET /api/admin/plugin/market/sources` | Market source list |
| `POST/PUT/DELETE /api/admin/plugin/market/sources[/:id]` | Manage market sources |
| `GET /api/admin/plugin/market/catalog` | Market catalog (`?refresh=true` forces refresh) |
| `POST /api/admin/plugin/market/install` | Install from market (`{source_id, short}`) |
| `GET /api/plugin/:short/*filepath` | Public plugin page static files (no auth) |
| `GET /api/admin/plugin/:short/*filepath` | Admin plugin page static files |
