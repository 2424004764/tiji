<script setup lang="ts">
useSeoMeta({
  title: '我的题库 · 题迹',
  description: '创建和管理你的题库。',
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

const statusLabels: Record<string, string> = { draft: '草稿', published: '已发布', archived: '已归档' }

async function loadBanks() {
  if (!user.value) return
  loadingList.value = true
  listError.value = ''
  try {
    const res = await $fetch<{ data: Bank[] }>(`${config.public.apiBase}/banks`, { credentials: 'include' })
    banks.value = res.data ?? []
  } catch {
    listError.value = '题库列表加载失败，请刷新重试。'
  } finally {
    loadingList.value = false
  }
}

async function createBank() {
  createError.value = ''
  createSuccess.value = ''
  if (!name.value.trim()) {
    createError.value = '请输入题库名称。'
    return
  }
  creating.value = true
  try {
    const res = await $fetch<{ data: Bank }>(`${config.public.apiBase}/banks`, {
      method: 'POST',
      credentials: 'include',
      body: { name: name.value.trim(), description: description.value.trim(), visibility: visibility.value }
    })
    createSuccess.value = `题库「${res.data?.name ?? name.value.trim()}」创建成功。点进题库即可添加题目并发布答题活动。`
    name.value = ''
    description.value = ''
    visibility.value = 'private'
    await loadBanks()
  } catch (err: any) {
    createError.value = err?.data?.error?.message || '创建失败，请稍后重试。'
  } finally {
    creating.value = false
  }
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return value
  }
}

watch(user, (u) => { if (u) loadBanks() }, { immediate: true })
</script>

<template>
  <div class="page">
    <AppHeader />

    <main class="container main">
      <template v-if="ready && !user">
        <div class="panel notice-panel">
          <h1 class="page-title">请先登录</h1>
          <p class="hint">登录后即可创建题库、添加题目并发布答题活动。</p>
          <NuxtLink to="/login" class="btn btn-primary">前往登录</NuxtLink>
        </div>
      </template>

      <template v-else>
        <header class="page-head">
          <div>
            <h1 class="page-title">我的题库</h1>
            <p class="page-sub">共 {{ banks.length }} 个题库 · {{ banks.reduce((n, b) => n + (b.question_count ?? 0), 0) }} 道题</p>
          </div>
        </header>

        <div class="grid">
          <section class="panel">
            <h2 class="panel-title">创建题库</h2>
            <form @submit.prevent="createBank">
              <div class="fields">
                <label class="field">
                  题库名称
                  <input v-model="name" required maxlength="100" placeholder="例如：八年级物理·力学单元" />
                </label>
                <label class="field">
                  描述（可选）
                  <textarea v-model="description" maxlength="500" rows="3" placeholder="简要说明这个题库的用途" />
                </label>
                <label class="field">
                  可见性
                  <select v-model="visibility">
                    <option value="private">私密（仅自己可见）</option>
                    <option value="public">公开（可被分享访问）</option>
                  </select>
                </label>
              </div>
              <p v-if="createError" class="error">{{ createError }}</p>
              <p v-if="createSuccess" class="success">{{ createSuccess }}</p>
              <button type="submit" class="btn btn-primary btn-block" :disabled="creating">
                {{ creating ? '创建中…' : '创建题库' }}
              </button>
            </form>
          </section>

          <section class="panel">
            <h2 class="panel-title">全部题库<span v-if="banks.length" class="count-chip">{{ banks.length }}</span></h2>
            <p v-if="loadingList" class="hint">加载中…</p>
            <p v-else-if="listError" class="error">{{ listError }}</p>
            <div v-else-if="!banks.length" class="empty">
              <p class="empty-title">还没有题库</p>
              <p class="hint">创建第一个题库，添加几道题，就能发布答题活动分享给好友。</p>
            </div>
            <ul v-else class="bank-list">
              <li v-for="bank in banks" :key="bank.id">
                <NuxtLink :to="`/banks/${bank.id}`" class="bank-link">
                  <div class="bank-info">
                    <span class="bank-name">{{ bank.name }}</span>
                    <span v-if="bank.description" class="bank-desc">{{ bank.description }}</span>
                    <span class="bank-meta">{{ bank.question_count ?? 0 }} 道题 · 更新于 {{ formatDate(bank.updated_at) }}</span>
                  </div>
                  <span class="bank-side">
                    <span class="badge" :class="`is-${bank.status}`">{{ statusLabels[bank.status] ?? bank.status }}</span>
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
