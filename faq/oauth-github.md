# 使用 GitHub 作为单点登录提供商指南

本文档介绍如何在 Komari 中使用 GitHub 进行单点登录。

## 1. 启用单点登录

请转到 设置 - 登录，启用单点登录，将 GitHub 选作单点登录提供商，并记下 Komari 提供的回调地址（例如：`https://example.com/api/oauth_callback`）。

## 2. 新建 OAuth App

请转到 [Developer applications](https://github.com/settings/developers)，单击 `New OAuth App`，填写相关信息和上一步所提到的回调地址，随后单击 `Register application`。
在新建完一个 OAuth App 后，单击 `Generate a new client secret`，后同时记下 `Client ID` 与 `Client secret`。

> [!WARNING]
> 请及时记下 `Client secret`，因为之后将不可见。

## 3. 完善登录参数

请回到 设置 - 登录，将上一步所记下的 `Client ID` 与 `Client secret` 分别填入相关位置并保存。
请转到 设置 - 账户，在下方进行绑定将用于登录 Komari 的 GitHub 账户。之后，单点登录将可用。

## 4. 禁用密码登录

> [!NOTE]
> 这是一个可选项，旨在让登录更安全。

请回到 设置 - 登录，启用禁止密码登录。在这之后，将只能使用 GitHub 账户登录。
