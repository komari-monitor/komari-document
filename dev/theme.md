# Komari 主题开发指南

本指南将帮助开发者创建和定制 Komari 监控系统的主题。

## 主题结构

Komari 的主题文件是zip包格式，包含所有必要的文件和资源。

一个标准的 Komari 主题应该包含以下文件结构：

```
theme.zip
├── komari-theme.json    # 主题配置文件
├── dist/                # 构建输出目录
│   ├── index.html       # 主页面模板
│   └── ...              # 其他构建文件
└── ...                  # 其他文件
```

## 主题配置文件

### komari-theme.json

每个主题都必须包含一个 `komari-theme.json` 配置文件，用于定义主题的基本信息：

```json
{
  "name": "Komari Test Theme",
  "short": "TestTheme", // 唯一标识符，只能包含大小写字母、数字、下划线和连字符
  "description": "A test theme for Komari",
  "version": "1.0.0",
  "author": "Akizon77",
  "url": "https://github.com/komari-monitor/komari",
  "preview": "preview.png",
  "configuration": {} // >= 1.0.5 支持
}
```

#### 配置字段说明

| 字段            | 类型   | 必需       | 描述                                                                                     |
| --------------- | ------ | ---------- | ---------------------------------------------------------------------------------------- |
| `name`          | string | 是         | 主题的完整名称                                                                           |
| `short`         | string | 是         | 主题的唯一标识符，只能包含大小写字母、数字、下划线和连字符；不能为空，且不能为 `default` |
| `description`   | string | 否（建议） | 主题的描述信息；未填写时后台列表会显示为空                                               |
| `version`       | string | 否（建议） | 主题版本号，建议使用语义化版本；未填写时后台列表会显示为空                               |
| `author`        | string | 否（建议） | 主题作者；未填写时后台列表会显示为空                                                     |
| `url`           | string | 否         | 主题的项目地址或作者网站                                                                 |
| `preview`       | string | 否         | 预览图片的相对路径（相对于主题根目录）                                                   |
| `configuration` | object | 否         | 主题的动态配置（自 1.0.5 起支持）                                                        |

::: tip 提示
后端安装主题时只强制校验 `name` 和 `short`，但建议补全 `description`、`version`、`author` 等展示字段，避免管理后台出现空信息。
:::

## 动态配置（自 1.0.5 起支持）

自 `Komari` 服务器版本 1.0.5 起，主题可在 `komari-theme.json` 中声明 `configuration`，用于在管理员面板中为主题提供配置入口。未声明 `configuration.type` 的旧主题会按 `managed` 处理。

`configuration.data` 会根据 `configuration.type` 采用不同结构，不需要额外增加字段。

### configuration 类型

