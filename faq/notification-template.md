# 通知模板配置指南

Komari 支持自定义通知模板，允许您根据需要定制通知消息的格式和内容。通过使用模板变量，您可以创建个性化、信息丰富的通知消息。

## 模板变量说明

Komari 提供以下模板变量，可在通知模板中使用。

你可以替换模板中的变量来定制通知内容。变量使用双重大括号包裹。

### 基础变量

| 变量      | 类型   | 描述                         | 示例值                            |
| --------- | ------ | ---------------------------- | --------------------------------- |
| `event`   | 字符串 | 事件类型，表示发生的具体事件 | `offline`、`online`、`alert`      |
| `client`  | 字符串 | 触发事件的服务器名称         | `Web服务器01`、`数据库服务器`     |
| `time`    | 字符串 | 触发事件的时间戳             | `2024-01-15 14:30:25`             |
| `message` | 字符串 | 详细信息或错误描述           | `服务器响应超时`、`CPU使用率过高` |
| `emoji`   | 字符串 | 对应事件类型的 Emoji 图标    | `🔴`、`🟢`、`⚠️`                  |

## 配置方法

### 1. 进入通知设置

1. 登录 Komari 管理后台
2. 进入 **设置** → **通知**
3. 启用通知功能并选择通知渠道

### 2. 保存并测试

- 编辑完成后点击保存
- 使用"发送测试消息"功能验证模板效果

## 示例

```text
{{emoji}}{{emoji}}{{emoji}}
事件：{{event}}
服务器：{{client}}
消息：{{message}}
时间：{{time}}
```

## Javascript 通知配置

必须实现 `sendMessage(message: string, title: string): bool` 函数。

可选实现 `sendEvent(event): bool` 函数以启用事件通知。

事件对象包含以下字段：

| 字段      | 类型        | 描述                                       | 示例值                 |
| --------- | ----------- | ------------------------------------------ | ---------------------- |
| `event`   | 字符串      | 事件类型，用以标识通知类别                 | `offline`              |
| `clients` | Client 数组 | 关联的客户端列表，结构体 `Client` 按需扩展 |                        |
| `time`    | 时间        | 事件发生时间                               | `2024-01-15T14:30:25Z` |
| `message` | 字符串      | 事件的详细说明或提示信息                   | ` `                    |
| `emoji`   | 字符串      | 与事件匹配的 Emoji 图标                    | `🔴`                   |

Client 结构体见：https://github.com/komari-monitor/komari/blob/b62fb1f70889fc1ac94e7c58ed928d7a27df5d09/database/models/models.go#L10


### Telegram 示例代码

```javascript

async function sendMessage(message, title) {
  const token = "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const chatId = "123456789"

  if (!token || token === 'REPLACE_WITH_TOKEN') {
    console.error('Telegram bot token 未设置 (TELEGRAM_BOT_TOKEN)。消息未发送。');
    return false;
  }
  if (!chatId || chatId === 'REPLACE_CHAT_ID') {
    console.error('Telegram chat id 未设置 (TELEGRAM_CHAT_ID)。消息未发送。');
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
      // 使用简洁的 HTML 模板，避免输出敏感字段
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
    // 格式化时间
    const formatTime = (timeStr) => {
      const date = new Date(timeStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Shanghai'
      });
    };

    // 格式化文件大小
    const formatBytes = (bytes) => {
      if (bytes === 0) return '0 B';
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 获取事件类型描述
    const getEventTypeDesc = (eventType) => {
      const eventMap = {
        'Offline': '❌ 服务器离线',
        'Online': '✅ 服务器上线',
        'Alert': '⚠️ 监控告警',
        'Renew': '⏰ 服务器已自动续费',
        'Expire': '🚨 服务到期提醒',
        'Test': '🧪 测试通知'
      };
      return eventMap[eventType] || `📊 ${eventType}`;
    };

    // 生成简洁的服务器摘要（避免输出敏感字段）
    const generateClientSummary = (client) => {
      let parts = [];
      parts.push(`<b>${client.name || 'Unknown'}</b>`);
      if (client.region) parts.push(`${client.region}`);
      return parts.join(' • ');
    };

    const title = `${getEventTypeDesc(event.event) || 'ℹ️'} Komari 通知`;
    let message = '';

    message += `时间: ${formatTime(event.time)}\n`;

    if (event.message && event.message.trim()) {
      message += `说明: ${event.message}\n`;
    }

    message += '\n';

    if (event.clients && event.clients.length > 0) {
      if (event.clients.length === 1) {
        message += generateClientSummary(event.clients[0]);
      } else {
        message += `影响服务器: ${event.clients.length} 台\n`;
        const shown = event.clients.length;
        for (let i = 0; i < shown; i++) {
          message += `${i + 1}. ${generateClientSummary(event.clients[i])}\n`;
        }
      }
    } else {
      message += '无关联服务器信息';
    }
    
    // 发送通知
    const success = await sendMessage(message, title);
    if (success) {
      console.log(`事件通知已发送: ${event.event}`);
    } else {
      console.error(`事件通知发送失败: ${event.event}`);
    }
    return success;
    
  } catch (error) {
    console.error('发送事件通知时出错:', error);
    
    // 发送简化的错误通知
    const fallbackMessage = `${event.emoji || ''} ${event.event}\n${event.message || ''}`;
    const fallbackTitle = 'Komari 通知';
    try {
      return await sendMessage(fallbackMessage, fallbackTitle);
    } catch (fallbackError) {
      console.error('备用通知也失败:', fallbackError);
      return false;
    }
  }
}


```

