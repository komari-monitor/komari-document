# 使用 1Panel 部署 Komari

Komari 镜像站提供者 Geekertao 在 2026 年 1 月 1 日向 1Panel 的官方应用商店提交了[添加 Komari 的 PR](https://github.com/1Panel-dev/appstore/pull/6087)，但遗憾的是该 PR 被关闭了。既然官方应用商店暂不接受，我们也要让小白用户能够轻松使用 1Panel 部署 Komari！

## 环境要求

- 一台已安装 1Panel 的服务器
- 配置不低于：1 核 CPU、512MB 内存
- 存储空间：至少 15GB

> **提示**：部署过程非常简单！只需 3 个步骤即可完成。

---

## 步骤一：添加 Komari 到应用商店

以 root 用户身份运行以下脚本，自动将 Komari 添加到 1Panel 的应用商店：

```bash
bash -c "$(curl -sSL https://1panel.komari.wiki/install.sh)"
```

---

## 步骤二：安装 Komari 应用

脚本执行完成后，请按以下步骤操作：

1. 打开 1Panel 的应用商店
2. 点击「同步本地应用」按钮
3. 在搜索框中输入「komari」或打开「实用工具」分类
4. 找到 Komari 应用，点击安装

> **配置说明**：安装时可以自定义应用端口、后台账号密码等参数。
> 
> **注意**：如果您未勾选「端口外部访问」，则需要自行配置反向代理等操作。

---

## 步骤三：开始使用

安装完成后，打开您的 Komari 界面，即可开始使用 Komari 监控您的服务器！