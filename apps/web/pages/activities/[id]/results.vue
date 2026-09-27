<script setup lang="ts">
useSeoMeta({
  title: '答题情况 · 题迹',
  robots: 'noindex, nofollow'
})

interface ActivityInfo {
  id: string
  title: string
  status: string
  bank_id: string
  question_count: number
}
interface Respondent {
  id: string
  display_name: string
  started_at: string
  status: string | null
  score: number | null
  total_points: number | null
  duration_seconds: number | null
  submitted_at: string | null
}
interface ResultQuestion {
  id: string
  position: number
  stem: string
  type: 'single_choice' | 'multiple_choice' | 'true_false'
  options: Array<{ value: string; label: string }>
  correctAnswer: string | string[] | null
  givenAnswer: string | string[] | null
  isCorrect: boolean | null
  explanation: string
}
interface RespondentDetail {
  respondent: { id: string; displayName: string; status: string | null; score: number | null; totalPoints: number | null; durationSeconds: number | null; submittedAt: string | null }
  questions: ResultQuestion[]
}

const route = useRoute()
const config = useRuntimeConfig()
const activityId = computed(() => String(route.params.id))

const { ready, user } = useAuth()
const activity = ref<ActivityInfo | null>(null)
const summary = ref<{ total: number; submitted: number; average_score: number | null } | null>(null)
const respondents = ref<Respondent[]>([])
const loading = ref(true)
const loadError = ref('')
const detail = ref<RespondentDetail | null>(null)
const detailLoading = ref(false)
const selectedId = ref('')

const statusLabels: Record<string, string> = { draft: '草稿', published: '进行中', paused: '已暂停', ended: '已结束', submitted: '已提交', in_progress: '答题中' }

async function loadAll() {
  loading.value = true
  loadError.value = ''
  try {
    const headers = { credentials: 'include' } as const
    const [act, sum, resp] = await Promise.all([
      $fetch<{ data: ActivityInfo }>(`${config.public.apiBase}/activities/${activityId.value}`, headers),
      $fetch<{ data: { total: number; submitted: number; average_score: number | null } }>(`${config.public.apiBase}/activities/${activityId.value}/results/summary`, headers),
      $fetch<{ data: Respondent[] }>(`${config.public.apiBase}/activities/${activityId.value}/results/respondents`, headers)
    ])
    activity.value = act.data
    summary.value = sum.data
    respondents.value = resp.data ?? []
  } catch (err: any) {
    loadError.value = err?.data?.error?.code === 'AUTH_REQUIRED' ? '请先登录。' : '答题情况加载失败，请刷新重试。'
  } finally {
    loading.value = false
  }
}

async function openDetail(r: Respondent) {
  selectedId.value = r.id
  detail.value = null
  detailLoading.value = true
  try {
    const res = await $fetch<{ data: RespondentDetail }>(`${config.public.apiBase}/activities/${activityId.value}/results/respondents/${r.id}`, { credentials: 'include' })
    detail.value = res.data
  } catch {
    detail.value = null
  } finally {
    detailLoading.value = false
  }
}

function formatTime(value: string | null) {
  if (!value) return ''
  try { return new Date(value).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) } catch { return value }
}