### Gotify 示例代码

```javascript
async function sendMessage(message, title) {
  const gotifyUrl = "https://114514.zip"; // 替换为你的 Gotify 服务器地址
  const token = "114514"; // 替换为你的应用 Token
  const priority = 5;

  if (!gotifyUrl || gotifyUrl === 'https://push.example.com') {
    console.error('Gotify URL 未设置。消息未发送。');
    return false;
  }
  if (!token || token === 'REPLACE_WITH_TOKEN') {
    console.error('Gotify App Token 未设置。消息未发送。');
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
      console.error('发送消息到 Gotify 失败:', resp.status, resp.statusText);
      return false;
    }
    return true;
  } catch (e) {
    console.error('发送消息到 Gotify 出错:', e);
    return false;
  }
}

async function sendEvent(event) {
  try {
    const formatTime = (timeStr) => {
      const date = new Date(timeStr);
      return date.toLocaleString('zh-CN', {
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
        'Offline': '❌ 服务器离线',
        'Online': '✅ 服务器上线',
        'Alert': '⚠️ 监控告警',
        'Renew': '⏰ 服务器已自动续费',
        'Expire': '🚨 服务到期提醒',
        'Test': '🧪 测试通知'
      };
      return eventMap[eventType] || `📊 ${eventType}`;
    };

    const generateClientSummary = (client) => {
      let parts = [];
      parts.push(`**${client.name || 'Unknown'}**`);
      if (client.region) parts.push(`${client.region}`);
      return parts.join(' • ');
    };

    const title = `${getEventTypeDesc(event.event) || 'ℹ️'} Komari 通知`;
    let message = '';

    message += `时间: ${formatTime(event.time)}\n`;

    if (event.message && event.message.trim()) {
      message += `说明: ${event.message}\n`;
    }

    message += '\n';

    if (event.clients && event.clients.length > 0) {
      if (event.clients.length === 1) {
        message += generateClientSummary(event.clients[0]);
      } else {
        message += `影响服务器: ${event.clients.length} 台\n`;
        const shown = event.clients.length;
        for (let i = 0; i < shown; i++) {
          message += `${i + 1}. ${generateClientSummary(event.clients[i])}\n`;
        }
      }
    } else {
      message += '无关联服务器信息';
    }
    
    const success = await sendMessage(message, title);
    if (success) {
      console.log(`事件通知已发送: ${event.event}`);
    } else {
      console.error(`事件通知发送失败: ${event.event}`);
    }
    return success;
    
  } catch (error) {
    console.error('发送事件通知时出错:', error);
    
    const fallbackMessage = `${event.emoji || ''} ${event.event}\n${event.message || ''}`;
    const fallbackTitle = 'Komari 通知';
    try {
      return await sendMessage(fallbackMessage, fallbackTitle);
    } catch (fallbackError) {
      console.error('备用通知也失败:', fallbackError);
      return false;
    }
  }
}
```
