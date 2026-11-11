# 利用谷歌邮箱发送通知
### 前置条件
>拥有一个谷歌账号[注册](https://support.google.com/accounts/answer/27441)
>
>开启谷歌账号的两步验证[开启两步验证](https://support.google.com/accounts/answer/185839)

**第一步**
>
打开[谷歌账号页面](https://myaccount.google.com/)
安全性-应用专用密码(也可以直接搜索)
>
创建应用专用密码并保存
>
**第二步**
>
打开Komari面板后台
>
点击，设置-通知
>
开启通知，通知渠道选择`Javascript`
>
填入脚本
```javascript
/*
 * Komari 1.6.1 SMTP Notification
 * 支持 SSL/TLS 465
 */

// ==================== SMTP 配置 ====================

const SMTP = {
    host: "smtp.gmail.com",
    port: 587,

    username: "你的谷歌邮箱",
    password: "应用专用密码",

    from: "你的谷歌邮箱",
    to: ["收件人邮箱"]
};

// ==================== 运行环境 ====================

const tls = require("tls");
const { Buffer } = require("buffer");

// Base64
function base64(text) {
    return Buffer.from(String(text), "utf8").toString("base64");
}

// MIME Subject 编码
function encodeSubject(text) {
    return "=?UTF-8?B?" + base64(text) + "?=";
}

// 邮件正文 Base64，按 76 字符折行
function encodeBody(text) {
    const encoded = base64(text);
    return encoded.match(/.{1,76}/g)?.join("\r\n") || "";
}

// ==================== SMTP 客户端 ====================

async function smtpSend(subject, body) {
    let socket;

    try {
        socket = await new Promise((resolve, reject) => {
            const s = tls.connect({
                host: SMTP.host,
                port: SMTP.port,
                servername: SMTP.host
            });

            s.once("secureConnect", () => resolve(s));
            s.once("error", reject);
        });

        socket.setEncoding("utf8");
        socket.setTimeout(12000);

        // SMTP 响应接收队列
        let buffer = "";
        let currentLines = [];
        const responses = [];
        const waiters = [];

        function dispatch() {
            while (responses.length && waiters.length) {
                waiters.shift()(responses.shift());
            }
        }

        socket.on("data", chunk => {
            buffer += chunk;

            let index;
            while ((index = buffer.indexOf("\r\n")) !== -1) {
                const line = buffer.slice(0, index);
                buffer = buffer.slice(index + 2);

                currentLines.push(line);

                // 多行响应以 "250 " 等形式结束
                if (/^\d{3} /.test(line)) {
                    responses.push(currentLines.join("\n"));
                    currentLines = [];
                    dispatch();
                }
            }
        });

        socket.on("error", error => {
            while (waiters.length) {
                waiters.shift()(null, error);
            }
        });

        socket.on("timeout", () => {
            socket.destroy();
            while (waiters.length) {
                waiters.shift()(null, new Error("SMTP timeout"));
            }
        });

        function readReply() {
            return new Promise((resolve, reject) => {
                if (responses.length) {
                    resolve(responses.shift());
                } else {
                    waiters.push((response, error) => {
                        if (error) reject(error);
                        else if (!response) reject(new Error("SMTP connection closed"));
                        else resolve(response);
                    });
                }
            });
        }

        async function write(data) {
            await new Promise((resolve, reject) => {
                socket.write(data, error => {
                    if (error) reject(error);
                    else resolve();
                });
            });
        }

        async function command(data, expected) {
            await write(data + "\r\n");

            const response = await readReply();
            const code = parseInt(response.substring(0, 3), 10);

            if (!expected.includes(code)) {
                throw new Error("SMTP error: " + response);
            }

            return response;
        }

        // 1. Greeting
        let reply = await readReply();
        if (!reply.startsWith("220")) {
            throw new Error("SMTP greeting failed: " + reply);
        }

        // 2. EHLO
        await command("EHLO komari.local", [250]);

        // 3. AUTH LOGIN
        await command("AUTH LOGIN", [334]);
        await command(base64(SMTP.username), [334]);
        await command(base64(SMTP.password), [235]);

        // 4. MAIL FROM
        await command("MAIL FROM:<" + SMTP.from + ">", [250]);

        // 5. RCPT TO
        for (const recipient of SMTP.to) {
            await command("RCPT TO:<" + recipient + ">", [250, 251]);
        }

        // 6. DATA
        await command("DATA", [354]);

        // MIME 邮件内容
        const mail = [
            "From: " + SMTP.from,
            "To: " + SMTP.to.join(", "),
            "Subject: " + encodeSubject(subject),
            "MIME-Version: 1.0",
            'Content-Type: text/plain; charset="UTF-8"',
            "Content-Transfer-Encoding: base64",
            "X-Mailer: Komari SMTP Notification",
            "",
            encodeBody(body),
            ""
        ].join("\r\n");

        await write(mail + ".\r\n");

        await command("", [250]);

        // 7. QUIT
        await command("QUIT", [221]);

        console.log("SMTP: 邮件发送成功");
        return true;

    } catch (error) {
        console.error("SMTP: 邮件发送失败:", error);
        return false;

    } finally {
        if (socket) {
            socket.destroy();
        }
    }
}

// ==================== Komari 通知接口 ====================

// 普通通知
async function sendMessage(message, title) {
    return await smtpSend(
        title || "Komari 通知",
        message || ""
    );
}

// 事件通知
async function sendEvent(event) {
    try {
        const eventNames = {
            Offline: "服务器离线",
            Online: "服务器上线",
            Alert: "监控告警",
            Renew: "服务器续费",
            Expire: "服务到期",
            Test: "测试通知"
        };

        const title =
            (eventNames[event.event] || event.event || "系统通知") +
            " - Komari";

        const lines = [];

        lines.push("Komari 服务器监控通知");
        lines.push("==============================");
        lines.push("");
        lines.push("事件类型: " + (event.event || ""));
        lines.push("发生时间: " + (event.time || ""));
        lines.push("");

        if (event.message) {
            lines.push("事件详情:");
            lines.push(event.message);
            lines.push("");
        }

        if (event.clients && event.clients.length) {
            lines.push("关联服务器:");

            event.clients.forEach((client, index) => {
                lines.push(
                    (index + 1) + ". " +
                    (client.name || "Unknown") +
                    (client.region ? " (" + client.region + ")" : "")
                );
            });
        }

        return await smtpSend(title, lines.join("\n"));

    } catch (error) {
        console.error("事件通知处理失败:", error);
        return false;
    }
}
```
>
保存
>
**第三步**
>
点击发送测试消息，能正常收到信息则说明配置正确
>
**注意**
>
1.两步验证为必选项，必须开启两步验证后才能够设置应用专用密码
>
2.若发送失败请检查所部署的VPS是否已屏蔽587端口



