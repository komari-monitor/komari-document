# 兼容性维护时间表

本页面记录 Komari 对历史数据库结构、主题字段、Agent 协议和 HTTP 接口的兼容性维护状态。

## 已移除的历史兼容项

### `/api/mjpeg_live` 与 `load_notifications`

- `/api/mjpeg_live` 端点已从服务端移除。
- 早期 `load_notifications` 负载通知表结构及对应迁移、接口已移除。

### Agent v1 协议退役

Agent v1 协议已正式退役，以下接口已移除：

- `GET /api/clients/report`
- `POST /api/clients/report`
- `POST /api/clients/uploadBasicInfo`
- `POST /api/clients/task/result`

Agent 现在必须使用 `protocol/v2` 和 `/api/clients/v2/rpc`，包括 `agent.report`、`agent.basicInfo`、`agent.pingResult` 和 `agent.taskResult`。

## 当前仍保留的待清理兼容项

以下历史兼容逻辑目前在代码库中仍处于过渡保留状态，后续大版本清理时将不再提供：

### 历史数据库迁移

- `0.x` 的 `client_infos` 表结构迁移。
- `1.0.x` 的 OIDC、消息发送器配置迁移。
- `1.1.x` 的 `configs` 到 `config_items` 配置迁移，以及旧 Ping Task `all_clients` 字段迁移。
- 旧监控记录表和旧时间格式的迁移支持。

### `/api/public` 旧主题保留字段

- `record_enabled`
- `record_preserve_time`
- `ping_record_preserve_time`

### 独立清理的旧 HTTP/WS 接口

- `/api/records/*`
- `/api/clients`
- `/api/recent/:uuid`
