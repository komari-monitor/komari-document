# 使用 1Panel 部署 Komari

Komari 目前已正式上架 1Panel 官方应用商店，您可以直接通过 1Panel 应用商店快速安装部署，无需额外脚本或手动配置。

> **官方应用商店地址**：[https://apps.fit2cloud.com/1panel/komari](https://apps.fit2cloud.com/1panel/komari)

---

## 环境要求

- 一台已安装 1Panel 的服务器（安装教程参考：[1Panel 官方文档](https://1panel.cn/docs/installation/online_installation/)）
- 配置不低于：1 核 CPU、512MB 内存
- 存储空间：至少 15GB

---

## 步骤一：安装 Komari 应用

### 1. 打开应用商店

登录 1Panel 管理面板，点击左侧菜单栏的「应用商店」。

![1Panel 应用商店入口](/assets/1panel-sidebar.png)

### 2. 搜索 Komari

在应用商店搜索框中输入「komari」，或在「实用工具」分类中找到 Komari 应用。

![搜索 Komari](/assets/1panel-search.png)

### 3. 配置并安装

点击「安装」按钮，进入配置页面：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| 端口 | 25774 | 外部访问端口，可自定义 |
| 管理员账号 | admin | 后台登录用户名 |
| 管理员密码 | password+随机字符 | **请务必修改**，初始密码可在容器日志中查看 |

![安装配置界面](/assets/xhcuyxfg.jpg)

> **⚠️ 重要提示**：
> - 默认后台账号为 `admin`，密码为 `password` 加上随机字符（如 `password_jWZ62s`）
> - 如果安装时未记住密码，可通过容器日志查看，搜索关键词 `Default admin account created`
> - 示例日志：`[INFO] Default admin account created. Username: admin , Password: password_jWZ62s`

### 4. 等待安装完成

确认配置无误后点击「确认」，等待 1Panel 自动拉取镜像并完成部署。

![安装进度](/assets/1p-installed.jpg)

---

## 步骤二：访问 Komari 面板

安装完成后，您可以通过以下方式访问：

- **ip访问**：`http://服务器IP:25774`（如果您未修改默认端口）
- **域名访问**：如需域名访问，请在 1Panel 的「网站」功能中配置反向代理

![Komari 登录界面](/assets/gdujcjv.jpg)

输入安装时设置的管理员账号和密码即可登录。

---

## 步骤三：开始使用

登录后，您可以：

1. **添加被监控服务器**：在后台生成 Agent 安装命令，部署到需要监控的服务器上
2. **自定义主题**：可安装 Purcarte 等第三方主题美化界面
3. **配置告警**：设置服务器状态异常时的通知方式

---

## 常见问题

### Q: 忘记管理员密码怎么办？
A: 进入 1Panel 的「容器」管理页面，找到 Komari 容器，查看日志搜索 `Default admin account created` 即可看到初始账号密码。

### Q: 如何修改已部署的端口或密码？
A: 在 1Panel 的「应用商店」-「已安装」中找到 Komari，点击「参数」进行修改，修改后重启应用即可。

### Q: 国内服务器拉取镜像慢？
A: 1Panel 已内置镜像加速功能，或在安装时修改compose配置文件，配置 GitHub Docker 镜像加速地址（如 `https://ghcr.1ms.run`）。
