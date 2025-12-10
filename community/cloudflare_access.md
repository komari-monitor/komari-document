# Cloudflare Access 配置指南

Komari 支持集成 Cloudflare Access 作为身份验证方案。请遵循以下步骤进行配置：

## 第一部分：创建 Cloudflare Access 应用

1.  转到 [https://one.dash.cloudflare.com/](https://one.dash.cloudflare.com/) 登录到您的 Cloudflare 仪表板，并选择您的账户。
2.  在左侧导航菜单中，选择 **访问控制 (Access)** > **应用程序 (Applications)**。
3.  点击“**创建访问应用程序**”或“**添加应用程序**”。
4.  在应用类型中，选择“**自托管 (Self-Hosted)**”。
5.  请根据您的实际需求配置各项设置，重点关注以下关键字段：
    - **公用主机名 (Public Hostname)**：填写您的 Komari 服务器的域名或 IP 地址。
    - **Access 策略 (Access Policy)**：创建新的策略。
      - 策略名称可自定义。
      - 操作选择“允许 (Allow)”。
      - 规则设置为 **Emails**，值为您的邮箱地址。（_注：此处以最简单的“邮件一次性密码（OTP）”方案为例进行配置。如果您熟悉 Cloudflare Access 策略，可以根据需要进行高级配置。_）
      - 保存策略后，返回应用程序页面。
6.  在“现有策略”中，选择刚刚创建的策略，点击“下一步”。
7.  继续后续步骤（如有其他自定义需求可自行修改），点击“**保存**”完成应用程序创建。
8.  应用程序创建完成后，返回应用列表，点击进入该应用，选择“**配置 (Configuration)**”选项卡。复制 **应用程序受众 (AUD) 标签**，并妥善记录。
9.  在左侧菜单栏中，点击“**设置 (Settings)**”，找到“**团队域 (Team Domain)**”。复制团队域，**仅复制域名前缀部分**（即不需要 `.cloudflareaccess.com`）。例如，如果您的团队域是 `abc.cloudflareaccess.com`，则记录 `abc`。
10. **初步验证：** 访问您的 Komari 站点。此时应提示您登录 Cloudflare Access，请使用策略中允许的邮箱地址登录。验证成功后，页面将自动跳转回您的站点。

## 第二部分：配置 Komari

1.  登录 Komari 管理界面，导航至 **设置 > 登录 > 单点登录 (SSO)**。
2.  将第一部分中记录的**团队域前缀**和**应用程序受众 (AUD)** 填入对应字段并保存。
3.  导航至 **账户单点登录 > 外部账户**，完成外部账户绑定。
4.  成功绑定后，您将看到类似 “**已绑定外部账户 CloudflareAccess ID: xxxxxx**” 的提示，表明配置成功。
5.  如果您需要使用其他的身份验证或登录策略（如 Okta、Google 等），您可以在 Cloudflare Access 控制台中进行相应配置，并使用相应的登录方式进行身份验证。
