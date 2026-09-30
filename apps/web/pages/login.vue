<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => t('login.seo.title'),
  description: () => t('login.seo.description')
})

const config = useRuntimeConfig()
const route = useRoute()
const { user, ready, setAuthenticated, logout } = useAuth()
const { apiError } = useI18n()
const mode = ref<'login' | 'register'>('login')
const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

// 工具站 OAuth2 登录：入口是否可用由 API 配置决定（client_id/secret 未配置则隐藏）
const oauthEnabled = ref(false)
const oauthErrorCodes = ['access_denied', 'invalid_state', 'token_exchange', 'userinfo_failed', 'account_disabled', 'not_configured', 'failed'] as const
const oauthError = computed(() => {
  const code = route.query.oauth_error
  return typeof code === 'string' && (oauthErrorCodes as readonly string[]).includes(code)
    ? t(`login.oauth.errors.${code}` as Parameters<typeof t>[0])
    : ''
})
const oauthStartUrl = computed(() => `${config.public.apiBase}/auth/oauth/start?redirect=/banks`)
onMounted(() => {
  $fetch<{ data: { enabled: boolean } }>(`${config.public.apiBase}/auth/oauth/status`)
    .then((res) => { oauthEnabled.value = !!res.data?.enabled })
    .catch(() => { /* 拉取失败时隐藏工具箱入口 */ })
})

async function submit() {
  error.value = ''
  if (!username.value || !password.value) {
    error.value = t('login.missing')
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
    error.value = apiError(err, 'common.requestFailed')
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
    <NuxtLink to="/" class="back">{{ t('common.backHome') }}</NuxtLink>
    <LocaleSwitch class="page-locale" />
    <div class="auth-card">
      <div class="brand-row"><AppLogo /></div>

      <template v-if="!ready" />
      <template v-else-if="user">
        <p class="logged-hint">{{ t('login.loggedHint', { name: user.username }) }}</p>
        <div class="logged-actions">
          <NuxtLink to="/banks" class="btn btn-primary btn-block">{{ t('login.goBanks') }}</NuxtLink>
          <NuxtLink to="/" class="btn btn-secondary btn-block">{{ t('login.goHome') }}</NuxtLink>
          <button type="button" class="btn btn-ghost btn-block" @click="logout">{{ t('login.logout') }}</button>
        </div>
      </template>

      <template v-else>
        <p v-if="oauthError" class="error oauth-error">{{ oauthError }}</p>
        <div class="tabs" role="tablist" :aria-label="t('login.tabsAria')">
          <button type="button" role="tab" :aria-selected="mode === 'login'" :class="{ active: mode === 'login' }" @click="switchMode('login')">{{ t('login.tabLogin') }}</button>
          <button type="button" role="tab" :aria-selected="mode === 'register'" :class="{ active: mode === 'register' }" @click="switchMode('register')">{{ t('login.tabRegister') }}</button>
        </div>
        <p class="mode-hint">{{ mode === 'login' ? t('login.hintLogin') : t('login.hintRegister') }}</p>

        <form @submit.prevent="submit">
          <label class="field">
            {{ t('login.username') }}
            <input v-model="username" autocomplete="username" required minlength="3" maxlength="32" />
          </label>
          <label class="field">
            {{ t('login.password') }}
            <input v-model="password" type="password" :autocomplete="mode === 'login' ? 'current-password' : 'new-password'" required minlength="8" maxlength="128" />
          </label>
          <p v-if="error" class="error">{{ error }}</p>
          <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
            {{ loading ? t('login.submitting') : mode === 'login' ? t('login.submitLogin') : t('login.submitRegister') }}
          </button>
        </form>

        <template v-if="oauthEnabled">
          <div class="oauth-divider"><span>{{ t('login.oauth.divider') }}</span></div>
          <a class="btn btn-secondary btn-block" :href="oauthStartUrl">{{ t('login.oauth.button') }}</a>
        </template>
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
.page-locale { position: absolute; top: 22px; right: 28px; }
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
.oauth-error { margin: 0 0 14px; }
.oauth-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0 4px; color: var(--muted); font-size: 13px; }
.oauth-divider::before, .oauth-divider::after { content: ''; flex: 1; height: 1px; background: var(--line); }
.logged-hint { margin: 4px 0 22px; font-size: 15px; line-height: 1.7; color: var(--ink); }
.logged-actions { display: grid; }
@media (max-width: 640px) {
  .back { top: 18px; left: 20px; }
  .page-locale { top: 16px; right: 16px; }
}
</style>
