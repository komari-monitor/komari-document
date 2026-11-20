# Send Notifications with Gmail

:::warning Version notice
Current versions of Komari have removed the built-in `email` (SMTP) notification channel and only include `webhook` and `Javascript` channels by default. On current versions, send emails via a plugin (`server.registerNotificationChannel`) or an HTTP-to-SMTP relay using `webhook` / `Javascript`. The Gmail SMTP details below apply to older versions or external SMTP relays.
:::

Komari can send email notifications through Gmail SMTP when configured with a compatible version or relay.

## Setup Outline

1. Enable two-factor authentication on the Google account.
2. Create an app password for SMTP usage.
3. Configure Komari email notification settings with Gmail SMTP.
4. Send a test notification.

Typical SMTP values:

```text
Host: smtp.gmail.com
Port: 587
Security: STARTTLS
Username: your Gmail address
Password: app password
```

## Notes

- Use an app password instead of your normal Google account password.
- Keep credentials private.
- Check Gmail sending limits if you send frequent notifications.

The Chinese guide has more detailed current steps: [Gmail SMTP notifications](/community/smtp_gmail).
