# 清单文件参考（komari-plugin.json）

`komari-plugin.json` 必须位于插件 ZIP 的**根目录**。它声明插件的元信息、权限、
配置项和注入页面。服务端在安装、加载和启用时都会校验该文件。

## 完整字段

| 字段 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `name` | string \| i18n 对象 | 是 | — | 插件名称。为空字符串或空映射时校验失败 |
| `short` | string | 是 | — | 插件唯一短名，同时用作 `data/plugin/` 和 `data/plugin-data/`（长期存储）下的目录名。仅允许 `[A-Za-z0-9_-]`，不能是 `default` |
| `description` | string \| i18n 对象 | 否 | — | 插件描述 |
| `author` | string \| i18n 对象 | 否 | — | 作者 |
| `version` | string | 否 | — | 插件版本号（市场发布时必填） |
| `url` | string | 否 | — | 项目主页 / 仓库地址 |
| `icon` | string | 否 | — | 图标路径，必须是插件目录内的相对路径 |
| `komari` | string | 否 | `""` | 服务端版本约束，如 `>=1.0.0`（见下） |
| `entry` | string | 否 | `"script.js"` | 入口脚本，必须是插件目录内的相对路径 |
| `permissions` | object | 否 | 全为零值 | 能力声明，见下 |
| `configuration` | object | 否 | — | 配置项声明，与主题配置同构，见下 |
| `pages` | array | 否 | `[]` | 注入的管理页面，见下 |

::: tip 多语言（i18n）字段
`name`、`description`、`author` 以及页面 `title` 可以是普通字符串，也可以是
`{"zh_CN": "...", "en": "..."}` 形式的多语言对象。前端按当前语言解析，键的
`-`/`_` 写法互通（如 `zh-CN` 与 `zh_CN` 等价），精确匹配 → 规范化匹配 →
基础语言（`zh`）→ 语言族前缀 → 第一个值。
:::

## 版本约束 `komari`

约束当前运行的服务端版本，支持以下语法（可带可选前缀 `v`）：

| 写法 | 含义 |
| --- | --- |
| 空 | 兼容任意版本 |
| `1.0.0` 或 `=1.0.0` | 精确匹配 |
| `>=1.0.0` / `>1.0.0` | 最低版本 |
| `<=1.0.0` / `<1.0.0` | 最高版本 |

约束不满足时，安装会被拒绝，加载也会失败。市场目录中的 `komari` 字段必须与清单
**完全一致**。

## 权限 `permissions`

除 `node`、`maxHTTPBodyBytes`、`maxChildOutputBytes`、`timeout` 外，所有字段默认
为 `false`/`0`——**不声明即不授予**。

| 字段 | 类型 | 默认值 | 说明 | 触发批准 |
| --- | --- | --- | --- | --- |
| `node` | boolean | `false` | 启用 Node.js 兼容模块（events/path/os/process/fs/child_process/net/http/stream/crypto 及 `Buffer`、`process`、`global` 全局变量） | 否 |
| `allowSystemRPC` | boolean | `false` | 允许 `server.call` 以管理员身份调用任意系统 RPC | **是** |
| `allowRoutes` | boolean | `false` | 允许 `server.route` 在宿主引擎上注册 HTTP 路由 | **是** |
| `allowHooks` | boolean | `false` | 允许 `server.hook` 修改 HTTP 请求/响应，以及 ws 类钩子（wsConnect/wsMessage/wsSend/wsClose）拦截 WebSocket 连接与帧 | **是** |
| `allowHTMLInject` | boolean | `false` | 允许 `server.injectHTML` 向每个 HTML 页面嵌入 CSS/JS | **是** |
| `allowExec` | boolean | `false` | 允许 `child_process` 执行子进程 | **是** |
| `allowListen` | boolean | `false` | 允许 `net`/`http` Server 监听本地端口 | **是** |
| `allowAllFileAccess` | boolean | `false` | 允许访问插件目录之外的文件 | **是** |
| `maxHTTPBodyBytes` | int | 32 MiB | fetch 响应体与请求体缓冲上限 | 否 |
| `maxChildOutputBytes` | int | 1 MiB | 子进程 stdout/stderr 输出上限 | 否 |
| `timeout` | int | 30 | 单次执行超时（秒） | 否 |

## 配置项 `configuration`

与主题配置同构，支持 `type: "managed"` 的声明式配置：管理界面自动生成表单，
插件通过 `server.getConfig()` 读取。

