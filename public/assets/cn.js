/*
    判断是否为中国大陆用户,通过底部悬浮窗提示跳转到镜像站
*/
;(function () {
  try {
    fetch('https://www.visa.cn/cdn-cgi/trace')
      .then(function(response) {
        return response.text()
      })
      .then(function(data) {
        var lines = data.split('\n')
        var traceData = {}
        lines.forEach(function(line) {
          var parts = line.split('=')
          if (parts.length === 2) {
            traceData[parts[0]] = parts[1]
          }
        })

        var loc = traceData.loc || ''
        var ip = traceData.ip || ''

        // 排除已知的镜像站域名
        var isMirrorSite = location.href.includes('www.komari.wiki') || 
                           location.href.includes('ghpages.komari.wiki')

        if (loc === 'CN' && !isMirrorSite) {
          showNotification(ip, loc)
        }
      })
      .catch(function(error) {
        console.error('Error fetching location:', error)
      })

    function showNotification(ip, loc) {
      var notification = document.createElement('div')
      notification.style.cssText = [
        'position: fixed',
        'bottom: 20px',
        'left: 50%',
        'transform: translateX(-50%)',
        'max-width: 500px',
        'padding: 16px 20px',
        'background: var(--vp-c-bg-soft, #f6f6f7)',
        'border: 1px solid var(--vp-c-divider, rgba(60, 60, 67, 0.12))',
        'border-radius: 8px',
        'box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.08)',
        'z-index: 9999',
        'display: flex',
        'align-items: center',
        'gap: 12px',
        'font-family: var(--vp-font-family-base, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
        'font-size: 14px',
        'color: var(--vp-c-text-1, #213547)',
        'animation: slideUp 0.3s ease-out'
      ].join(';')

      var style = document.createElement('style')
      style.textContent = `
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
        }
        @media (prefers-color-scheme: dark) {
          .cn-notification {
            background: var(--vp-c-bg-soft, #202127) !important;
            border-color: var(--vp-c-divider, rgba(84, 84, 88, 0.48)) !important;
            color: var(--vp-c-text-1, rgba(255, 255, 245, 0.86)) !important;
          }
        }
        .cn-notification-link {
          color: var(--vp-c-brand-1, #3451b2);
          text-decoration: none;
          font-weight: 500;
          margin-left: 8px;
          transition: color 0.2s;
          white-space: nowrap;
        }
        .cn-notification-link:hover {
          color: var(--vp-c-brand-2, #5672cd);
        }
        .cn-notification-close {
          margin-left: auto;
          cursor: pointer;
          padding: 4px 8px;
          color: var(--vp-c-text-2, rgba(60, 60, 67, 0.78));
          background: none;
          border: none;
          border-radius: 4px;
          font-size: 18px;
          line-height: 1;
          transition: background-color 0.2s;
        }
        .cn-notification-close:hover {
          background: var(--vp-c-default-soft, rgba(60, 60, 67, 0.05));
        }
      `
      document.head.appendChild(style)

      notification.className = 'cn-notification'
      notification.innerHTML = [
        '<span>📍 嗨，来自中国大陆的朋友！我们为您准备了专属的镜像站（由 @Geekertao 维护），让您的访问体验更流畅。</span>',
        '<a href="https://www.komari.wiki' + location.pathname + location.search + location.hash + '" class="cn-notification-link">带我去看看 →</a>',
        '<button class="cn-notification-close" aria-label="关闭">×</button>'
      ].join('')

      document.body.appendChild(notification)

      var closeBtn = notification.querySelector('.cn-notification-close')
      closeBtn.addEventListener('click', function() {
        closeNotification()
      })

      // 15秒后自动关闭
      var timer = setTimeout(closeNotification, 15000)

      function closeNotification() {
        clearTimeout(timer)
        notification.style.animation = 'slideDown 0.3s ease-out'
        setTimeout(function() {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification)
          }
        }, 300)
      }
    }
  } catch (e) {
    console.error('Error checking for CN user:', e)
  }
})()
