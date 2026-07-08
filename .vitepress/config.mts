import { defineConfig } from "vitepress";

const isProduction = process.env.NODE_ENV === "production";

const productionHead = [
  [
    "script",
    {
      async: "",
      src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2394611077475390",
      crossorigin: "anonymous",
    },
  ],
  [
    "script",
    {
      async: "",
      src: "/assets/cn.js",
      crossorigin: "anonymous",
    },
  ],
];

const sharedHead = [
  [
    "link",
    {
      rel: "icon",
      type: "image/png",
      href: "/assets/favicon.png",
    },
  ],
  ...(isProduction ? productionHead : []),
];

const zhNav = [
  { text: "主页", link: "/" },
  { text: "快速开始", link: "/install/quick-start" },
  { text: "开发指南", link: "/dev/agent" },
  { text: "社区", link: "/community/agent" },
];

const enNav = [
  { text: "Home", link: "/en/" },
  { text: "Quick Start", link: "/en/install/quick-start" },
  { text: "Developer Guide", link: "/en/dev/agent" },
  { text: "Community", link: "/en/community/agent" },
];

const zhSidebar = [
  {
    text: "安装",
    items: [
      { text: "快速安装", link: "/install/quick-start" },
      { text: "Docker 部署", link: "/install/docker" },
      { text: "二进制安装", link: "/install/binary" },
      { text: "手动编译", link: "/install/compile" },
      { text: "1Panel 部署", link: "/install/1panel" },
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
      { text: "RPC 接口", link: "/dev/rpc" },
      { text: "本地开发", link: "/dev/local" },
    ],
  },
  {
    text: "常见问题",
    items: [
      { text: "重置密码", link: "/faq/chpasswd" },
      { text: "强制取消 2FA", link: "/faq/disable2fa" },
      { text: "强制允许密码登录", link: "/faq/permit-login" },
      { text: "卸载 Agent", link: "/faq/uninstall" },
      { text: "无 root 运行 Agent", link: "/faq/agent-no-root" },
      { text: "通过 HTTP 接口上报信息", link: "/faq/upload-via-http" },
      { text: "Nginx 反向代理", link: "/faq/nginx" },
      { text: "其他常见问题", link: "/faq/faq" },
    ],
  },
  {
    text: "配置指南",
    items: [{ text: "通知模板", link: "/faq/notification-template" }],
  },
  {
    text: "社区文档",
    items: [
      { text: "使用 GitHub 进行单点登录", link: "/faq/oauth-github" },
      {
        text: "使用 Cloudflare Access 登录",
        link: "/community/cloudflare_access",
      },
      { text: "将节点 IP 同步到 Git", link: "/community/git-sync" },
      { text: "利用 Gmail 发送通知", link: "/community/smtp_gmail" },
      { text: "NAS 中运行 Agent", link: "/faq/agent-nas" },
      { text: "Mikrotik 路由器接入探针", link: "/faq/agent-mikrotik" },
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
];

const enSidebar = [
  {
    text: "Install",
    items: [
      { text: "Quick Start", link: "/en/install/quick-start" },
      { text: "Docker", link: "/en/install/docker" },
      { text: "Binary", link: "/en/install/binary" },
      { text: "Build from Source", link: "/en/install/compile" },
      { text: "1Panel", link: "/en/install/1panel" },
      { text: "Update", link: "/en/install/update" },
      { text: "Agent Auto Discovery", link: "/en/install/agent-ad" },
    ],
  },
  {
    text: "Developer Guide",
    items: [
      { text: "Theme Development", link: "/en/dev/theme" },
      { text: "API", link: "/en/dev/api" },
      { text: "Agent Development", link: "/en/dev/agent" },
      { text: "RPC", link: "/en/dev/rpc" },
      { text: "Local Development", link: "/en/dev/local" },
    ],
  },
  {
    text: "FAQ",
    items: [
      { text: "Reset Password", link: "/en/faq/chpasswd" },
      { text: "Disable 2FA", link: "/en/faq/disable2fa" },
      { text: "Allow Password Login", link: "/en/faq/permit-login" },
      { text: "Uninstall Agent", link: "/en/faq/uninstall" },
      { text: "Run Agent without Root", link: "/en/faq/agent-no-root" },
      { text: "Upload via HTTP", link: "/en/faq/upload-via-http" },
      { text: "Nginx Reverse Proxy", link: "/en/faq/nginx" },
      { text: "General FAQ", link: "/en/faq/faq" },
    ],
  },
  {
    text: "Configuration",
    items: [
      { text: "Notification Templates", link: "/en/faq/notification-template" },
    ],
  },
  {
    text: "Community Guides",
    items: [
      { text: "GitHub OAuth Login", link: "/en/faq/oauth-github" },
      {
        text: "Cloudflare Access Login",
        link: "/en/community/cloudflare_access",
      },
      { text: "Sync Node IPs to Git", link: "/en/community/git-sync" },
      {
        text: "Send Notifications with Gmail",
        link: "/en/community/smtp_gmail",
      },
      { text: "Run Agent on NAS", link: "/en/faq/agent-nas" },
      { text: "Mikrotik Agent", link: "/en/faq/agent-mikrotik" },
    ],
  },
  {
    text: "Community Projects",
    items: [
      { text: "Agents", link: "/en/community/agent" },
      { text: "Themes", link: "/en/community/theme" },
      { text: "Other Projects", link: "/en/community/other" },
    ],
  },
];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: "/",
  title: "Komari",
  description: "Komari Monitor Documentation",
  head: sharedHead,
  cleanUrls: true,
  lastUpdated: true,
  markdown: {
    image: {
      lazyLoading: true,
    },
  },
  sitemap: {
    hostname: "https://komari-document.pages.dev",
  },
  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN",
      title: "Komari",
      description: "Komari Monitor 文档",
      themeConfig: {
        nav: zhNav,
        sidebar: zhSidebar,
        outline: {
          label: "本页目录",
        },
        docFooter: {
          prev: "上一页",
          next: "下一页",
        },
        lastUpdated: {
          text: "最后更新",
        },
        editLink: {
          pattern:
            "https://github.com/komari-monitor/komari-document/edit/main/:path",
          text: "在 GitHub 上编辑此页",
        },
      },
    },
    en: {
      label: "English",
      lang: "en-US",
      title: "Komari",
      description: "Documentation for Komari Monitor",
      themeConfig: {
        nav: enNav,
        sidebar: enSidebar,
        outline: {
          label: "On This Page",
        },
        docFooter: {
          prev: "Previous page",
          next: "Next page",
        },
        lastUpdated: {
          text: "Last updated",
        },
        editLink: {
          pattern:
            "https://github.com/komari-monitor/komari-document/edit/main/:path",
          text: "Edit this page on GitHub",
        },
      },
    },
  },
  themeConfig: {
    logo: "/assets/favicon.png",
    siteTitle: "Komari",
    search: {
      provider: "local",
      options: {
        locales: {
          root: {
            translations: {
              button: {
                buttonText: "搜索文档",
                buttonAriaLabel: "搜索文档",
              },
              modal: {
                displayDetails: "显示详细列表",
                resetButtonTitle: "清除查询",
                backButtonTitle: "关闭搜索",
                noResultsText: "无法找到相关结果",
                footer: {
                  selectText: "选择",
                  navigateText: "切换",
                  closeText: "关闭",
                },
              },
            },
          },
          en: {
            translations: {
              button: {
                buttonText: "Search docs",
                buttonAriaLabel: "Search docs",
              },
              modal: {
                displayDetails: "Display detailed list",
                resetButtonTitle: "Reset search",
                backButtonTitle: "Close search",
                noResultsText: "No results for",
                footer: {
                  selectText: "to select",
                  navigateText: "to navigate",
                  closeText: "to close",
                },
              },
            },
          },
        },
      },
    },
    footer: {
      message: "Released under the MIT license.",
      copyright: "Copyright 2025-present Komari Monitor",
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/komari-monitor/komari" },
    ],
  },
});