```json
{
  "configuration": {
    "type": "managed",
    "data": [
      { "key": "greeting", "name": "Greeting", "type": "string", "default": "Hello" },
      { "key": "count", "name": "Count", "type": "number" },
      { "key": "enabled", "name": "Enabled", "type": "switch", "default": true },
      { "key": "mode", "name": "Mode", "type": "select", "options": "json,text" },
      { "key": "note", "name": "Note", "type": "string", "help": "使用说明" }
    ]
  }
}
```

### 配置项字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `key` | string | 是 | 配置键名 |
| `name` | string \| i18n | 是 | 表单标签 |
| `type` | string | 是 | `string` / `number` / `select` / `switch` / `title` / `richtext` |
| `options` | string | 否 | `select` 类型的选项，逗号分隔 |
| `default` | any | 否 | 默认值 |
| `required` | boolean | 否 | 是否必填 |
| `help` | string \| i18n | 否 | 帮助说明 |

### 默认值合并规则

`server.getConfig()` 返回「保存值 + 清单默认值」的合并结果，已保存的值优先。未保存的键
使用以下规则补齐默认值：

| 类型 | 无默认值时的兜底 |
| --- | --- |
| `select` | 第一个选项 |
| `number` | `0` |
| `switch` | `false` |
| 其他 | `""` |

配置保存在主库 `plugin_configurations` 表中。

## 页面 `pages`

插件可以向管理界面注入页面（显示在侧边栏插件分组下）。

```json
{
  "pages": [
    { "file": "admin.html", "title": "管理面板", "icon": "icon.png" },
    { "type": "redirect", "title": "跳转到节点列表", "url": "/" },
    { "file": "pub.html", "title": "公开页面", "visibility": "public" }
  ]
}
```

### 页面字段

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | string | iframe 必填 | 插件目录内的相对路径，渲染为 iframe |
| `title` | string \| i18n | 是 | 页面标题 |
| `icon` | string | 否 | 图标，插件目录内的相对路径 |
| `type` | `"iframe"` \| `"redirect"` | 否 | 默认 `iframe` |
| `url` | string | redirect 必填 | 站内路径（见下） |
| `visibility` | `"admin"` \| `"public"` | 否 | 默认 `admin` |

### 访问地址

| visibility | type | 访问路径 | 认证 |
| --- | --- | --- | --- |
| `admin` | `iframe` | `/api/admin/plugin/<short>/<file>` | 需要管理员登录 |
| `public` | `iframe` | `/api/plugin/<short>/<file>` | 无需认证（公开） |
| `redirect` | 任意 | 跳转到站内路径 | — |

- `public` 页面要求插件处于**启用**状态，且只能访问已声明公共页面的目录内的文件；
  页面以沙箱 iframe 渲染（`sandbox="allow-forms allow-modals allow-popups allow-same-origin allow-scripts"`）。
- `redirect` 的 `url` 必须是同源站内路径：以 `/` 开头、不能是 `//` 开头、不能包含
  反斜杠、URL scheme（如 `http:`）或 `..` 段。

## 完整示例

```json
{
  "name": {
    "zh_CN": "示例插件",
    "en": "Example Plugin"
  },
  "short": "example",
  "description": {
    "zh_CN": "演示插件开发",
    "en": "Demonstrates plugin development"
  },
  "author": "komari",
  "version": "1.0.0",
  "url": "https://github.com/your-name/komari-example",
  "icon": "assets/icon.png",
  "komari": ">=1.0.0",
  "entry": "script.js",
  "permissions": {
    "node": true,
    "timeout": 10,
    "maxHTTPBodyBytes": 67108864,
    "allowSystemRPC": true,
    "allowRoutes": true
  },
  "configuration": {
    "type": "managed",
    "data": [
      {
        "key": "interval",
        "name": { "zh_CN": "刷新间隔", "en": "Refresh Interval" },
        "type": "number",
        "default": 5,
        "required": true
      }
    ]
  },
  "pages": [
    {
      "file": "admin.html",
      "title": { "zh_CN": "示例页面", "en": "Example Page" }
    }
  ]
}
```

## 安装校验规则（ZIP 包）

| 规则 | 限制 |
| --- | --- |
| `komari-plugin.json` 位置 | 必须位于 ZIP 根目录 |
| 文件数量 | ≤ 10,000 |
| 单文件大小 | ≤ 128 MiB |
| 解压总量 | ≤ 512 MiB |
| 清单大小 | ≤ 1 MiB |
| 路径安全 | 含 `../`、绝对路径等穿越条目的包**整体拒绝** |
| 文件存在性 | 安装时校验 `entry` 与所有页面文件存在 |
