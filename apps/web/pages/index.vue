<script setup lang="ts">
const { t, locale } = useI18n()

useSeoMeta({
  title: () => t('home.seo.title'),
  description: () => t('home.seo.description'),
  ogTitle: () => t('home.seo.ogTitle'),
  ogDescription: () => t('home.seo.ogDescription')
})

const { user } = useAuth()

interface DemoOption { value: string; label: string }
interface DemoQuestion { typeLabel: string; stem: string; options: DemoOption[]; answer: string; explain: string }

// 示例题目随语言切换
const questions = computed<DemoQuestion[]>(() => [
  {
    typeLabel: t('home.demo.q1.type'),
    stem: t('home.demo.q1.stem'),
    options: [
      { value: 'a', label: t('home.demo.q1.a') },
      { value: 'b', label: t('home.demo.q1.b') },
      { value: 'c', label: t('home.demo.q1.c') },
      { value: 'd', label: t('home.demo.q1.d') }
    ],
    answer: 'b',
    explain: t('home.demo.q1.explain')
  },
  {
    typeLabel: t('home.demo.q2.type'),
    stem: t('home.demo.q2.stem'),
    options: [
      { value: 'true', label: t('common.optionTrue') },
      { value: 'false', label: t('common.optionFalse') }
    ],
    answer: 'true',
    explain: t('home.demo.q2.explain')
  }
])

const index = ref(0)
const picked = ref<string | null>(null)
const score = ref(0)
const finished = ref(false)

// 切换语言后回到第一题，避免题目/进度错位
watch(locale, () => {
  index.value = 0
  picked.value = null
  finished.value = false
})

const current = computed(() => questions.value[index.value])
const answerLabel = computed(() => current.value.options.find((o) => o.value === current.value.answer)?.label ?? '')

function optionClass(value: string) {
  if (picked.value === null) return ''
  if (value === current.value.answer) return 'is-correct'
  if (value === picked.value) return 'is-wrong'
  return 'is-dim'
}

function pick(value: string) {
  if (picked.value !== null) return
  picked.value = value
  if (value === current.value.answer) score.value += 1
}

function next() {
  if (index.value >= questions.value.length - 1) {
    finished.value = true
    return
  }
  index.value += 1
  picked.value = null
}

function restart() {
  index.value = 0
  picked.value = null
  score.value = 0
  finished.value = false
}

function feedbackText() {
  return picked.value === current.value.answer
    ? t('home.demo.correct')
    : t('home.demo.correctAnswerIs', { answer: answerLabel.value })
}
</script>

