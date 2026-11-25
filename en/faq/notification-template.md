# Notification Templates

Komari supports custom notification templates, letting you tailor the format and content of notification messages to your needs. With template variables, you can create personalized, informative notifications.

## Template Variables

Komari provides the following template variables for use in notification templates.

You can replace the variables in a template to customize the notification content. Variables are wrapped in double curly braces.

### Basic Variables

| Variable | Type | Description | Example |
| --- | --- | --- | --- |
| `event` | string | Event type, the specific event that occurred | `Offline`, `Online`, `Expire`, `Renew`, `Login`, `Traffic`, `Alert` |
| `client` | string | Name of the server that triggered the event (`clients` is an equivalent alias) | `Web Server 01`, `Database Server` |
| `time` | string | Trigger time formatted in the server OS local timezone (`2006-01-02 15:04:05`) | `2024-01-15 22:30:25` |
| `message` | string | Details or error description | `Server response timed out`, `CPU usage too high` |
| `emoji` | string | Emoji icon for the event type | `🔴`, `🟢`, `⚠️` |

> Template placeholders are replaced by the server using the lowercase event field names (`{{event}}`, `{{client}}`, `{{clients}}`, `{{time}}`, `{{message}}`, `{{emoji}}`); only `string`, `Client` list, and `time.Time` fields are supported.

## Configuration

### 1. Open Notification Settings

1. Log in to the Komari admin panel
2. Go to **Settings** → **Notifications**
3. Enable notifications and select a notification channel

### 2. Save and Test

- Click Save after editing
- Use the "Send Test Message" feature to verify the template works

## Example Template

```text
{{emoji}}{{emoji}}{{emoji}}
Event: {{event}}
Server: {{client}}
Message: {{message}}
Time: {{time}}
```

## JavaScript Notification Configuration

You must implement a `sendMessage(message: string, title: string): bool` function.

You may optionally implement a `sendEvent(event): bool` function to enable event notifications.

The event object contains the following fields:

| Field | Type | Description | Example |
| --- | --- | --- | --- |
| `event` | string | Event type, identifying the notification category (`Test` for test messages) | `Offline` |
| `clients` | Client array | List of associated clients | |
| `time` | string | Time the event occurred, JSON-serialized as UTC RFC3339 | `2024-01-15T14:30:25Z` |
| `message` | string | Details or a hint about the event | ` ` |
| `emoji` | string | Emoji icon matching the event | `🔴` |

See the `Client` struct in `komari-server/database/models/models.go`.

### Telegram Example

```javascript

async function sendMessage(message, title) {
  const token = "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const chatId = "123456789"

  if (!token || token === 'REPLACE_WITH_TOKEN') {
    console.error('Telegram bot token is not set (TELEGRAM_BOT_TOKEN). Message not sent.');
    return false;
  }
  if (!chatId || chatId === 'REPLACE_CHAT_ID') {
    console.error('Telegram chat id is not set (TELEGRAM_CHAT_ID). Message not sent.');
    return false;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      // Use a concise HTML template and avoid leaking sensitive fields
      text: `<b>${title}</b>\n\n${message}`,
      parse_mode: 'HTML',
    }),
  });

  if (!resp.ok) {
    console.error('Failed to send message:', resp.status, resp.statusText);
    return false;
  }
  return true;
}

async function sendEvent(event) {
  try {
    // Format the time
    const formatTime = (timeStr) => {
      const date = new Date(timeStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Shanghai'
      });
    };

    // Format file sizes
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Describe the event type
    const getEventTypeDesc = (eventType) => {
      const eventMap = {
        'Offline': '❌ Server offline',
        'Online': '✅ Server online',
        'Alert': '⚠️ Monitoring alert',
        'Renew': '⏰ Server auto-renewed',
        'Expire': '🚨 Server expiry reminder',
        'Test': '🧪 Test notification'
      };
      return eventMap[eventType] || `📊 ${eventType}`;
    };

    // Build a concise server summary (avoid leaking sensitive fields)
    const generateClientSummary = (client) => {
      let parts = [];
      parts.push(`<b>${client.name || 'Unknown'}</b>`);
      if (client.region) parts.push(`${client.region}`);
      return parts.join(' • ');
    };

    const title = `${getEventTypeDesc(event.event) || 'ℹ️'} Komari Notification`;
    let message = '';

    message += `Time: ${formatTime(event.time)}\n`;

    if (event.message && event.message.trim()) {
      message += `Details: ${event.message}\n`;
    }

    message += '\n';

    if (event.clients && event.clients.length > 0) {
      if (event.clients.length === 1) {
        message += generateClientSummary(event.clients[0]);
      } else {
        message += `Affected servers: ${event.clients.length}\n`;
        const shown = event.clients.length;
        for (let i = 0; i < shown; i++) {
          message += `${i + 1}. ${generateClientSummary(event.clients[i])}\n`;
        }
      }
    } else {
      message += 'No associated server info';
    }
    
    // Send the notification
    const success = await sendMessage(message, title);
    if (success) {
      console.log(`Event notification sent: ${event.event}`);
    } else {
      console.error(`Failed to send event notification: ${event.event}`);
    }
    return success;
    
  } catch (error) {
    console.error('Error while sending the event notification:', error);
    
    // Send a simplified fallback notification
    const fallbackMessage = `${event.emoji || ''} ${event.event}\n${event.message || ''}`;
    const fallbackTitle = 'Komari Notification';
    try {
      return await sendMessage(fallbackMessage, fallbackTitle);
    } catch (fallbackError) {
      console.error('Fallback notification also failed:', fallbackError);
      return false;
    }
  }
}


```

