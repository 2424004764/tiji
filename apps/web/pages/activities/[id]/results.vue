<script setup lang="ts">
import type { MessageKey } from '@tiji/i18n'

const { t, apiError, formatDateTime, formatDuration } = useI18n()

useSeoMeta({
  title: () => t('results.seo.title'),
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

const statusKeyMap: Record<string, MessageKey> = {
  draft: 'results.status.draft',
  published: 'results.status.published',
  paused: 'results.status.paused',
  ended: 'results.status.ended',
  submitted: 'results.status.submitted',
  in_progress: 'results.status.in_progress'
}

function statusLabel(status: string | null) {
  if (!status || !statusKeyMap[status]) return t('results.inProgress')
  return t(statusKeyMap[status])
}

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
    loadError.value = err?.data?.error?.code === 'AUTH_REQUIRED' ? t('api.errors.AUTH_REQUIRED') : t('results.loadFailed')
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

const typeKeyMap: Record<string, MessageKey> = { single_choice: 'question.type.single', multiple_choice: 'question.type.multiple', true_false: 'question.type.tf' }

function typeLabel(type: string) {
  return typeKeyMap[type] ? t(typeKeyMap[type]) : type
}

function answerLabel(q: ResultQuestion, value: string | string[] | null) {
  if (value === null || value === undefined || (Array.isArray(value) && !value.length)) return t('common.notAnswered')
  const label = (v: string) => q.type === 'true_false' ? (v === 'true' ? t('common.optionTrue') : t('common.optionFalse')) : (q.options.find((o) => o.value === v)?.label ?? v)
  if (Array.isArray(value)) return value.map(label).join(t('common.listSeparator'))
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
          <h1>{{ t('common.needLoginTitle') }}</h1>
          <p>{{ t('results.needLoginDesc') }}</p>
          <NuxtLink to="/login" class="btn btn-primary">{{ t('common.goLogin') }}</NuxtLink>
        </div>
      </template>

      <template v-else-if="loading" />
      <template v-else-if="loadError">
        <div class="panel notice-panel">
          <h1>{{ t('results.unableTitle') }}</h1>
          <p>{{ loadError }}</p>
          <NuxtLink to="/banks" class="btn btn-primary">{{ t('bank.backToBanks') }}</NuxtLink>
        </div>
      </template>

      <template v-else-if="activity">
        <div class="head">
          <div>
            <NuxtLink :to="`/banks/${activity.bank_id}`" class="back-link">{{ t('results.backToBank') }}</NuxtLink>
            <h1 class="title">{{ activity.title }}</h1>
            <p class="sub">{{ t('results.questionCount', { n: activity.question_count }) }} <span :class="`act-status is-${activity.status}`">{{ statusLabel(activity.status) }}</span></p>
          </div>
        </div>

        <div class="stats">
          <div class="stat"><span class="stat-num">{{ respondents.length }}</span><span class="stat-label">{{ t('results.statParticipants') }}</span></div>
          <div class="stat"><span class="stat-num">{{ summary?.submitted ?? 0 }}</span><span class="stat-label">{{ t('results.statSubmitted') }}</span></div>
          <div class="stat">
            <span class="stat-num">{{ summary?.average_score === null || summary?.average_score === undefined ? '—' : Number(summary.average_score).toFixed(1) }}</span>
            <span class="stat-label">{{ t('results.statAverage') }}</span>
          </div>
        </div>

        <section class="panel">
          <h2 class="panel-title">{{ t('results.rosterTitle') }}</h2>
          <p v-if="!respondents.length" class="hint">{{ t('results.rosterEmpty') }}</p>
          <ul v-else class="resp-list">
            <li v-for="r in respondents" :key="r.id">
              <button type="button" class="resp-row" :class="{ selected: selectedId === r.id }" @click="openDetail(r)">
                <span class="resp-side">
                  <span class="resp-avatar" aria-hidden="true">{{ r.display_name.slice(0, 1) }}</span>
                  <span class="resp-name">{{ r.display_name }}</span>
                </span>
                <span class="resp-meta">
                  <span class="badge" :class="r.status === 'submitted' ? 'is-public' : 'is-draft'">{{ statusLabel(r.status) }}</span>
                  <span v-if="r.score !== null" class="resp-score">{{ r.score }} / {{ r.total_points }}</span>
                  <span v-if="r.submitted_at" class="resp-time">{{ formatDateTime(r.submitted_at) }}</span>
                </span>
              </button>
            </li>
          </ul>
        </section>

        <section v-if="selectedId" class="panel">
          <h2 class="panel-title">{{ t('results.detailTitle') }}</h2>
          <p v-if="detailLoading" class="hint">{{ t('common.loading') }}</p>
          <template v-else-if="detail">
            <p class="detail-head">
              {{ detail.respondent.displayName }} ·
              <template v-if="detail.respondent.score !== null">{{ t('results.detailScore', { score: detail.respondent.score, total: detail.respondent.totalPoints ?? 0 }) }}</template>
              <template v-else>{{ t('results.notSubmitted') }}</template>
              <template v-if="detail.respondent.durationSeconds !== null && detail.respondent.durationSeconds !== undefined"> · {{ t('results.durationPrefix') }} {{ formatDuration(detail.respondent.durationSeconds) }}</template>
            </p>
            <ul class="dq-list">
              <li v-for="q in detail.questions" :key="q.position" class="dq-item" :class="q.isCorrect === true ? 'is-ok' : q.isCorrect === false ? 'is-bad' : 'is-skip'">
                <div class="dq-top">
                  <span class="dq-index">{{ q.position }}</span>
                  <span class="badge" :class="q.isCorrect === true ? 'is-public' : 'is-wrong'">
                    {{ q.isCorrect === true ? t('results.correct') : t('results.wrong') }}
                  </span>
                  <span class="dq-type">{{ typeLabel(q.type) }}</span>
                </div>
                <p class="dq-stem">{{ q.stem }}</p>
                <div class="dq-answers">
                  <p class="dq-line" :class="{ bad: q.isCorrect === false }">{{ t('results.givenAnswer') }}<strong>{{ answerLabel(q, q.givenAnswer) }}</strong></p>
                  <p class="dq-line ok">{{ t('results.correctAnswer') }}<strong>{{ answerLabel(q, q.correctAnswer) }}</strong></p>
                </div>
                <p v-if="q.explanation" class="dq-line dq-explain">{{ q.explanation }}</p>
              </li>
            </ul>
          </template>
          <p v-else class="error">{{ t('results.detailFailed') }}</p>
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