function formatDuration(seconds: number | null) {
  if (seconds === null || seconds === undefined) return ''
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} 分 ${s} 秒` : `${s} 秒`
}

const typeLabels: Record<string, string> = { single_choice: '单选', multiple_choice: '多选', true_false: '判断' }

function answerLabel(q: ResultQuestion, value: string | string[] | null) {
  if (value === null || value === undefined || (Array.isArray(value) && !value.length)) return '未作答'
  const label = (v: string) => q.type === 'true_false' ? (v === 'true' ? '正确' : '错误') : (q.options.find((o) => o.value === v)?.label ?? v)
  if (Array.isArray(value)) return value.map(label).join('、')
  return String(value)
}

onMounted(loadAll)
</script>

<template>
  <div class="page">
    <AppHeader />

    <main class="container main">
      <template v-if="ready && !user">
        <div class="panel notice-panel">
          <h1>请先登录</h1>
          <p>登录后即可查看自己活动的答题情况。</p>
          <NuxtLink to="/login" class="btn btn-primary">前往登录</NuxtLink>
        </div>
      </template>

      <template v-else-if="loading" />
      <template v-else-if="loadError">
        <div class="panel notice-panel">
          <h1>无法打开</h1>
          <p>{{ loadError }}</p>
          <NuxtLink to="/banks" class="btn btn-primary">返回我的题库</NuxtLink>
        </div>
      </template>

      <template v-else-if="activity">
        <div class="head">
          <div>
            <NuxtLink :to="`/banks/${activity.bank_id}`" class="back-link">返回题库</NuxtLink>
            <h1 class="title">{{ activity.title }}</h1>
            <p class="sub">共 {{ activity.question_count }} 道题 · <span :class="`act-status is-${activity.status}`">{{ statusLabels[activity.status] ?? activity.status }}</span></p>
          </div>
        </div>

        <div class="stats">
          <div class="stat"><span class="stat-num">{{ respondents.length }}</span><span class="stat-label">参与人数</span></div>
          <div class="stat"><span class="stat-num">{{ summary?.submitted ?? 0 }}</span><span class="stat-label">已提交</span></div>
          <div class="stat">
            <span class="stat-num">{{ summary?.average_score === null || summary?.average_score === undefined ? '—' : Number(summary.average_score).toFixed(1) }}</span>
            <span class="stat-label">平均得分</span>
          </div>
        </div>

        <section class="panel">
          <h2 class="panel-title">答题名单</h2>
          <p v-if="!respondents.length" class="hint">还没有人参与。把分享链接发给好友后，这里会列出每一位答题者。</p>
          <ul v-else class="resp-list">
            <li v-for="r in respondents" :key="r.id">
              <button type="button" class="resp-row" :class="{ selected: selectedId === r.id }" @click="openDetail(r)">
                <span class="resp-side">
                  <span class="resp-avatar" aria-hidden="true">{{ r.display_name.slice(0, 1) }}</span>
                  <span class="resp-name">{{ r.display_name }}</span>
                </span>
                <span class="resp-meta">
                  <span class="badge" :class="r.status === 'submitted' ? 'is-public' : 'is-draft'">{{ statusLabels[r.status ?? ''] ?? '答题中' }}</span>
                  <span v-if="r.score !== null" class="resp-score">{{ r.score }} / {{ r.total_points }}</span>
                  <span v-if="r.submitted_at" class="resp-time">{{ formatTime(r.submitted_at) }}</span>
                </span>
              </button>
            </li>
          </ul>
        </section>

        <section v-if="selectedId" class="panel">
          <h2 class="panel-title">作答详情</h2>
          <p v-if="detailLoading" class="hint">加载中…</p>
          <template v-else-if="detail">
            <p class="detail-head">
              {{ detail.respondent.displayName }} ·
              <template v-if="detail.respondent.score !== null">得分 {{ detail.respondent.score }} / {{ detail.respondent.totalPoints }}</template>
              <template v-else>尚未提交</template>
              <template v-if="detail.respondent.durationSeconds !== null && detail.respondent.durationSeconds !== undefined"> · 用时 {{ formatDuration(detail.respondent.durationSeconds) }}</template>
            </p>
            <ul class="dq-list">
              <li v-for="q in detail.questions" :key="q.position" class="dq-item" :class="q.isCorrect === true ? 'is-ok' : q.isCorrect === false ? 'is-bad' : 'is-skip'">
                <div class="dq-top">
                  <span class="dq-index">{{ q.position }}</span>
                  <span class="badge" :class="q.isCorrect === true ? 'is-public' : 'is-wrong'">
                    {{ q.isCorrect === true ? '答对' : '答错' }}
                  </span>
                  <span class="dq-type">{{ typeLabels[q.type] }}</span>
                </div>
                <p class="dq-stem">{{ q.stem }}</p>
                <div class="dq-answers">
                  <p class="dq-line" :class="{ bad: q.isCorrect === false }">他的回答：<strong>{{ answerLabel(q, q.givenAnswer) }}</strong></p>
                  <p class="dq-line ok">正确答案：<strong>{{ answerLabel(q, q.correctAnswer) }}</strong></p>
                </div>
                <p v-if="q.explanation" class="dq-line dq-explain">{{ q.explanation }}</p>
              </li>
            </ul>
          </template>
          <p v-else class="error">作答详情加载失败。</p>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.main { padding: 40px 28px 96px; }
.notice-panel { max-width: 480px; }
.notice-panel h1 { margin: 0 0 12px; font-size: 24px; }
.notice-panel p { margin: 0 0 22px; }

.head { margin-bottom: 24px; }
.title { margin: 10px 0 6px; font-size: clamp(24px, 3vw, 32px); font-weight: 700; letter-spacing: 0.01em; line-height: 1.3; }
.sub { margin: 0; color: var(--muted); font-size: 14px; }
.act-status { font-weight: 600; }
.act-status.is-published { color: var(--accent-strong); }

.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
.stat { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); box-shadow: var(--shadow-xs); padding: 22px 24px; display: grid; gap: 8px; }
.stat-num { font-family: var(--mono); font-size: 32px; font-weight: 700; color: var(--ink); line-height: 1; letter-spacing: -0.02em; }
.stat-label { font-size: 13px; color: var(--muted); }

.resp-list { list-style: none; margin: 0; padding: 0; }
.resp-list li + li { border-top: 1px solid var(--line); }
.resp-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  width: calc(100% + 24px); margin: 0 -12px; padding: 12px;
  border: 0; border-radius: var(--radius-md); background: transparent;
  font: inherit; cursor: pointer; text-align: left;
  transition: background 0.15s ease;
}
.resp-row:hover { background: var(--accent-soft); }
.resp-row.selected { background: var(--accent-soft); }
.resp-side { display: inline-flex; align-items: center; gap: 12px; min-width: 0; }
.resp-avatar {
  width: 34px; height: 34px; flex-shrink: 0; border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--accent-soft); color: var(--accent-strong);
  font-size: 14px; font-weight: 700;
}
.resp-name { font-size: 15px; font-weight: 600; color: var(--ink); }
.resp-meta { display: inline-flex; align-items: center; gap: 12px; }
.resp-score { font-family: var(--mono); font-size: 14px; font-weight: 600; color: var(--ink); }
.resp-time { font-family: var(--mono); font-size: 12px; color: var(--muted-2); }

.detail-head { margin: 0 0 16px; font-size: 14.5px; color: var(--muted); }
.dq-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.dq-item {
  padding: 14px 16px 14px 18px; border: 1px solid var(--line);
  border-left-width: 3px; border-radius: var(--radius-md); background: var(--bg);
}
.dq-item.is-ok { border-left-color: var(--accent); }
.dq-item.is-bad { border-left-color: var(--wrong); }
.dq-item.is-skip { border-left-color: var(--line-strong); }
.dq-top { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.dq-index { font-family: var(--mono); font-size: 12.5px; color: var(--muted-2); }
.dq-type { font-size: 12px; color: var(--muted-2); }
.dq-grade { display: flex; gap: 10px; margin-top: 12px; }
.dq-line.bad strong { color: var(--wrong); }
.dq-stem { margin: 0 0 10px; font-size: 15px; font-weight: 600; line-height: 1.6; }
.dq-answers { display: flex; gap: 28px; flex-wrap: wrap; }
.dq-line { margin: 0; font-size: 13.5px; color: var(--muted); }
.dq-line strong { font-weight: 600; color: var(--ink); }
.dq-line.ok strong { color: var(--accent-strong); }
.dq-line.bad strong { color: var(--wrong); }
.dq-explain { margin-top: 8px; line-height: 1.7; }

@media (max-width: 640px) {
  .main { padding: 28px 20px 72px; }
  .container { padding: 0 20px; }
  .stats { grid-template-columns: 1fr; }
  .resp-row { flex-direction: column; align-items: flex-start; gap: 8px; width: 100%; margin: 0; }
  .dq-answers { flex-direction: column; gap: 4px; }
}
</style>
