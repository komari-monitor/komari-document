# Send Notifications with Gmail

Komari can send email notifications through Gmail SMTP when Gmail account settings permit it.

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