| `type`     | `configuration.data`                  | 后台行为                                                                                              |
| ---------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `managed`  | 配置项数组                            | 在后台生成主题设置表单，保存后的值会通过 [/api/public](./api#服务端公开属性) 的 `theme_settings` 公开 |
| `raw`      | 非空 HTML 字符串 (服务端>1.2.0可用)   | 在后台主内容区域通过 iframe 渲染该 HTML，适合主题自带的完整配置面板                                   |
| `redirect` | 站内相对路径字符串 (服务端>1.2.0可用) | 点击主题菜单时跳转到站点根目录下的该路径，适合跳转到主题提供的页面或已有站内路由                      |

`redirect` 的路径必须是站内相对路径，并以实际部署的站点根目录为基准，而不是以 `/admin` 为基准。站点根目录通常来自前端构建配置（例如 `VITE_BASE_URL`）：根目录为 `/` 时，`settings` 或 `../settings` 会导航到 `/settings`；如果前端以 `/abc/` 作为根目录构建，则同样的配置会导航到 `/abc/settings`。允许 query/hash；绝对 URL、`//` 开头、反斜杠以及路径中间的 `..` 上级目录跳转会被拒绝。

### managed 示例

```json
{
  "name": "Komari Web Mochi",
  "short": "Mochi",
  "description": "Another Komari Web Theme with enhanced mobile UI and beautiful design",
  "version": "1.0.3",
  "author": "Mochi DEV Team",
  "url": "https://github.com/svnmoe/komari-web-mochi",
  "preview": "preview.png",
  "configuration": {
    "type": "managed",
    "icon": "/themes/Mochi/dist/assets/os-debian.svg",
    "name": "微调Mochi",
    "data": [
      { "name": { "zh-CN": "基础设置", "en": "General" }, "type": "title" },
      {
        "key": "switch_A",
        "name": "测试开关",
        "type": "switch",
        "default": true,
        "help": "这是一个测试开关"
      },
      {
        "key": "select_A",
        "name": "测试选择",
        "type": "select",
        "options": "选项1,选项2,选项3",
        "default": "选项1",
        "help": "这是一个测试选择"
      },
      {
        "key": "number_A",
        "name": "测试输入框(数字)",
        "type": "number",
        "default": 10,
        "help": "这是一个测试输入框"
      },
      {
        "key": "string_A",
        "name": "测试输入框2",
        "type": "string",
        "required": true,
        "help": "这是一个测试输入框"
      },
      {
        "key": "footer_html",
        "name": "页脚 HTML",
        "type": "richtext",
        "default": "",
        "help": "支持较长 HTML 文本"
      }
    ]
  }
}
```

### raw 示例

```json
{
  "name": "Komari Raw Panel",
  "short": "RawPanel",
  "description": "Theme with a custom admin panel",
  "version": "1.0.0",
  "author": "Komari",
  "preview": "preview.png",
  "configuration": {
    "type": "raw",
    "icon": "Code",
    "name": {
      "zh-CN": "自定义面板",
      "en": "Custom Panel"
    },
    "data": "<!doctype html><html><body><h1>Hello Komari</h1></body></html>"
  }
}
```

### redirect 示例

```json
{
  "name": "Komari Redirect Panel",
  "short": "RedirectPanel",
  "description": "Theme with a redirected admin entry",
  "version": "1.0.0",
  "author": "Komari",
  "preview": "preview.png",
  "configuration": {
    "type": "redirect",
    "icon": "Settings",
    "name": {
      "zh-CN": "主题设置",
      "en": "Theme Settings"
    },
    "data": "settings/site"
  }
}
```

### 字段说明（configuration 根对象）

| 字段   | 类型             | 必需       | 描述                                                                                                                               |
| ------ | ---------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `type` | string           | 否（建议） | `managed` / `raw` / `redirect`；未填写时按 `managed` 处理                                                                          |
| `icon` | string           | 否         | 设置面板的图标 URL。支持绝对/相对路径。`/themes/{short}/` 指向主题根目录，可用：`/themes/Mochi/dist/...` `https://img.com/img.png` |
| `name` | string \| object | 否         | 在管理面板展示的配置标题；支持多语言对象；未填写可由系统回退到主题名                                                               |
| `data` | array \| string  | 按类型决定 | `managed` 为配置项数组，`raw` 为 HTML 字符串，`redirect` 为基于站点根目录的站内相对路径字符串                                      |

### managed 配置项（data 数组元素）

| 字段       | 适用类型   | 必需 | 描述                                                                     |
| ---------- | ---------- | ---- | ------------------------------------------------------------------------ |
| `type`     | 全部       | 是   | `string` / `number` / `select` / `switch` / `richtext` / `title`         |
| `name`     | 全部       | 是   | 显示名称，支持字符串或多语言对象；`title` 类型用于分组标题，不需要 `key` |
| `key`      | 除 `title` | 是   | 唯一键                                                                   |
| `required` | `string`   | 否   | 是否必填（默认 `false`）                                                 |
| `options`  | `select`   | 是   | 逗号分隔的选项：`"A,B,C"`                                                |
| `default`  | 除 `title` | 否   | 默认值                                                                   |
| `help`     | 除 `title` | 否   | 帮助提示文本，支持字符串或多语言对象                                     |

#### 类型含义

- `title`: 纯分隔/标题行，无交互，不应包含 `key`、`default`。
- `string`: 文本输入。
- `number`: 数字输入，前端需自行校验范围。
- `select`: 下拉选择，`options` 为必填。
- `switch`: 布尔开关，值为 `true/false`。
- `richtext`: 长文本输入，适合 HTML 片段或较长配置文本。

### 多语言文本

`configuration.name`、`managed` 配置项的 `name` 和 `help` 可以是字符串，也可以是多语言对象：

```json
{
  "name": {
    "zh-CN": "背景图片 URL",
    "en": "Background Image URL",
    "ja": "背景画像 URL"
  }
}
```

前端会优先匹配当前语言（如 `zh-CN`），然后匹配基础语言（如 `zh`），最后回退到对象中的第一个值。

### 默认值与公开数据

`/api/public` 返回的 `theme_settings` 会公开当前主题的动态配置值。对于已安装且非 `default` 的 `managed` 主题，后端会把已保存配置和 `komari-theme.json` 中声明的默认值合并：

- 已保存的值优先。
- `select` 未设置 `default` 时，会使用 `options` 中的第一个选项。
- `number` 未设置 `default` 时默认 `0`。
- `switch` 未设置 `default` 时默认 `false`。
- `string` / `richtext` 等其他类型未设置 `default` 时默认空字符串。

这些数据是公开可读的，请不要把密钥、Token、私密 URL 等敏感信息放入主题动态配置。

`raw` 和 `redirect` 不会生成 `theme_settings` 表单；它们只负责定义后台主题菜单点击后的呈现方式。`raw` 的 HTML 来自主题包本身，请只安装可信来源的主题。

使用 `redirect` 时请注意，`/admin` 和 `/terminal` 始终由系统内置界面接管。主题提供的页面应放在站点根目录下的其他路径，例如 `../settings`、`theme/settings` 等；不要把主题页面设计在 `/admin` 下。

### 空值与兼容性处理

请在前端处理以下情况：

1. `configuration` 字段不存在（< 1.0.5 的旧主题）。
2. `configuration.type` 不存在时按 `managed` 处理。
3. `managed` 的 `data` 为 `null`、空数组或不是数组。
4. `managed` 的某个配置项缺少 `key`（`title` 类型除外）或类型未知。
5. `raw` 的 `data` 不是非空字符串。
6. `redirect` 的 `data` 不是合法的站内相对路径。

### 图标与资源路径

当使用以 `/themes/{short}/` 开头的绝对路径时，服务器会将其映射到该主题的根目录。例如：

```
/themes/Mochi/dist/assets/os-debian.svg  ->  {主题包解压根}/dist/assets/os-debian.svg
```

因此在 `icon`、或自定义资源引用里可以安全使用该前缀，避免硬编码完整 URL。

### 版本提醒

只有 **服务器版本 1.0.5 及以上** 会解析并展示 `configuration`。服务端>1.2.0可用 `raw`、`redirect`。

---

> 提醒：若未声明 `configuration`，主题仍完全可用；此特性只是为增强可定制性。

## 主页面模板

### index.html 要求

主题的核心文件是 `dist/index.html`，它作为监控页面的模板。在创建此文件时，请注意以下重要要求：

#### 必需的占位符

为了确保自定义设置功能正常工作，`index.html` 中必须包含以下固定内容：

```html
<title>Komari Monitor</title>
<meta name="description" content="A simple server monitor tool." />
```

```html
<body>
  <!-- 页面内容 -->
</body>
```

#### 服务端替换规则

Komari 服务端会自动替换以下内容为用户配置的自定义内容：

| 原始内容                        | 替换为                         |
| ------------------------------- | ------------------------------ |
| `<title>Komari Monitor</title>` | 用户设置的自定义标题           |
| `A simple server monitor tool.` | 用户设置的自定义描述           |
| `</head>`                       | 用户自定义头部内容 + `</head>` |
| `</body>`                       | 用户自定义底部内容 + `</body>` |

::: warning 重要提醒
`title` 和 `description` 的内容必须严格按照上述格式设置，否则自定义标题和自定义描述功能将无法正常工作！
:::

#### 单页应用路由支持

Komari 支持单页应用（SPA）路由模式。当服务端找不到请求的文件时，会自动返回 `index.html` 文件，这使得主题可以实现客户端路由功能。

这意味着您可以在主题中使用以下技术：

- **Vue Router**: 用于 Vue.js 应用的路由
- **React Router**: 用于 React 应用的路由
- **原生 JavaScript**: 使用 `history.pushState()` 和 `popstate` 事件
- **其他前端路由库**: 如 Reach Router、Navigo 等

::: tip 提示
利用单页路由功能，您可以创建更丰富的用户体验，如设置页面、详细信息页面等，而无需重新加载整个页面。
:::

## 特殊页面说明

### 管理员后台页面

Komari 系统包含以下特殊页面，这些页面不受主题影响：

- **管理员后台** (`/admin`): 系统管理界面，使用内置的管理面板
- **终端页面** (`/terminal`): 终端访问界面，使用内置的终端界面

::: warning 重要提醒
主题不会替换 `/admin` 和 `/terminal` 的整体界面，这些页面使用系统内置的界面，确保管理功能的稳定性和一致性。若主题声明了 `configuration`，后台菜单中可以出现该主题的配置入口；其中 `raw` 会在后台主内容区域渲染主题提供的 HTML，`redirect` 会跳转到声明的站内路径。
:::

## 开发指南

### 注意事项

1. **路由冲突**: 主题中不应该使用 `/admin` 和 `/terminal` 路径
2. **功能分离**: 管理功能应该通过管理员后台实现，不建议在主题中重复实现
3. **权限控制**: 主题页面应该只展示监控信息，不应包含管理功能
4. 请务必保留页脚 `Powered by Komari Monitor.`。

### 本地存储字段

主题开发中，以下本地存储字段用于承载用户个性化配置。默认主题已采用相同字段，自定义主题可直接兼容复用：

| `appearance` | "light" \| "dark" \| "system" | 明暗主题设置 |
| `language` | string | 语言设置，例如 "zh-CN" |

#### 实现建议

1. **主题外观**: 使用 `appearance` 来实现明暗主题切换
2. **国际化**: 使用 `language` 来支持多语言功能

::: tip 提示
关于接口？请求查看 [API 接口文档](./api.md)。
:::
