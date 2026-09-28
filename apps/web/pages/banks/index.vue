<script setup lang="ts">
import type { MessageKey } from '@tiji/i18n'

const { t, apiError, formatDate } = useI18n()

useSeoMeta({
  title: () => t('banks.seo.title'),
  description: () => t('banks.seo.description'),
  robots: 'noindex, nofollow'
})

interface Bank {
  id: string
  name: string
  description: string
  visibility: string
  status: string
  question_count?: number
  updated_at: string
}

const config = useRuntimeConfig()
const { user, ready } = useAuth()

const banks = ref<Bank[]>([])
const loadingList = ref(false)
const listError = ref('')
const name = ref('')
const description = ref('')
const visibility = ref<'private' | 'public'>('private')
const creating = ref(false)
const createError = ref('')
const createSuccess = ref('')

function statusLabel(status: string) {
  const map: Record<string, MessageKey> = { draft: 'banks.status.draft', published: 'banks.status.published', archived: 'banks.status.archived' }
  return map[status] ? t(map[status]) : status
}

async function loadBanks() {
  if (!user.value) return
  loadingList.value = true
  listError.value = ''
  try {
    const res = await $fetch<{ data: Bank[] }>(`${config.public.apiBase}/banks`, { credentials: 'include' })
    banks.value = res.data ?? []
  } catch (err: any) {
    listError.value = apiError(err, 'banks.list.error')
  } finally {
    loadingList.value = false
  }
}

async function createBank() {
  createError.value = ''
  createSuccess.value = ''
  if (!name.value.trim()) {
    createError.value = t('banks.create.missingName')
    return
  }
  creating.value = true
  try {
    const res = await $fetch<{ data: Bank }>(`${config.public.apiBase}/banks`, {
      method: 'POST',
      credentials: 'include',
      body: { name: name.value.trim(), description: description.value.trim(), visibility: visibility.value }
    })
    createSuccess.value = t('banks.create.success', { name: res.data?.name ?? name.value.trim() })
    name.value = ''
    description.value = ''
    visibility.value = 'private'
    await loadBanks()
  } catch (err: any) {
    createError.value = apiError(err, 'common.requestFailed')
  } finally {
    creating.value = false
  }
}

const totalQuestions = computed(() => banks.value.reduce((n, b) => n + (b.question_count ?? 0), 0))

watch(user, (u) => { if (u) loadBanks() }, { immediate: true })
</script>

