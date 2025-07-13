import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/komari-document",
  title: "Komari",
  description: "Komari Monitor Document",
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
        ],
      },
      {
        text: "开发指南",
        items: [
          { text: "Agent 开发", link: "/dev/agent" },
        ],
      },
      {
        text: "常见问题",
        items: [
          { text: "重置密码", link: "/faq/chpasswd" },
          { text: "强制取消2FA", link: "/faq/disable2fa" },
          { text: "集成Cloudflared", link: "/faq/cloudflared" },
          { text: "卸载Agent", link: "/faq/uninstall" },
          { text: "无root运行Agent", link: "/faq/agent-no-root" },
        ],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/komari-monitor/komari" },
    ],
  },
});
