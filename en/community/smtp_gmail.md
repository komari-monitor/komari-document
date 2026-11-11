# Send Notifications with Gmail

Komari can send email notifications through Gmail SMTP using a custom JavaScript notification script.

## Setup Outline

1. Enable two-step verification on your Google account.
2. Create and save an app password for SMTP usage.
3. Open the Komari admin panel and navigate to Settings - Notifications.
4. Enable notifications, select `Javascript` as the notification channel, and paste the script below.
5. Save the configuration and send a test notification.

### SMTP Configuration

The script uses the following Gmail SMTP settings:

```text
Host: smtp.gmail.com
Port: 465
Security: SSL/TLS
Username: your Gmail address
Password: Google app password
```

### JavaScript SMTP Notification Script

The following script is compatible with Komari 1.6.1 and supports regular notifications and event notifications.

```javascript
/* 
 * Komari 1.6.1 SMTP Notification
 * Supports SSL/TLS 465
 */

// ==================== SMTP Configuration ====================

const SMTP = {
    host: "smtp.gmail.com",
    port: 465,

    username: "your Gmail address",
    password: "your app password",

    from: "your Gmail address",
    to: ["recipient@example.com"]
};

// ==================== Runtime Environment ====================

const tls = require("tls");
const { Buffer } = require("buffer");

// Base64
function base64(text) {
    return Buffer.from(String(text), "utf8").toString("base64");
}

// MIME Subject Encoding
function encodeSubject(text) {
    return "=?UTF-8?B?" + base64(text) + "?=";
}

// Email Body Base64 Encoding, wrapped at 76 characters
function encodeBody(text) {
    const encoded = base64(text);
    return encoded.match(/.{1,76}/g)?.join("\r\n") || "";
}

// ==================== SMTP Client ====================

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

        // SMTP response queue
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

                // Multiline responses end with "250 " etc.
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

        // MIME email content
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

        console.log("SMTP: Email sent successfully");
        return true;

    } catch (error) {
        console.error("SMTP: Email sending failed:", error);
        return false;

    } finally {
        if (socket) {
            socket.destroy();
        }
    }
}

// ==================== Komari Notification Interface ====================

// Regular notification
async function sendMessage(message, title) {
    return await smtpSend(
        title || "Komari Notification",
        message || ""
    );
}

// Event notification
async function sendEvent(event) {
    try {
        const eventNames = {
            Offline: "Server Offline",
            Online: "Server Online",
            Alert: "Monitoring Alert",
            Renew: "Server Renewed",
            Expire: "Service Expired",
            Test: "Test Notification"
        };

        const title =
            (eventNames[event.event] || event.event || "System Notification") +
            " - Komari";

        const lines = [];

        lines.push("Komari Server Monitoring Notification");
        lines.push("==============================");
        lines.push("");

        lines.push("Event: " + (event.event || ""));
        lines.push("Time: " + (event.time || ""));
        lines.push("");

        if (event.message) {
            lines.push("Details:");
            lines.push(event.message);
            lines.push("");
        }

        if (event.clients && event.clients.length) {
            lines.push("Related Servers:");

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
        console.error("Event notification processing failed:", error);
        return false;
    }
}
```

## Notes

- Two-step verification is required before you can create a Google app password.
- Use an app password instead of your normal Google account password.
- Keep your credentials private.
- Check whether your VPS or hosting provider blocks outbound SMTP port 587 if sending fails.
- Check Gmail sending limits if you send frequent notifications.

For more detailed instructions, see the Chinese guide: [Gmail SMTP notifications](/community/smtp_gmail).