<template>
  <div class="page">
    <AppHeader />

    <main>
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-copy">
            <h1>{{ t('home.hero.titleTop') }}<br />{{ t('home.hero.titleLead') }}<em>{{ t('home.hero.titleEm') }}</em>{{ t('home.hero.titleTail') }}</h1>
            <p class="hero-sub">{{ t('home.hero.sub') }}</p>
            <div class="hero-actions">
              <NuxtLink :to="user ? '/banks' : '/login'" class="btn btn-primary">{{ t('home.hero.ctaPrimary') }}</NuxtLink>
              <a href="#how" class="btn btn-secondary">{{ t('home.hero.ctaSecondary') }}</a>
            </div>
          </div>

          <div class="hero-demo">
            <div class="quiz-card" role="group" :aria-label="t('home.hero.demoAria')" :style="{ '--label-correct': `'${t('home.demo.correctLabel')}'`, '--label-yours': `'${t('home.demo.yourLabel')}'` }">
              <div class="quiz-head">
                <span class="quiz-tag">{{ t('home.demo.tag') }} · {{ finished ? t('home.demo.finished') : current.typeLabel }}</span>
                <span class="quiz-progress">{{ Math.min(index + 1, questions.length) }} / {{ questions.length }}</span>
              </div>

              <template v-if="!finished">
                <p class="quiz-question">{{ current.stem }}</p>
                <div class="quiz-options">
                  <button
                    v-for="opt in current.options"
                    :key="opt.value"
                    type="button"
                    class="quiz-option"
                    :class="optionClass(opt.value)"
                    :disabled="picked !== null"
                    @click="pick(opt.value)"
                  >{{ opt.label }}</button>
                </div>
                <p v-if="picked !== null" class="quiz-feedback" :class="picked === current.answer ? 'is-ok' : 'is-bad'">
                  {{ feedbackText() }}
                  {{ current.explain }}
                </p>
                <button v-if="picked !== null" type="button" class="btn btn-primary btn-sm quiz-next" @click="next">
                  {{ index >= questions.length - 1 ? t('home.demo.seeResults') : t('home.demo.next') }}
                </button>
              </template>

              <template v-else>
                <p class="quiz-result-score">{{ score }} / {{ questions.length }}</p>
                <p class="quiz-result-text">{{ t('home.demo.resultText') }}</p>
                <div class="quiz-result-actions">
                  <button type="button" class="btn btn-secondary btn-sm" @click="restart">{{ t('home.demo.retry') }}</button>
                  <NuxtLink :to="user ? '/banks' : '/login'" class="btn btn-primary btn-sm">{{ t('home.hero.ctaPrimary') }}</NuxtLink>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>

      <section id="how" class="steps">
        <div class="container">
          <h2>{{ t('home.steps.title') }}</h2>
          <div class="steps-grid">
            <div class="step">
              <span class="step-num" aria-hidden="true">1</span>
              <h3>{{ t('home.steps.s1.title') }}</h3>
              <p>{{ t('home.steps.s1.desc') }}</p>
            </div>
            <div class="step">
              <span class="step-num" aria-hidden="true">2</span>
              <h3>{{ t('home.steps.s2.title') }}</h3>
              <p>{{ t('home.steps.s2.desc') }}</p>
            </div>
            <div class="step">
              <span class="step-num" aria-hidden="true">3</span>
              <h3>{{ t('home.steps.s3.title') }}</h3>
              <p>{{ t('home.steps.s3.desc') }}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="container">
          <h2>{{ t('home.features.title') }}</h2>
          <div class="bento">
            <article class="cell cell-mistake">
              <h3>{{ t('home.features.mistakes.title') }}</h3>
              <p>{{ t('home.features.mistakes.desc') }}</p>
              <div class="mini-row">
                <span class="mini-badge is-bad">{{ t('home.features.mistakes.badgeBad') }}</span>
                <span>{{ t('home.features.mistakes.sampleBad') }}</span>
              </div>
              <div class="mini-row">
                <span class="mini-badge is-ok">{{ t('home.features.mistakes.badgeOk') }}</span>
                <span>{{ t('home.features.mistakes.sampleOk') }}</span>
              </div>
            </article>
            <article class="cell cell-note">
              <h3>{{ t('home.features.favorites.title') }}</h3>
              <p>{{ t('home.features.favorites.desc') }}</p>
            </article>
            <article class="cell">
              <h3>{{ t('home.features.records.title') }}</h3>
              <p>{{ t('home.features.records.desc') }}</p>
            </article>
            <article class="cell cell-anywhere">
              <h3>{{ t('home.features.anywhere.title') }}</h3>
              <p>{{ t('home.features.anywhere.desc') }}</p>
            </article>
          </div>
        </div>
      </section>

      <section class="cta">
        <div class="container">
          <div class="cta-panel">
            <h2>{{ t('home.cta.title') }}</h2>
            <NuxtLink :to="user ? '/banks' : '/login'" class="btn btn-inverse">{{ t('home.cta.button') }}</NuxtLink>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <strong>{{ t('common.appName') }}</strong>
          <span>{{ t('common.tagline') }}</span>
        </div>
        <nav class="footer-nav" :aria-label="t('home.footer.navAria')">
          <a href="#how">{{ t('home.footer.how') }}</a>
          <a href="#features">{{ t('home.footer.features') }}</a>
          <NuxtLink v-if="user" to="/banks">{{ t('home.footer.myBanks') }}</NuxtLink>
          <NuxtLink v-else to="/login">{{ t('home.footer.login') }}</NuxtLink>
        </nav>
        <span class="footer-copy">© 2026 {{ t('common.appName') }}</span>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.container { max-width: 1120px; margin: 0 auto; padding: 0 28px; }

