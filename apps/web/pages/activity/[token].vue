<script setup lang="ts">
useSeoMeta({
  title: '答题 · 题迹',
  robots: 'noindex, nofollow'
})

interface PubOption { value: string; label: string }
interface PubQuestion { id: string; type: 'single_choice' | 'multiple_choice' | 'true_false'; stem: string; tags: string[]; options: PubOption[] }

const route = useRoute()
const config = useRuntimeConfig()

const loading = ref(true)
const loadError = ref('')
const activity = ref<{ title: string; description: string; bankName: string } | null>(null)
const questions = ref<PubQuestion[]>([])

const phase = ref<'name' | 'quiz' | 'result'>('name')
const displayName = ref('')
const starting = ref(false)
const startError = ref('')
const attemptId = ref('')
const answers = ref<Record<string, string | string[]>>({})
const submitting = ref(false)
const submitError = ref('')
const result = ref<{ score: number; totalPoints: number } | null>(null)

const answeredCount = computed(() => questions.value.filter((q) => {
  const v = answers.value[q.id]
  return Array.isArray(v) ? v.length > 0 : !!v
}).length)

const typeLabel = (type: string) => type === 'single_choice' ? '单选' : type === 'multiple_choice' ? '多选' : '判断'

const NAME_KEY = 'tiji:displayName'

function loadSavedName() {
  try { displayName.value = localStorage.getItem(NAME_KEY) ?? '' } catch { /* 隐私模式下不可用 */ }
}

function saveName() {
  try { localStorage.setItem(NAME_KEY, displayName.value.trim()) } catch { /* 隐私模式下不可用 */ }
}

const current = ref(0)
const sheetOpen = ref(false)
const touch = { startX: 0, startY: 0, dx: 0, dy: 0 }
const dragging = ref(false)
const dragX = ref(0)
const suppressClick = ref(false)

const trackStyle = computed(() => {
  const base = -current.value * 100
  if (dragging.value) {
    return { transform: `translateX(calc(${base}% + ${dragX.value}px))`, transition: 'none' }
  }
  return { transform: `translateX(${base}%)` }
})

function isAnswered(q: PubQuestion) {
  const v = answers.value[q.id]
  return Array.isArray(v) ? v.length > 0 : !!v
}

function nextQuestion() { if (current.value < questions.value.length - 1) current.value++ }
function prevQuestion() { if (current.value > 0) current.value-- }
function jumpTo(i: number) { current.value = i; sheetOpen.value = false }

function onTouchStart(e: TouchEvent) {
  touch.startX = e.touches[0].clientX
  touch.startY = e.touches[0].clientY
  touch.dx = 0; touch.dy = 0
  dragging.value = false
  dragX.value = 0
}
function onTouchMove(e: TouchEvent) {
  touch.dx = e.touches[0].clientX - touch.startX
  touch.dy = e.touches[0].clientY - touch.startY
  // 仅横向手势跟随拖拽；纵向交还给页面滚动
  if (Math.abs(touch.dx) > 8 && Math.abs(touch.dx) > Math.abs(touch.dy)) {
    dragging.value = true
    let dx = touch.dx
    // 两端超出时阻尼，形成回弹手感
    if ((current.value === 0 && dx > 0) || (current.value === questions.value.length - 1 && dx < 0)) {
      dx = dx * 0.3
    }
    dragX.value = dx
  }
}
function onTouchEnd() {
  if (Math.abs(touch.dx) > 10) {
    suppressClick.value = true
    setTimeout(() => { suppressClick.value = false }, 350)
  }
  if (dragging.value) {
    if (touch.dx < -60) nextQuestion()
    else if (touch.dx > 60) prevQuestion()
  }
  dragging.value = false
  dragX.value = 0
}

onMounted(() => {
  loadSavedName()
})

onMounted(async () => {
  try {
    const res = await $fetch<{ data: { title: string; description: string; bank_name?: string; questions: PubQuestion[] } }>(`${config.public.apiBase}/public/activities/${route.params.token}`)
    activity.value = { title: res.data.title, description: res.data.description, bankName: res.data.bank_name ?? '' }
    questions.value = res.data.questions ?? []
    if (!questions.value.length) loadError.value = '这个活动还没有题目。'
    else if (displayName.value.trim()) start()
  } catch (err: any) {
    loadError.value = err?.data?.error?.code === 'ACTIVITY_NOT_OPEN' ? '活动已结束或尚未开放。' : '活动不存在或链接有误。'
  } finally {
    loading.value = false
  }
})

