<script setup lang="ts">
const { user, logout } = useAuth()
</script>

<template>
  <header class="nav">
    <div class="nav-inner">
      <NuxtLink to="/" class="brand" aria-label="题迹首页"><AppLogo /></NuxtLink>
      <nav class="nav-links" aria-label="页面导航">
        <NuxtLink to="/#how" class="hide-sm">如何运作</NuxtLink>
        <NuxtLink to="/#features" class="hide-sm">功能</NuxtLink>
        <NuxtLink v-if="user" to="/banks">我的题库</NuxtLink>
      </nav>
      <NuxtLink v-if="!user" to="/login" class="btn btn-ghost btn-sm">登录</NuxtLink>
      <template v-else>
        <span class="nav-user">{{ user.username }}</span>
        <button type="button" class="btn btn-ghost btn-sm" @click="logout">退出</button>
      </template>
    </div>
  </header>
</template>

<style scoped>
.nav {
  position: sticky; top: 0; z-index: 40;
  background: rgba(247, 248, 247, 0.86);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.nav-inner { max-width: 1120px; margin: 0 auto; padding: 0 28px; height: 64px; display: flex; align-items: center; gap: 32px; }
.brand { text-decoration: none; }
.nav-links { display: flex; gap: 26px; margin-right: auto; min-width: 0; }
.nav-links a { color: var(--muted); text-decoration: none; font-size: 14.5px; white-space: nowrap; transition: color 0.15s ease; }
.nav-links a:hover { color: var(--ink); }
.nav-user { font-size: 14px; font-weight: 600; color: var(--ink); white-space: nowrap; }
@media (max-width: 640px) {
  .nav-inner { padding: 0 16px; height: 56px; gap: 14px; }
  .brand { font-size: 16px; }
  .nav-links { gap: 14px; }
  .nav-links a { font-size: 13.5px; }
  .hide-sm { display: none; }
  .nav-user { font-size: 13.5px; }
}
</style>
