export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2026-09-14',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  // apiBase 的值按环境来自 .env.development / .env.production
  runtimeConfig: { public: { apiBase: '' } },
  // 共享文案来自 workspace 源码包，需要转译
  build: { transpile: ['@tiji/i18n'] },
  // 题库详情页 /banks/[id]：题目管理与分类标签
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },
  nitro: { preset: 'cloudflare_pages' }
})
