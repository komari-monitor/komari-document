# 发布到插件市场

Komari 官方插件市场是一个开源目录仓库（`plugin-market`），存放插件的元数据、下载地址
和 SHA-256 校验值。**插件包仍由插件作者自行托管**，市场只负责目录、校验与分发指引。

插件市场随服务端内置，默认源为 Komari 官方目录。服务端支持配置多个市场源（REST 端点
见 [RPC 接口 - 插件管理](./rpc#插件管理相关方法的补充说明)）。

## 目录条目（v1.json）

每个可安装插件包含以下字段：

```json
{
  "name": {
    "zh-CN": "Komari 测试插件",
    "en": "Komari Test Plugin"
  },
  "short": "TestPlugin",
  "description": {
    "zh-CN": "一个用于 Komari 的测试插件",
    "en": "A test plugin for Komari"
  },
  "version": "1.0.0",
  "author": "Your Name",
  "url": "https://github.com/your-name/komari-example",
  "preview": "https://example.com/preview.png",
  "download": "https://example.com/plugin.zip",
  "sha256": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "komari": ">=1.0.0"
}
```

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `name` | 是 | string 或 i18n 对象 |
| `short` | 是 | 插件唯一短名，`[A-Za-z0-9_-]`，按 `short` 不区分大小写排序，不能重复 |
| `description` | 否 | string 或 i18n 对象 |
| `version` | 是 | 插件版本号 |
| `author` | 是 | string 或 i18n 对象 |
| `url` | 否 | 项目主页，HTTP(S) URL，不能含用户信息（`user:pass@`） |
| `preview` | 否 | 预览图，绝对 HTTP(S) URL，图片格式为 PNG/JPEG/GIF/WebP/AVIF |
| `download` | 与 `sha256` 成对 | 插件 ZIP 下载地址，绝对 HTTP(S) URL；仅作来源展示的条目可省略 |
| `sha256` | 与 `download` 成对 | 该 ZIP 的小写 SHA-256（64 位十六进制） |
| `komari` | 否 | 服务端版本约束，**必须与 `komari-plugin.json` 完全一致** |

::: tip 安装校验
服务端从市场安装时：下载上限 100 MiB → 校验 SHA-256 → 校验包内清单与目录的
`short`、`version` 一致 → 安装。目录缓存在服务端保留 10 分钟。
:::

## 提交插件

在 [plugin-market 仓库的 Issue 页面](https://github.com/komari-monitor/plugin-market/issues/new/choose)
选择对应模板。提交过程由 GitHub Actions 全自动处理：校验通过后自动创建目录更新 PR。

::: warning 注意
请按 Issue 模板的固定字段填写，不要改名或重排字段标题——Action 按 Issue Form
字段读取内容。
:::

### 方式一：GitHub 开源插件

只需提供：

- GitHub 仓库地址（必须公开）
- 预览图链接
- 确认最新 Release 中附带插件 ZIP 包

Action 会读取仓库的最新 Release，从 Release 资产中找到唯一的合法插件 ZIP（包内必须
有根目录 `komari-plugin.json`）。

### 方式二：非 GitHub 托管插件

需要提供：

- 项目地址（不能是 GitHub 托管地址）
- 插件包下载地址（不能是 GitHub 托管地址）
- 预览图链接
- 插件名称、唯一短名、版本、描述、作者
- 确认代码无恶意行为、包不会自动更新

## 校验规则（提交时自动执行）

| 类别 | 规则 |
| --- | --- |
| URL | 拒绝含凭据的 URL；拒绝指向内网/私有 IP 的下载主机；外部托管表单拒绝 GitHub 地址 |
| 包大小 | 下载 ≤ 100 MiB，重定向 ≤ 10 次 |
| 包安全 | 无绝对路径/穿越/反斜杠/NUL 路径、无软链接；≤ 10,000 文件、单文件 ≤ 128 MiB、解压 ≤ 512 MiB |
| 清单 | 根目录恰好一个 `komari-plugin.json`（≤ 1 MiB）；`name/short/version/author` 合法 |
| 一致性 | 外部托管表单提交的 `short`、`version` 必须与包内清单一致 |
| 预览图 | PNG/JPEG/GIF/WebP/AVIF；GitHub `blob` 链接自动规范化为 `raw` 链接 |
| 目录 | 计算 SHA-256、按 `short` 不区分大小写排序、更新 `updated_at` |

提交失败时 Action 会在 Issue 中留言原因并自动关闭；瞬时失败（403/408/425/429/5xx、
DNS）会保留 Issue 待重试。

## Release 自动更新

目录中由 GitHub 仓库支持的条目，其更新工作流每 6 小时运行一次：

1. 用仓库地址 + 最新 Release 标签 + 当前资源名构造下载地址（GitHub API 资源地址兜底）。
2. 重新校验包内清单、`short`、`version` 和 SHA-256。
3. 全部通过才创建更新 PR。

因此，**维护 GitHub 托管的插件时，只需发布新 Release（附插件 ZIP 资产），市场会自动
跟进**，无需手动改目录。

## 本地快速校验清单顺序

```text
node scripts/check-catalog-order.mjs
```
