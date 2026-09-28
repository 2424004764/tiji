<script setup lang="ts">
const { locale, t } = useI18n()

// html lang 与默认 SEO meta 随语言切换；各页面用 useSeoMeta 覆盖 title/description
useHead({
  htmlAttrs: { lang: () => locale.value },
  title: () => t('common.defaultTitle'),
  meta: [
    { name: 'description', content: () => t('common.defaultDescription') },
    { property: 'og:locale', content: () => (locale.value === 'zh-CN' ? 'zh_CN' : 'en_US') },
    { property: 'og:locale:alternate', content: () => (locale.value === 'zh-CN' ? 'en_US' : 'zh_CN') }
  ]
})
</script>

<template><NuxtPage /></template>
