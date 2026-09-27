export default defineNuxtConfig({
  ssr: true,
  compatibilityDate: '2026-09-14',
  css: ['~/assets/css/main.css'],
  devtools: { enabled: false },
  runtimeConfig: { public: { apiBase: 'http://localhost:8799/api/v1' } },
  // 题库详情页 /banks/[id]：题目管理与分类标签
  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: '题迹｜创建、分享与复习题目',
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [{ name: 'description', content: '题迹是一个轻量的刷题、题库和答题反馈平台。' }]
    }
  }
})
