# 托管配置（Managed Configuration）

主题和插件共用同一套 `managed` 声明式配置：在 `configuration` 中声明
`type: "managed"` 与 `data` 配置项数组，管理界面会自动生成表单，并按统一规则保存和输出。

- 主题：通过 `GET /api/public` 的 `data.theme_settings` 读取，见 [主题开发指南](./theme)。
- 插件：通过 `await server.getConfig()` 读取；管理端可用 `admin:getPluginConfiguration`，见 [插件开发指南](./plugin/index)。

## 结构

```json
{
  "type": "managed",
  "name": "配置面板标题",
  "icon": "/themes/example/icon.svg",
  "data": [
    { "type": "title", "name": "分组" },
    { "key": "greeting", "name": "问候语", "type": "string", "default": "Hello" }
  ]
}
```

`name` 和 `icon` 只用于管理面板展示；`data` 是配置项数组。

## 配置项字段

| 字段       | 类型             | 必填 | 说明                                                             |
| ---------- | ---------------- | ---- | ---------------------------------------------------------------- |
| `key`      | string           | 除 `title` / `textbox` 外必填 | 唯一配置键                                         |
| `name`     | string \| i18n   | 是   | 表单标签；`textbox` 使用该项直接渲染 HTML                        |
| `type`     | string           | 是   | 见下方字段类型                                                   |
| `options`  | string           | 否   | `select` 的选项，逗号分隔                                        |
| `default`  | any              | 否   | 默认值                                                           |
| `required` | boolean          | 否   | 是否必填                                                         |
| `help`     | string \| i18n   | 否   | 帮助文本                                                         |

## 字段类型

- `title`: 分组标题，用于生成设置页导航；不应包含 `key`、`default`。
- `textbox`: 纯 HTML 文本块，不保存值、不生成分组导航；只应来自可信来源。
- `string`: 文本输入。
- `number`: 数字输入。
- `select`: 下拉选择，`options` 为必填。
- `switch`: 布尔开关。
- `richtext`: 长文本输入，适合 HTML 片段或较长配置文本。
- `nodes`: 节点多选，右侧“选择节点”按钮打开选择器。
- `pingtasks`: Ping 任务多选，右侧“选择 Ping 任务”按钮打开选择器。

选择器选择后会在字段下方追加一行显示已选名称，逗号分隔，最多 50 个字符，超出以
`...` 结尾。

## 多语言文本

`configuration.name`、配置项的 `name` 和 `help` 可以是字符串或多语言对象：

```json
{
  "name": {
    "zh-CN": "背景图片 URL",
    "en": "Background Image URL"
  }
}
```

前端按以下顺序回退：精确匹配 → 规范化匹配（`-` / `_` 互通，如 `zh-CN` 与
`zh_CN` 等价）→ 基础语言（`zh`）

## 默认值合并规则

已保存的值优先；未保存的键按以下规则补齐：

| 类型 | 无默认值时的兜底 |
| --- | --- |
| `select` | `options` 第一个选项 |
| `number` | `0` |
| `switch` | `false` |
| `nodes` / `pingtasks` | `[]` |
| 其他 | `""` |


对应输出：

```json
{
  "selected_nodes": ["uuid-a", "uuid-b"],
  "selected_ping_tasks": [1, 2]
}
```

主题后台保存调用 `POST /api/admin/theme/settings?theme=<short>`；插件后台保存调用
`admin:setPluginConfiguration`。请求中的选择器字段同样保持 JSON 字符串，只有输出时才
转换为数组。
