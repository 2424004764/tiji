<script setup lang="ts">
useSeoMeta({
  title: '题迹｜自建题库，一条链接开始刷题',
  description: '为班级、小组或自己创建题库，分享链接即可答题，错题、收藏与练习记录自动整理。',
  ogTitle: '题迹｜自建题库，一条链接开始刷题',
  ogDescription: '创建题库、发布答题活动、查看每题反馈，学习轨迹一目了然。'
})

const { user, logout } = useAuth()

interface DemoOption { value: string; label: string }
interface DemoQuestion { typeLabel: string; stem: string; options: DemoOption[]; answer: string; explain: string }

const questions: DemoQuestion[] = [
  {
    typeLabel: '单选题',
    stem: '地球上现存体型最大的动物是哪一种？',
    options: [
      { value: 'a', label: '非洲象' },
      { value: 'b', label: '蓝鲸' },
      { value: 'c', label: '长颈鹿' },
      { value: 'd', label: '虎鲸' }
    ],
    answer: 'b',
    explain: '蓝鲸是地球生命史上已知最大的动物，成年体长可达 30 米。'
  },
  {
    typeLabel: '判断题',
    stem: '在题迹中，答错的题目会自动收进错题本。',
    options: [
      { value: 'true', label: '正确' },
      { value: 'false', label: '错误' }
    ],
    answer: 'true',
    explain: '答错的题会进入错题本，并保留正确答案与解析，方便集中复习。'
  }
]

const index = ref(0)
const picked = ref<string | null>(null)
const score = ref(0)
const finished = ref(false)

const current = computed(() => questions[index.value])
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
  if (index.value >= questions.length - 1) {
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
</script>

<template>
  <div class="page">
    <AppHeader />

    <main>
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-copy">
            <h1>出题、分享、刷题，<br />留下进步的<em>轨迹</em>。</h1>
            <p class="hero-sub">为班级、小组或自己创建题库，一条链接即可开始答题，错题与练习记录自动整理。</p>
            <div class="hero-actions">
              <NuxtLink :to="user ? '/banks' : '/login'" class="btn btn-primary">免费创建题库</NuxtLink>
              <a href="#how" class="btn btn-secondary">了解如何运作</a>
            </div>
          </div>

          <div class="hero-demo">
            <div class="quiz-card" role="group" aria-label="题迹答题示例">
              <div class="quiz-head">
                <span class="quiz-tag">示例 · {{ finished ? '已完成' : current.typeLabel }}</span>
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
                  {{ picked === current.answer ? '回答正确。' : `正确答案是「${answerLabel}」。` }}
                  {{ current.explain }}
                </p>
                <button v-if="picked !== null" type="button" class="btn btn-primary btn-sm quiz-next" @click="next">
                  {{ index >= questions.length - 1 ? '查看结果' : '下一题' }}
                </button>
              </template>

              <template v-else>
                <p class="quiz-result-score">{{ score }} / {{ questions.length }}</p>
                <p class="quiz-result-text">示例结束。真实的答题活动里，得分、用时和每题反馈都会记入创建者的结果页。</p>
                <div class="quiz-result-actions">
                  <button type="button" class="btn btn-secondary btn-sm" @click="restart">再试一次</button>
                  <NuxtLink :to="user ? '/banks' : '/login'" class="btn btn-primary btn-sm">免费创建题库</NuxtLink>
                </div>
              </template>
            </div>
          </div>
        </div>
      </section>

      <section id="how" class="steps">
        <div class="container">
          <h2>三步，从出题到反馈。</h2>
          <div class="steps-grid">
            <div class="step">
              <span class="step-num" aria-hidden="true">1</span>
              <h3>创建题库</h3>
              <p>按科目或章节录入题目，支持单选与判断题型，每题可附解析和难度。</p>
            </div>
            <div class="step">
              <span class="step-num" aria-hidden="true">2</span>
              <h3>分享链接</h3>
              <p>把题库发布为答题活动，任何人点开链接、填一个显示名就能作答，无需注册。</p>
            </div>
            <div class="step">
              <span class="step-num" aria-hidden="true">3</span>
              <h3>查看反馈</h3>
              <p>参与人数、正确率与每题分析实时汇总，哪里薄弱一眼可见。</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" class="features">
        <div class="container">
          <h2>练过的每一题，都有迹可循。</h2>
          <div class="bento">
            <article class="cell cell-mistake">
              <h3>错题本</h3>
              <p>答错的题自动归集，保留正确答案与解析，考前集中攻克。</p>
              <div class="mini-row">
                <span class="mini-badge is-bad">错题</span>
                <span>浮力产生的原因</span>
              </div>
              <div class="mini-row">
                <span class="mini-badge is-ok">已掌握</span>
                <span>光的折射定律</span>
              </div>
            </article>
            <article class="cell cell-note">
              <h3>收藏夹</h3>
              <p>好题、易错题一键收藏，随时回看。</p>
            </article>
            <article class="cell">
              <h3>答题记录</h3>
              <p>每次练习的得分与用时自动留痕，进步看得见。</p>
            </article>
            <article class="cell cell-anywhere">
              <h3>多端可练</h3>
              <p>电脑、平板、手机的浏览器都能直接使用，登录同一账号随时继续。</p>
            </article>
          </div>
        </div>
      </section>

      <section class="cta">
        <div class="container">
          <div class="cta-panel">
            <h2>创建你的第一个题库，只需要几分钟。</h2>
            <NuxtLink :to="user ? '/banks' : '/login'" class="btn btn-inverse">免费创建题库</NuxtLink>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <strong>题迹</strong>
          <span>自建题库与答题反馈工具</span>
        </div>
        <nav class="footer-nav" aria-label="页脚导航">
          <a href="#how">如何运作</a>
          <a href="#features">功能</a>
          <NuxtLink v-if="user" to="/banks">我的题库</NuxtLink>
          <NuxtLink v-else to="/login">登录</NuxtLink>
        </nav>
        <span class="footer-copy">© 2026 题迹</span>
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
.quiz-option.is-correct::after { content: '正确答案'; float: right; font-size: 12px; font-weight: 600; color: var(--accent-strong); }
.quiz-option.is-wrong { border-color: var(--wrong); background: var(--wrong-soft); }
.quiz-option.is-wrong::after { content: '你的回答'; float: right; font-size: 12px; font-weight: 600; color: var(--wrong); }
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
.cell-anywhere h3 { margin: 0; font-size: 21px; white-space: nowrap; }
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
