import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/",
  title: "Komari",
  description: "Komari Monitor Document",
  head: [
    [
      'script',
      {
        async: '',
        src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2394611077475390',
        crossorigin: 'anonymous'
      }
    ]
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "主页", link: "/" },
      { text: "快速开始", link: "/install/quick-start" },
      { text: "开发指南", link: "/dev/agent" },
    ],

    sidebar: [
      {
        text: "安装",
        items: [
          { text: "快速安装", link: "/install/quick-start" },
          { text: "Docker 部署", link: "/install/docker" },
          { text: "二进制安装", link: "/install/binary" },
          { text: "手动编译", link: "/install/compile" },
          { text: "更新", link: "/install/update" },
          { text: "Agent 自动发现", link: "/install/agent-ad" },
        ],
      },
      {
        text: "开发指南",
        items: [
          { text: "主题开发", link: "/dev/theme" },
          { text: "API 接口", link: "/dev/api" },
          { text: "Agent 开发", link: "/dev/agent" },
        ],
      },
      {
        text: "常见问题",
        items: [
          { text: "重置密码", link: "/faq/chpasswd" },
          { text: "强制取消 2FA", link: "/faq/disable2fa" },
          { text: "集成 Cloudflared", link: "/faq/cloudflared" },
          { text: "卸载 Agent", link: "/faq/uninstall" },
          { text: "无 root 运行 Agent", link: "/faq/agent-no-root" },
          { text: "Nginx 反向代理", link: "/faq/nginx" },
          { text: "使用 GitHub 进行单点登录", link: "/faq/oauth-github" },
        ],
      },
      {
        text: "社区项目",
        items: [
          { text: "Agent", link: "/community/agent" },
          { text: "主题", link: "/community/theme" },
          { text: "其他", link: "/community/other" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/komari-monitor/komari" },
    ],
  },
});