### Gotify Example

```javascript
async function sendMessage(message, title) {
  const gotifyUrl = "https://114514.zip"; // Replace with your Gotify server address
  const token = "114514"; // Replace with your app token
  const priority = 5;

  if (!gotifyUrl || gotifyUrl === 'https://push.example.com') {
    console.error('Gotify URL is not set. Message not sent.');
    return false;
  }
  if (!token || token === 'REPLACE_WITH_TOKEN') {
    console.error('Gotify app token is not set. Message not sent.');
    return false;
  }

  const baseUrl = gotifyUrl.endsWith('/') ? gotifyUrl.slice(0, -1) : gotifyUrl;
  const url = `${baseUrl}/message?token=${token}`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        title: title,
        priority: priority,
        extras: {
          "client::display": {
            "contentType": "text/markdown"
          }
        }
      }),
    });

    if (!resp.ok) {
      console.error('Failed to send message to Gotify:', resp.status, resp.statusText);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error while sending message to Gotify:', e);
    return false;
  }
}

async function sendEvent(event) {
  try {
    const formatTime = (timeStr) => {
      const date = new Date(timeStr);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Shanghai'
      });
    };

    const getEventTypeDesc = (eventType) => {
      const eventMap = {
        'Offline': '❌ Server offline',
        'Online': '✅ Server online',
        'Alert': '⚠️ Monitoring alert',
        'Renew': '⏰ Server auto-renewed',
        'Expire': '🚨 Server expiry reminder',
        'Test': '🧪 Test notification'
      };
      return eventMap[eventType] || `📊 ${eventType}`;
    };

    const generateClientSummary = (client) => {
      let parts = [];
      parts.push(`**${client.name || 'Unknown'}**`);
      if (client.region) parts.push(`${client.region}`);
      return parts.join(' • ');
    };

    const title = `${getEventTypeDesc(event.event) || 'ℹ️'} Komari Notification`;
    let message = '';

    message += `Time: ${formatTime(event.time)}\n`;

    if (event.message && event.message.trim()) {
      message += `Details: ${event.message}\n`;
    }

    message += '\n';

    if (event.clients && event.clients.length > 0) {
      if (event.clients.length === 1) {
        message += generateClientSummary(event.clients[0]);
      } else {
        message += `Affected servers: ${event.clients.length}\n`;
        const shown = event.clients.length;
        for (let i = 0; i < shown; i++) {
          message += `${i + 1}. ${generateClientSummary(event.clients[i])}\n`;
        }
      }
    } else {
      message += 'No associated server info';
    }
    
    const success = await sendMessage(message, title);
    if (success) {
      console.log(`Event notification sent: ${event.event}`);
    } else {
      console.error(`Failed to send event notification: ${event.event}`);
    }
    return success;
    
  } catch (error) {
    console.error('Error while sending the event notification:', error);
    
    const fallbackMessage = `${event.emoji || ''} ${event.event}\n${event.message || ''}`;
    const fallbackTitle = 'Komari Notification';
    try {
      return await sendMessage(fallbackMessage, fallbackTitle);
    } catch (fallbackError) {
      console.error('Fallback notification also failed:', fallbackError);
      return false;
    }
  }
}
```

## Notes

- Keep secrets outside public templates and test changes with **Send Test Message** before enabling broadly.
- Built-in channels are `webhook` and `Javascript`; additional channels can be added through JavaScript plugins (`server.registerNotificationChannel`).