async function start() {
  startError.value = ''
  if (!displayName.value.trim()) {
    startError.value = '请输入你的显示名。'
    return
  }
  starting.value = true
  try {
    const res = await $fetch<{ data: { attemptId: string } }>(`${config.public.apiBase}/public/activities/${route.params.token}/start`, {
      method: 'POST',
      body: { displayName: displayName.value.trim() }
    })
    attemptId.value = res.data.attemptId
    saveName()
    phase.value = 'quiz'
  } catch (err: any) {
    startError.value = err?.data?.error?.message || '开始失败，请稍后重试。'
  } finally {
    starting.value = false
  }
}

function pick(q: PubQuestion, value: string) {
  if (suppressClick.value) return
  if (q.type === 'multiple_choice') {
    const current = Array.isArray(answers.value[q.id]) ? [...answers.value[q.id] as string[]] : []
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value].sort()
    answers.value = { ...answers.value, [q.id]: next }
  } else {
    answers.value = { ...answers.value, [q.id]: value }
  }
}

function isSelected(q: PubQuestion, value: string) {
  const v = answers.value[q.id]
  return Array.isArray(v) ? v.includes(value) : v === value
}

async function submitAnswers() {
  submitError.value = ''
  const unanswered = questions.value.length - answeredCount.value
  if (unanswered > 0) {
    if (!window.confirm(`还有 ${unanswered} 道题未作答，未答的题按错误计分。确定提交吗？`)) return
  }
  submitting.value = true
  try {
    const res = await $fetch<{ data: { score: number; totalPoints: number } }>(`${config.public.apiBase}/public/activities/${route.params.token}/submit`, {
      method: 'POST',
      body: { attemptId: attemptId.value, answers: answers.value }
    })
    result.value = res.data
    phase.value = 'result'
  } catch (err: any) {
    submitError.value = err?.data?.error?.message || '提交失败，请稍后重试。'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="quiz-page">
    <header class="top"><NuxtLink to="/" class="brand" aria-label="题迹首页"><AppLogo /></NuxtLink></header>

    <main class="wrap">
      <p v-if="loading" class="hint">加载中…</p>

      <div v-else-if="loadError" class="card">
        <h1>{{ loadError }}</h1>
        <p class="hint">如果你有题迹账号，可以登录后创建自己的题库和分享活动。</p>
        <NuxtLink to="/" class="btn btn-primary">去题迹看看</NuxtLink>
      </div>

      <div v-else-if="phase === 'name' && activity" class="card">
        <p class="eyebrow">答题邀请</p>
        <h1>{{ activity.title }}</h1>
        <p v-if="activity.bankName" class="bank">来自题库「{{ activity.bankName }}」</p>
        <p v-if="activity.description" class="desc">{{ activity.description }}</p>
        <p class="meta">共 {{ questions.length }} 道题 · 无需注册，输入显示名即可开始</p>
        <form @submit.prevent="start">
          <label class="field">
            你的显示名
            <input v-model="displayName" maxlength="40" required placeholder="例如：小明" />
          </label>
          <p v-if="startError" class="error">{{ startError }}</p>
          <button type="submit" class="btn btn-primary btn-block" :disabled="starting">{{ starting ? '准备中…' : '开始答题' }}</button>
        </form>
      </div>

      <div v-else-if="phase === 'quiz'" class="quiz-shell">
        <p class="quiz-context">
          {{ activity?.title }}
          <span v-if="activity?.bankName" class="quiz-context-bank">· {{ activity.bankName }}</span>
        </p>
        <div class="quiz-topbar">
          <span>第 {{ current + 1 }} 题 / 共 {{ questions.length }} 题</span>
          <span class="who">
            <span class="who-name">{{ displayName }}</span>
            <button type="button" class="sheet-trigger" @click="sheetOpen = true">答题卡</button>
          </span>
        </div>

        <div class="swipe-viewport" @touchstart.passive="onTouchStart" @touchmove.passive="onTouchMove" @touchend.passive="onTouchEnd">
          <div class="swipe-track" :style="trackStyle">
            <section v-for="(q, i) in questions" :key="q.id" class="slide">
              <div class="slide-card">
                <p class="stem">{{ i + 1 }}. {{ q.stem }}<span class="q-type">{{ typeLabel(q.type) }}</span></p>
                <p v-if="q.tags && q.tags.length" class="q-tags">
                  <span v-for="t in q.tags" :key="t" class="chip">{{ t }}</span>
                </p>
                <div class="options">
                  <button
                    v-for="opt in q.options"
                    :key="opt.value"
                    type="button"
                    class="option"
                    :class="{ selected: isSelected(q, opt.value) }"
                    @click="pick(q, opt.value)"
                  >{{ opt.label }}</button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div class="quiz-nav">
          <button type="button" class="nav-btn" :disabled="current === 0" @click="prevQuestion">← 上一题</button>
          <div class="dots" role="tablist" aria-label="题目进度">
            <span
              v-for="(q, i) in questions"
              :key="q.id"
              class="dot"
              :class="{ active: i === current, done: isAnswered(q) }"
              role="tab"
              :aria-label="`第 ${i + 1} 题`"
              @click="current = i"
            />
          </div>
          <button type="button" class="nav-btn" :disabled="current === questions.length - 1" @click="nextQuestion">下一题 →</button>
        </div>

        <p v-if="submitError" class="error">{{ submitError }}</p>
        <button type="button" class="btn btn-primary btn-block" :disabled="submitting" @click="submitAnswers">
          {{ submitting ? '提交中…' : '提交答卷' }}
        </button>

        <div v-if="sheetOpen" class="sheet-mask" @click.self="sheetOpen = false">
          <div class="sheet" role="dialog" aria-label="答题卡">
            <div class="sheet-head">
              <strong>答题卡</strong>
              <span class="hint">已答 {{ answeredCount }} / {{ questions.length }}</span>
              <button type="button" class="sheet-close" @click="sheetOpen = false">完成</button>
            </div>
            <div class="sheet-grid">
              <button
                v-for="(q, i) in questions"
                :key="q.id"
                type="button"
                class="sheet-cell"
                :class="{ answered: isAnswered(q), current: i === current }"
                @click="jumpTo(i)"
              >{{ i + 1 }}</button>
            </div>
            <p class="sheet-hint">绿色 = 已作答，点击题号直接跳转</p>
          </div>
        </div>
      </div>

      <div v-else-if="phase === 'result' && result" class="card result-card">
        <p class="eyebrow">答题完成</p>
        <p class="score">{{ result.score }}<span class="total">/ {{ result.totalPoints }}</span></p>
        <p class="thanks">{{ displayName }}，感谢作答！结果已同步给出题人。</p>
        <button type="button" class="btn btn-secondary" @click="phase = 'quiz'; submitError = ''">返回检查答卷</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.quiz-page {
  min-height: 100dvh;
  background: var(--bg);
  background-image:
    linear-gradient(rgba(14, 122, 85, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 122, 85, 0.04) 1px, transparent 1px);
  background-size: 36px 36px;
}
.top {
  height: 64px; display: flex; align-items: center; padding: 0 28px;
  border-bottom: 1px solid var(--line);
  background: rgba(246, 247, 246, 0.86);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  position: sticky; top: 0; z-index: 10;
}
.brand { text-decoration: none; }
.wrap { max-width: 680px; margin: 0 auto; padding: 48px 24px 96px; }
.card {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card); padding: 36px;
}
.eyebrow { margin: 0 0 10px; font-family: var(--mono); font-size: 12.5px; color: var(--accent-strong); }
h1 { margin: 0 0 14px; font-size: clamp(24px, 3.4vw, 32px); font-weight: 700; line-height: 1.3; letter-spacing: 0.01em; }
.bank { margin: -8px 0 14px; font-size: 13.5px; color: var(--muted); }
.desc { margin: 0 0 14px; color: var(--muted); line-height: 1.75; }
.meta { margin: 0 0 24px; font-size: 13.5px; color: var(--muted); }
.hint { font-size: 14.5px; line-height: 1.8; color: var(--muted); }
form { display: grid; gap: 16px; margin-top: 6px; }
.error { margin: 0; font-size: 14px; color: var(--wrong); }
.progress { display: flex; justify-content: flex-end; margin-bottom: 4px; }
.progress span { font-family: var(--mono); font-size: 12.5px; color: var(--muted); }
.question { padding: 20px 0; border-top: 1px solid var(--line); }
.quiz-shell { display: grid; gap: 14px; }
.quiz-context { margin: 0; font-size: 14.5px; font-weight: 600; line-height: 1.5; }
.quiz-context-bank { font-weight: 400; font-size: 12.5px; color: var(--muted); }
.quiz-topbar {
  display: flex; align-items: center; justify-content: space-between;
  font-family: var(--mono); font-size: 12.5px; color: var(--muted);
}
.who { display: inline-flex; align-items: center; gap: 10px; min-width: 0; }
.who-name { max-width: 96px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.swipe-viewport { overflow: hidden; touch-action: pan-y; }
.swipe-track { display: flex; transition: transform 0.32s cubic-bezier(0.16, 1, 0.3, 1); }
.slide { flex: 0 0 100%; min-width: 0; }
.slide-card {
  background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm); padding: 28px 24px; min-height: 260px;
  user-select: none; -webkit-user-select: none;
}
.q-tags { display: flex; gap: 6px; flex-wrap: wrap; margin: -8px 0 16px; }
.q-tags .chip { background: var(--accent-soft); color: var(--accent-strong); }
.quiz-nav { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.sheet-trigger {
  height: 28px; padding: 0 13px; border: 1px solid var(--line-strong); border-radius: 999px;
  background: var(--surface); color: var(--muted); font: inherit; font-size: 12.5px; cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.sheet-trigger:hover { color: var(--accent-strong); border-color: var(--accent); }
.sheet-mask {
  position: fixed; inset: 0; z-index: 60;
  background: rgba(20, 24, 28, 0.45);
  display: flex; align-items: flex-end; justify-content: center;
  animation: mask-in 0.2s ease;
}
.sheet {
  width: 100%; max-width: 680px;
  background: var(--surface); border-radius: 20px 20px 0 0;
  padding: 22px 24px 30px;
  animation: sheet-up 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.sheet-head { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.sheet-head strong { font-size: 16px; margin-right: auto; }
.sheet-close {
  height: 34px; padding: 0 20px; border: 0; border-radius: 999px;
  background: var(--accent); color: #fff;
  font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer;
}
.sheet-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
.sheet-cell {
  height: 44px; border-radius: 10px; border: 1px solid var(--line-strong);
  background: var(--surface); color: var(--ink);
  font-family: var(--mono); font-size: 15px; font-weight: 600; cursor: pointer;
  transition: transform 0.1s ease;
}
.sheet-cell:active { transform: scale(0.93); }
.sheet-cell.answered { background: var(--accent-soft); border-color: transparent; color: var(--accent-strong); }
.sheet-cell.current { background: var(--accent); border-color: var(--accent); color: #fff; }
.sheet-hint { margin: 16px 0 0; font-size: 12.5px; color: var(--muted-2); }
@keyframes mask-in { from { opacity: 0 } to { opacity: 1 } }
@keyframes sheet-up { from { transform: translateY(40px); opacity: 0 } to { transform: none; opacity: 1 } }
@media (prefers-reduced-motion: reduce) {
  .sheet, .sheet-mask { animation: none; }
}
.nav-btn {
  height: 36px; padding: 0 16px; border: 1px solid var(--line-strong); border-radius: 999px;
  background: var(--surface); color: var(--ink); font: inherit; font-size: 13.5px; cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, opacity 0.15s ease;
}
.nav-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent-strong); }
.nav-btn:disabled { opacity: 0.35; cursor: default; }
.dots { display: flex; gap: 7px; flex-wrap: wrap; justify-content: center; }
.dot {
  width: 8px; height: 8px; border-radius: 999px; background: var(--line-strong);
  cursor: pointer; transition: background 0.2s ease, width 0.2s ease;
}
.dot.done { background: rgba(14, 122, 85, 0.45); }
.dot.active { background: var(--accent); width: 22px; }
@media (prefers-reduced-motion: reduce) {
  .swipe-track { transition: none; }
}
.stem { margin: 0 0 14px; font-size: 15.5px; font-weight: 600; line-height: 1.65; }
.q-type {
  margin-left: 8px; font-size: 11.5px; font-weight: 600; padding: 2px 7px;
  border-radius: 6px; background: var(--accent-soft); color: var(--accent-strong); vertical-align: 2px;
}
.options { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.option {
  padding: 13px 16px; border: 1px solid var(--line-strong); border-radius: var(--radius-sm);
  background: var(--surface); font: inherit; font-size: 14.5px; text-align: left; cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.option:hover { border-color: var(--accent); }
.option.selected {
  border-color: var(--accent); background: var(--accent-soft);
  color: var(--accent-strong); font-weight: 600; box-shadow: 0 0 0 1px var(--accent) inset;
}
.question + .btn { margin-top: 24px; }
.result-card { text-align: center; padding: 52px 36px; }
.score { margin: 10px 0 6px; font-family: var(--mono); font-size: 68px; font-weight: 700; color: var(--accent); line-height: 1; letter-spacing: -0.02em; }
.total { font-size: 28px; color: var(--muted-2); font-weight: 600; }
.thanks { margin: 14px 0 28px; color: var(--muted); line-height: 1.7; }
@media (max-width: 640px) {
  .wrap { padding: 28px 16px 72px; }
  .card { padding: 26px 20px; }
  .options { grid-template-columns: 1fr; }
  .top { padding: 0 20px; }
}
</style>
