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
    "short": "TestTheme", // 唯一标识符，只能包含大小写字母和数字
    "description": "A test theme for Komari",
    "version": "1.0.0",
    "author": "Akizon77",
    "url": "https://github.com/komari-monitor/komari",
    "preview": "preview.png"
}
```

#### 配置字段说明

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `name` | string | 是 | 主题的完整名称 |
| `short` | string | 是 | 主题的唯一标识符，只能包含大小写字母和数字 |
| `description` | string | 是 | 主题的描述信息 |
| `version` | string | 是 | 主题版本号，建议使用语义化版本 |
| `author` | string | 是 | 主题作者 |
| `url` | string | 否 | 主题的项目地址或作者网站 |
| `preview` | string | 否 | 预览图片的相对路径（相对于主题根目录） |

## 动态配置（自 1.0.5 起支持）

自 `Komari` 服务器版本 1.0.5 起，主题可在 `komari-theme.json` 中声明一个可管理的 `configuration`，用于让管理员在面板中直接调节主题参数，而无需重新打包主题。

### 扩展示例

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
            { "name": "测试标题", "type": "title" },
            { "key": "switch_A", "name": "测试开关", "type": "switch", "default": true, "help": "这是一个测试开关" },
            { "key": "select_A", "name": "测试选择", "type": "select", "options": "选项1,选项2,选项3", "default": "选项1", "help": "这是一个测试选择" },
            { "key": "number_A", "name": "测试输入框(数字)", "type": "number", "default": 10, "help": "这是一个测试输入框" },
            { "key": "string_A", "name": "测试输入框2", "type": "string", "required": true, "help": "这是一个测试输入框" }
        ]
    }
}
```

### 字段说明（configuration 根对象）

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| `type` | string | 是 | 目前固定为 `managed` |
| `icon` | string | 否 | 设置面板的图标 URL。支持绝对/相对路径。`/themes/{short}/` 指向主题根目录，可用：`/themes/Mochi/dist/...` `https://img.com/img.png` |
| `name` | string | 否 | 在管理面板展示的配置标题；未填写可由系统回退到主题名 |
| `data` | array | 是 | 配置项数组（见下表） |

### 配置项（data 数组元素）

| 字段 | 适用类型 | 必需 | 描述 |
|------|----------|------|------|
| `type` | 全部 | 是 | `string` / `number` / `select` / `switch` / `title` |
| `name` | 全部 | 是 | 显示名称；`title` 类型用于分组标题，不需要 `key` |
| `key` | 除 `title` | 是 | 唯一键 |
| `required` | `string` | 否 | 是否必填（默认 `false`） |
| `options` | `select` | 是 | 逗号分隔的选项：`"A,B,C"` |
| `default` | 除 `title` | 否 | 默认值 |
| `help` | 除 `title` | 否 | 帮助提示文本 |

#### 类型含义

- `title`: 纯分隔/标题行，无交互，不应包含 `key`、`default`。
- `string`: 文本输入。
- `number`: 数字输入，前端需自行校验范围。
- `select`: 下拉选择，`options` 为必填。
- `switch`: 布尔开关，值为 `true/false`。

### 空值与兼容性处理

请在前端/主题脚本中优雅处理以下情况：

1. `configuration` 字段不存在（< 1.0.5 的旧主题）。
2. `configuration` 存在但 `data` 为 `null` 或空数组。
3. 某个配置项的 `default` 为 `null`（应采用组件级 fallback）。

### 图标与资源路径

当使用以 `/themes/{short}/` 开头的绝对路径时，服务器会将其映射到该主题的根目录。例如：

```
/themes/Mochi/dist/assets/os-debian.svg  ->  {主题包解压根}/dist/assets/os-debian.svg
```

因此在 `icon`、或自定义资源引用里可以安全使用该前缀，避免硬编码完整 URL。

### 版本提醒

只有 **服务器版本 1.0.5 及以上** 会解析并展示 `configuration`。

---

> 提醒：若未声明 `configuration`，主题仍完全可用；此特性只是为增强可定制性。


## 主页面模板

### index.html 要求

主题的核心文件是 `dist/index.html`，它作为监控页面的模板。在创建此文件时，请注意以下重要要求：

#### 必需的占位符

为了确保自定义设置功能正常工作，`index.html` 中必须包含以下固定内容：

```html
<title>Komari Monitor</title>
<meta name="description" content="A simple server monitor tool.">
```
```html
<body>
    <!-- 页面内容 -->
</body>
```

#### 服务端替换规则

Komari 服务端会自动替换以下内容为用户配置的自定义内容：

| 原始内容 | 替换为 |
|----------|--------|
| `<title>Komari Monitor</title>` | 用户设置的自定义标题 |
| `A simple server monitor tool.` | 用户设置的自定义描述 |
| `</head>` | 用户自定义头部内容 + `</head>` |
| `</body>` | 用户自定义底部内容 + `</body>` |

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
主题和自定义设置在 `/admin` 和 `/terminal` 页面不生效。这些页面使用系统内置的界面，确保管理功能的稳定性和一致性。
:::

## 开发指南

### 注意事项

1. **路由冲突**: 主题中不应该使用 `/admin` 和 `/terminal` 路径
2. **功能分离**: 管理功能应该通过管理员后台实现，不建议在主题中重复实现
3. **权限控制**: 主题页面应该只展示监控信息，不应包含管理功能
4. 请务必保留页脚 `Powered by Komari Monitor.`。

### 本地存储字段

在开发主题时，您可以使用以下本地存储字段来实现个性化功能（这些字段为可选实现）：

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `nodeSelectedGroup` | string | 用户选择的自定义分组 |
| `nodeViewMode` | "grid" \| "table" | 展示模式，网格或表格 |
| `appearance` | "light" \| "dark" \| "system" | 明暗主题设置 |
| `i18nextLng` | string | 语言设置，例如 "zh-CN" |

#### 使用示例

```javascript
// 读取本地存储
const selectedGroup = localStorage.getItem('nodeSelectedGroup');
const viewMode = localStorage.getItem('nodeViewMode') || 'grid';
const appearance = localStorage.getItem('appearance') || 'system';
const language = localStorage.getItem('i18nextLng') || 'zh-CN';

// 设置本地存储
localStorage.setItem('nodeSelectedGroup', 'customGroup');
localStorage.setItem('nodeViewMode', 'table');
localStorage.setItem('appearance', 'dark');
localStorage.setItem('i18nextLng', 'en-US');
```

#### 实现建议

1. **分组功能**: 使用 `nodeSelectedGroup` 来记住用户选择的服务器分组
2. **视图模式**: 使用 `nodeViewMode` 来切换网格和表格显示模式
3. **主题外观**: 使用 `appearance` 来实现明暗主题切换
4. **国际化**: 使用 `i18nextLng` 来支持多语言功能

::: tip 提示
这些本地存储字段是可选的，您可以根据主题的需要选择性实现。建议在主题中提供相应的设置界面来让用户配置这些选项。
:::


::: tip 提示
关于接口？请求查看 [API 接口文档](./api.md)。
:::