/* 导航样式见 components/AppHeader.vue */

/* 按钮：共用样式见 assets/css/main.css */

/* Hero */
.hero {
  background-image:
    linear-gradient(rgba(14, 122, 85, 0.045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 122, 85, 0.045) 1px, transparent 1px);
  background-size: 36px 36px;
  border-bottom: 1px solid var(--line);
}
.hero-grid {
  display: grid; grid-template-columns: 1.05fr 0.95fr;
  gap: 64px; align-items: center; padding-top: 88px; padding-bottom: 96px;
}
.hero-copy h1 {
  margin: 0; font-size: clamp(34px, 4.4vw, 50px); font-weight: 800;
  line-height: 1.26; letter-spacing: 0.01em;
}
.hero-copy em { font-style: normal; color: var(--accent); }
.hero-sub { margin: 22px 0 0; max-width: 30em; font-size: 17px; line-height: 1.8; color: var(--muted); }
.hero-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 34px; }

/* 答题示例卡片 */
.quiz-card {
  background: var(--surface); border: 1px solid var(--line);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-card);
  padding: 26px;
}
.quiz-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; }
.quiz-tag { font-family: var(--mono); font-size: 12.5px; color: var(--accent-strong); }
.quiz-progress { font-family: var(--mono); font-size: 12.5px; color: var(--muted); }
.quiz-question { margin: 0 0 18px; font-size: 18px; font-weight: 600; line-height: 1.55; }
.quiz-options { display: grid; gap: 10px; }
.quiz-option {
  display: block; width: 100%; text-align: left; padding: 13px 16px;
  border: 1px solid var(--line); border-radius: var(--radius-md);
  background: var(--surface); font: inherit; font-size: 15px; cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, opacity 0.15s ease;
}
.quiz-option:hover:not(:disabled) { border-color: var(--accent); }
.quiz-option:disabled { cursor: default; }
.quiz-option.is-correct { border-color: var(--accent); background: var(--accent-soft); }
.quiz-option.is-correct::after { content: var(--label-correct); float: right; font-size: 12px; font-weight: 600; color: var(--accent-strong); }
.quiz-option.is-wrong { border-color: var(--wrong); background: var(--wrong-soft); }
.quiz-option.is-wrong::after { content: var(--label-yours); float: right; font-size: 12px; font-weight: 600; color: var(--wrong); }
.quiz-option.is-dim { opacity: 0.45; }
.quiz-feedback { margin: 16px 0 0; font-size: 14px; line-height: 1.75; }
.quiz-feedback.is-ok { color: var(--accent-strong); }
.quiz-feedback.is-bad { color: var(--wrong); }
.quiz-next { margin-top: 18px; }
.quiz-result-score { margin: 6px 0 0; font-family: var(--mono); font-size: 44px; font-weight: 700; color: var(--accent); }
.quiz-result-text { margin: 12px 0 0; font-size: 14.5px; line-height: 1.75; color: var(--muted); }
.quiz-result-actions { display: flex; gap: 10px; margin-top: 22px; }

/* 三步 */
.steps { padding: 96px 0 80px; }
.steps h2, .features h2 { margin: 0 0 52px; font-size: clamp(28px, 3.4vw, 38px); font-weight: 700; letter-spacing: 0.01em; }
.steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 44px; }
.step { border-top: 1px solid var(--line); padding-top: 26px; }
.step-num { display: block; font-family: var(--mono); font-size: 40px; font-weight: 700; line-height: 1; color: var(--accent); }
.step h3 { margin: 24px 0 10px; font-size: 19px; }
.step p { margin: 0; font-size: 15px; line-height: 1.8; color: var(--muted); }

