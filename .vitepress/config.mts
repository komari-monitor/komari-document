import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Komari",
  description: "Komari Monitor Document",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' }
    ],

    sidebar: [
      {
        text: '安装',
        items: [
          { text: 'Docker 部署', link: '/install/docker' },
          { text: '二进制安装', link: '/install/binary' },
          { text: '手动编译', link: '/install/compile' }
        ]
      },
      {
        text: '常见问题',
        items: [
          { text: '重置密码', link: '/faq/chpasswd' },
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
