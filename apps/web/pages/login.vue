<script setup lang="ts">
useSeoMeta({
  title: '登录 · 题迹',
  description: '登录题迹，管理你的题库与答题活动。'
})

const config = useRuntimeConfig()
const { user, ready, setAuthenticated, logout } = useAuth()
const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = '请输入用户名和密码。'
    return
  }
  loading.value = true
  try {
    const response = await $fetch<{ data: { id: string; username: string } }>(`${config.public.apiBase}/auth/${mode.value}`, {
      method: 'POST',
      credentials: 'include',
      body: { username: username.value, password: password.value }
    })
    setAuthenticated(response.data)
    await navigateTo('/banks')
  } catch (err: any) {
    error.value = err?.data?.error?.message || '请求失败，请稍后重试。'
  } finally {
    loading.value = false
  }
}

function switchMode(next: 'login' | 'register') {
  mode.value = next
  error.value = ''
}
</script>

<template>
  <div class="auth-page">
    <NuxtLink to="/" class="back">返回首页</NuxtLink>
    <div class="auth-card">
      <div class="brand-row"><AppLogo /></div>

      <template v-if="!ready" />
      <template v-else-if="user">
        <p class="logged-hint">当前已登录为 <strong>{{ user.username }}</strong>，无需再次登录。</p>
        <div class="logged-actions">
          <NuxtLink to="/banks" class="btn btn-primary btn-block">我的题库</NuxtLink>
          <NuxtLink to="/" class="btn btn-secondary btn-block">进入首页</NuxtLink>
          <button type="button" class="btn btn-ghost btn-block" @click="logout">退出登录</button>
        </div>
      </template>

      <template v-else>
        <div class="tabs" role="tablist" aria-label="登录或注册">
          <button type="button" role="tab" :aria-selected="mode === 'login'" :class="{ active: mode === 'login' }" @click="switchMode('login')">登录</button>
          <button type="button" role="tab" :aria-selected="mode === 'register'" :class="{ active: mode === 'register' }" @click="switchMode('register')">注册</button>
        </div>
        <p class="mode-hint">{{ mode === 'login' ? '欢迎回来，请输入账号信息。' : '注册后即可创建题库，注册即登录。' }}</p>

        <form @submit.prevent="submit">
          <label class="field">
            用户名
            <input v-model="username" autocomplete="username" required minlength="3" maxlength="32" />
          </label>
          <label class="field">
            密码
            <input v-model="password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required minlength="8" maxlength="128" />
          </label>
          <p v-if="error" class="error">{{ error }}</p>
          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? '提交中…' : mode === 'login' ? '登录' : '注册并登录' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100dvh; display: grid; place-items: center; padding: 24px; position: relative;
  background-image:
    linear-gradient(rgba(14, 122, 85, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 122, 85, 0.045) 1px, transparent 1px);
  background-size: 36px 36px;
}
.back { position: absolute; top: 24px; left: 28px; font-size: 14px; color: var(--muted); text-decoration: none; transition: color 0.15s ease; }
.back:hover { color: var(--ink); }
.auth-card {
  width: min(100%, 420px); background: var(--surface);
  border: 1px solid var(--line); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card); padding: 36px;
}
.brand-row { display: flex; align-items: center; margin-bottom: 26px; }
.tabs {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px;
  background: var(--surface-2); border-radius: var(--radius-md); margin-bottom: 14px;
}
.tabs button {
  height: 38px; border: 0; border-radius: 9px; background: transparent;
  font: inherit; font-size: 14px; font-weight: 600; color: var(--muted); cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.tabs button.active { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-xs); }
form { display: grid; gap: 16px; margin-top: 4px; }
.btn-block { margin-top: 6px; }
.btn-block + .btn-block { margin-top: 10px; }
.logged-hint { margin: 4px 0 22px; font-size: 15px; line-height: 1.7; color: var(--ink); }
.logged-hint strong { color: var(--accent-strong); }
.logged-actions { display: grid; }
</style>
