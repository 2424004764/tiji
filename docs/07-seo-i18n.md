# SEO 与国际化

## 语言

首期 `zh-CN`、`en-US`。语言优先级：URL 前缀 -> 用户设置 -> `Accept-Language` -> 默认 `zh-CN`。文案 key 使用领域命名，例如 `activity.start`；禁止在组件中硬编码用户可见文案。日期、数字和分数使用 `Intl` 按 locale 格式化。

## SEO

Nuxt 页面为每个语言生成唯一 `title`、`description`、`canonical`、`hreflang`、Open Graph 和 Twitter Card。生成 `sitemap.xml`、`robots.txt`，公开题库详情使用 JSON-LD `Quiz`/`LearningResource`（仅输出公开内容）。站点首页和帮助页可索引；一次性分享答题页、答题结果页和用户工作台使用 `noindex,nofollow`。

公开活动页面必须避免把答题者输入显示名、答案、解析或统计私密数据放入 HTML 初始 payload。分享 URL 使用规范化 token，不在页面 title 中暴露内部 ID。

## 降级方案

若未来只部署 uni-app H5，则为公开页面提供静态预渲染和运行时 meta/OG，并保留 sitemap；这不能等同 Nuxt SSR，搜索收录效果需要单独监测。
