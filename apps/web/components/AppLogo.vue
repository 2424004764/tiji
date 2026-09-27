<script setup lang="ts">
/**
 * 全站 Logo 组件：导航、登录页、答题页共用。
 *
 * 换成自己的图片 Logo：
 *   1. 把图片文件放到 apps/web/public/ 下（例如 /logo.png 或 /logo.svg）
 *   2. 把下面 logoSrc 改为 '/logo.png'
 * 恢复默认绿色方块标记：把 logoSrc 改回 ''
 */
const logoSrc = ''

withDefaults(defineProps<{ text?: boolean }>(), { text: true })
</script>

<template>
  <span class="logo">
    <img v-if="logoSrc" :src="logoSrc" alt="题迹" class="logo-img" />
    <span v-else class="logo-mark" aria-hidden="true" />
    <span v-if="text" class="logo-text">题迹</span>
  </span>
</template>

<style scoped>
.logo { display: inline-flex; align-items: center; gap: 9px; }
.logo-img { width: 26px; height: 26px; object-fit: contain; display: block; }
.logo-mark { width: 11px; height: 11px; border-radius: 3px; background: var(--accent); flex-shrink: 0; }
.logo-text { font-size: 17px; font-weight: 700; color: var(--ink); white-space: nowrap; }
</style>