/* 功能 bento */
.features { padding: 8px 0 96px; }
.bento { display: grid; grid-template-columns: 1.15fr 1fr; grid-auto-rows: auto; gap: 16px; }
.cell { background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius-lg); padding: 28px; }
.cell h3 { margin: 0 0 10px; font-size: 18px; }
.cell p { margin: 0; font-size: 14.5px; line-height: 1.8; color: var(--muted); }
.cell-mistake { grid-row: span 2; background: var(--accent-soft); border-color: transparent; display: flex; flex-direction: column; }
.cell-mistake p { color: var(--accent-strong); margin-bottom: 18px; }
.cell-mistake .mini-row:first-of-type { margin-top: auto; }
.mini-row {
  display: flex; align-items: center; gap: 10px; margin-top: 12px;
  background: var(--surface); border-radius: 10px; padding: 13px 15px; font-size: 14px;
}
.mini-badge { font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: 6px; white-space: nowrap; }
.mini-badge.is-bad { background: var(--wrong-soft); color: var(--wrong); }
.mini-badge.is-ok { background: var(--accent-soft); color: var(--accent-strong); }
.cell-note {
  background-image:
    linear-gradient(rgba(14, 122, 85, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(14, 122, 85, 0.06) 1px, transparent 1px);
  background-size: 26px 26px;
}
.cell-anywhere { grid-column: 1 / -1; display: flex; align-items: center; gap: 32px; }
.cell-anywhere h3 { margin: 0; font-size: 21px; }
.cell-anywhere p { font-size: 15px; }

/* CTA */
.cta { padding: 0 0 96px; }
.cta-panel {
  display: flex; align-items: center; justify-content: space-between; gap: 32px;
  background: var(--accent); border-radius: var(--radius-lg); padding: 60px 56px;
}
.cta-panel h2 { margin: 0; color: #fff; font-size: clamp(24px, 3vw, 34px); font-weight: 700; letter-spacing: 0.01em; }

/* 页脚 */
.footer { border-top: 1px solid var(--line); padding: 36px 0 48px; }
.footer-inner { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 20px; }
.footer-brand { display: grid; gap: 6px; }
.footer-brand strong { font-size: 16px; }
.footer-brand span { font-size: 13.5px; color: var(--muted); }
.footer-nav { display: flex; gap: 22px; }
.footer-nav a { font-size: 14px; color: var(--muted); text-decoration: none; }
.footer-nav a:hover { color: var(--ink); }
.footer-copy { font-size: 13.5px; color: var(--muted); }

/* 入场动画 */
@media (prefers-reduced-motion: no-preference) {
  @keyframes rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
  .hero-copy > * { animation: rise 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
  .hero-copy > *:nth-child(2) { animation-delay: 0.06s; }
  .hero-copy > *:nth-child(3) { animation-delay: 0.12s; }
  .hero-demo { animation: rise 0.6s 0.15s cubic-bezier(0.16, 1, 0.3, 1) both; }
}

/* 响应式 */
@media (max-width: 960px) {
  .hero-grid { grid-template-columns: 1fr; gap: 48px; padding-top: 56px; padding-bottom: 72px; }
  .hero-demo { max-width: 540px; }
  .steps-grid { grid-template-columns: 1fr; gap: 32px; }
  .bento { grid-template-columns: 1fr; }
  .cell-anywhere { flex-direction: column; align-items: flex-start; gap: 12px; }
  .cta-panel { flex-direction: column; align-items: flex-start; padding: 44px 36px; }
}
@media (max-width: 640px) {
  .container { padding: 0 20px; }
  .nav-links { display: none; }
  .nav-inner { justify-content: space-between; }
  .quiz-card { padding: 20px; }
  .cta-panel { padding: 36px 24px; }
}
</style>