<template>
  <div class="page">
    <AppHeader />

    <main class="container main">
      <template v-if="ready && !user">
        <div class="panel notice-panel">
          <h1 class="page-title">{{ t('common.needLoginTitle') }}</h1>
          <p class="hint">{{ t('banks.needLoginDesc') }}</p>
          <NuxtLink to="/login" class="btn btn-primary">{{ t('common.goLogin') }}</NuxtLink>
        </div>
      </template>

      <template v-else>
        <header class="page-head">
          <div>
            <h1 class="page-title">{{ t('banks.title') }}</h1>
            <p class="page-sub">{{ t('banks.summary', { banks: banks.length, questions: t('common.questionCount', { n: totalQuestions }) }) }}</p>
          </div>
        </header>

        <div class="grid">
          <section class="panel">
            <h2 class="panel-title">{{ t('banks.create.title') }}</h2>
            <form @submit.prevent="createBank">
              <div class="fields">
                <label class="field">
                  {{ t('banks.create.name') }}
                  <input v-model="name" required maxlength="100" :placeholder="t('banks.create.namePlaceholder')" />
                </label>
                <label class="field">
                  {{ t('banks.create.description') }}
                  <textarea v-model="description" maxlength="500" rows="3" :placeholder="t('banks.create.descriptionPlaceholder')" />
                </label>
                <label class="field">
                  {{ t('banks.create.visibility') }}
                  <select v-model="visibility">
                    <option value="private">{{ t('banks.create.visPrivate') }}</option>
                    <option value="public">{{ t('banks.create.visPublic') }}</option>
                  </select>
                </label>
              </div>
              <p v-if="createError" class="error">{{ createError }}</p>
              <p v-if="createSuccess" class="success">{{ createSuccess }}</p>
              <button type="submit" class="btn btn-primary btn-block" :disabled="creating">
                {{ creating ? t('banks.create.creating') : t('banks.create.submit') }}
              </button>
            </form>
          </section>

          <section class="panel">
            <h2 class="panel-title">{{ t('banks.list.title') }}<span v-if="banks.length" class="count-chip">{{ banks.length }}</span></h2>
            <p v-if="loadingList" class="hint">{{ t('common.loading') }}</p>
            <p v-else-if="listError" class="error">{{ listError }}</p>
            <div v-else-if="!banks.length" class="empty">
              <p class="empty-title">{{ t('banks.list.emptyTitle') }}</p>
              <p class="hint">{{ t('banks.list.emptyDesc') }}</p>
            </div>
            <ul v-else class="bank-list">
              <li v-for="bank in banks" :key="bank.id">
                <NuxtLink :to="`/banks/${bank.id}`" class="bank-link">
                  <div class="bank-info">
                    <span class="bank-name">{{ bank.name }}</span>
                    <span v-if="bank.description" class="bank-desc">{{ bank.description }}</span>
                    <span class="bank-meta">{{ t('banks.list.meta', { questions: t('common.questionCount', { n: bank.question_count ?? 0 }), date: formatDate(bank.updated_at) }) }}</span>
                  </div>
                  <span class="bank-side">
                    <span class="badge" :class="`is-${bank.status}`">{{ statusLabel(bank.status) }}</span>
                    <span class="bank-arrow" aria-hidden="true">→</span>
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </section>
        </div>
      </template>
    </main>
  </div>
</template>

<style scoped>
.main { padding: 48px 28px 96px; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 20px; align-items: start; }
.notice-panel { max-width: 480px; }
.notice-panel .page-title { margin-bottom: 12px; }
.notice-panel .hint { display: block; margin-bottom: 22px; }
.notice-panel .btn { margin-top: 4px; }
.fields { display: grid; gap: 16px; margin-bottom: 18px; }
form .error, form .success { margin-bottom: 14px; }
.count-chip {
  display: inline-block; margin-left: 8px; padding: 2px 9px; border-radius: 999px;
  background: var(--accent-soft); color: var(--accent-strong);
  font-family: var(--mono); font-size: 12.5px; font-weight: 600; vertical-align: 2px;
}
.empty { padding: 26px 8px; text-align: center; }
.empty-title { margin: 0 0 6px; font-size: 15px; font-weight: 600; }
.empty .hint { font-size: 13.5px; }
.bank-list { list-style: none; margin: 0; padding: 0; }
.bank-list li + li { border-top: 1px solid var(--line); }
.bank-link {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 13px 12px; margin: 0 -12px; border-radius: var(--radius-md);
  text-decoration: none; color: inherit;
  transition: background 0.15s ease;
}
.bank-link:hover { background: var(--accent-soft); }
.bank-info { display: grid; gap: 3px; min-width: 0; }
.bank-name { font-size: 15.5px; font-weight: 600; transition: color 0.15s ease; }
.bank-link:hover .bank-name { color: var(--accent-strong); }
.bank-desc { font-size: 13.5px; color: var(--muted); line-height: 1.6; }
.bank-meta { font-family: var(--mono); font-size: 12px; color: var(--muted-2); }
.bank-side { display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; }
.bank-arrow { color: var(--muted-2); font-size: 15px; transition: transform 0.15s ease, color 0.15s ease; }
.bank-link:hover .bank-arrow { transform: translateX(3px); color: var(--accent-strong); }
@media (max-width: 900px) {
  .grid { grid-template-columns: 1fr; }
  .main { padding: 32px 20px 72px; }
  .container { padding: 0 20px; }
}
</style>
