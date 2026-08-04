# 插件可用的 RPC 接口

插件通过 `server.call(method, params...)` 调用系统的 JSON-RPC 2.0 方法（以管理员身份），
也可通过 `server.registerRPC` 注册自己的方法供前端和其他插件调用。

调用方式、参数编组与错误处理详见 [server 模块](./server-api#server-call)。各方法的
参数与返回结构的完整文档见 [RPC 接口](/dev/rpc)。

::: warning 权限
`server.call` 需要 `allowSystemRPC` 权限，且调用以**管理员身份**执行——可以调用
全部 `admin:*` 方法（包括 `admin:exec` 等敏感操作）。请只声明真正需要的能力。
:::

## 命名空间与可用方法

### common:（通用）

| 方法 | 说明 |
| --- | --- |
| `common:getNodes` | 获取节点信息（`{uuid}` 可选；返回单个 `Client` 或 `{[uuid]: Client}`） |
| `common:getNodesLatestStatus` | 获取节点最新状态（`{uuid}` / `{uuids}` 可选） |
| `common:getNodeRecentStatus` | 获取节点最近状态记录列表（`{uuid}`） |
| `common:getRecords` | 按时间范围查询历史记录（负载或 Ping，支持指标筛选与点数上限） |
| `common:getMe` | 当前登录用户信息 |
| `common:getPublicInfo` | 公开站点与运行配置 |
| `common:getVersion` | 服务端版本与构建哈希 |

### public:（公开）

| 方法 | 说明 |
| --- | --- |
| `public:getMe` | 当前用户（访客返回 Guest 占位） |
| `public:getNodesInformation` | 公开节点基本信息（未认证调用方不返回隐藏节点；无论是否认证，均过滤 IP、私有备注、版本和 Token） |
| `public:getPublicSettings` | 公开站点设置 |
| `public:getVersion` | 服务端版本 |
| `public:getClientRecentRecords` | 节点最近状态缓存 |
| `public:getRecordsByUUID` | 按相对时间窗口查询单节点负载记录 |
| `public:getPingRecords` | 按节点或任务查询 Ping 历史与统计 |
| `public:getPublicPingTasks` | 公开 Ping 任务 |
| `public:listMetricDefinitions` | 公开指标定义与保留策略 |
| `public:queryMetrics` | 查询指标时间序列（支持聚合、标签筛选、填充空桶） |
| `public:getPingMetricStats` | Ping 延迟/丢包/分位数统计 |
| `public:recordVisitorEvent` | 上报访客事件 |

### admin:（管理，完整列表）

| 方法 | 说明 |
| --- | --- |
| `admin:addClient` / `editClient` / `removeClient` / `getClient` / `listClients` / `getClientToken` / `orderClients` | 节点管理 |
| `admin:clearRecords` / `clearAllRecords` | 清空历史记录 |
| `admin:getTasks` / `getTaskById` / `getTasksByClientId` / `getSpecificTaskResult` / `getTaskResultsByTaskId` / `exec` | 远程执行任务 |
| `admin:addPingTask` / `deletePingTask` / `editPingTask` / `getAllPingTasks` / `orderPingTask` | Ping 任务 |
| `admin:addLoadNotification` / `deleteLoadNotification` / `editLoadNotification` / `getAllLoadNotifications` | 负载通知 |
| `admin:listOfflineNotifications` / `editOfflineNotification` / `enableOfflineNotification` / `disableOfflineNotification` | 离线通知 |
| `admin:listTrafficReportNotifications` / `editTrafficReportNotifications` / `enableTrafficReportNotifications` / `disableTrafficReportNotifications` | 流量报告 |
| `admin:sendNotification` | 发送通知（事件消息，可指定客户端/模板） |
| `admin:getSessions` / `deleteSession` / `deleteAllSessions` | 登录会话 |
| `admin:getSettings` / `editSettings` | 系统设置 |
| `admin:getClipboard` / `listClipboard` / `createClipboard` / `updateClipboard` / `deleteClipboard` / `batchDeleteClipboard` | 剪贴板 |
| `admin:getMessageSenderProvider` / `setMessageSenderProvider` | 通知发送器配置 |
| `admin:getOidcProvider` / `setOidcProvider` | OIDC 配置 |
| `admin:getLogs` | 分页审计日志 |
| `admin:testSendMessage` / `testGeoip` | 测试工具 |
| `admin:getXtermjsSettings` / `setXtermjsSettings` | 终端设置 |
| `admin:listMetricDefinitions` / `updateMetricDefinition` / `getMetricMigrationStatus` / `startMetricMigration` / `cancelMetricMigration` | 指标管理 |
| `admin:getDatabaseSize` / `vacuumDatabase` | 数据库维护 |
| `admin:listPlugins` / `setPluginEnabled` / `getPluginLogs` / `deletePlugin` / `getPluginConfiguration` / `setPluginConfiguration` | **插件管理** |

### client:（Agent）

| 方法 | 说明 |
| --- | --- |
| `client:getPingTasks` | 获取分配给客户端的 Ping 任务 |
| `client:uploadPingResult` | 上报 Ping 执行结果 |
| `client:taskResult` | 上报远程命令执行结果 |

### 插件注册的方法

任何插件通过 `server.registerRPC` 注册的方法（建议 `plugin:` 前缀命名）都可以通过
`server.call` 调用。`rpc.` 前缀为保留前缀，插件不能注册。

## 调用示例

```js
const server = require("server");

async function collect() {
  // 1. 获取全部节点基本信息
  const nodes = await server.call("common:getNodes");

  // 2. 获取在线状态
  const status = await server.call("common:getNodesLatestStatus");

  // 3. 创建 Ping 任务
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

## 错误处理

```js
try {
  await server.call("admin:getClient", { uuid: "not-exist" });
} catch (err) {
  console.log(err.code);    // 整数，JSON-RPC 错误码
  console.log(err.message); // 错误信息
  console.log(err.data);    // 附加数据（可选）
}
```

## 插件管理相关方法的补充说明

| 方法 | 参数 | 返回 | 说明 |
| --- | --- | --- | --- |
| `admin:listPlugins` | 无 | `Plugin[]` | 清单 + `{enabled, running, last_error}` |
| `admin:setPluginEnabled` | `{short, enabled, approved?}` | `null` 或 `{requires_approval: true}` | 批准流程见 [插件开发指南](./index#权限与批准) |
| `admin:getPluginLogs` | `{short}` | `{logs}` | 64 KiB 环形日志 |
| `admin:deletePlugin` | `{short}` | `null` | 未安装返回 404 错误 |
| `admin:getPluginConfiguration` | `{short}` | `{configuration, data}` | 声明项 + 合并后的保存值 |
| `admin:setPluginConfiguration` | `{short, data}` | `null` | 保存配置 |

此外还有 REST 端点（均需管理员）：

| 端点 | 说明 |
| --- | --- |
| `POST /api/admin/plugin/install` | 上传 ZIP（请求体为原始 ZIP 二进制） |
| `GET /api/admin/plugin/market/sources` | 市场源列表 |
| `POST/PUT/DELETE /api/admin/plugin/market/sources[/:id]` | 管理市场源 |
| `GET /api/admin/plugin/market/catalog` | 市场目录（`?refresh=true` 强制刷新） |
| `POST /api/admin/plugin/market/install` | 从市场安装（`{source_id, short}`） |
| `GET /api/plugin/:short/*filepath` | 公开插件页面静态文件（无需认证） |
| `GET /api/admin/plugin/:short/*filepath` | 管理插件页面静态文件 |
