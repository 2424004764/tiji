<script setup lang="ts">
useSeoMeta({
  title: '题库详情 · 题迹',
  robots: 'noindex, nofollow'
})

interface BankOption { value: string; label: string }
interface BankQuestion {
  id: string
  type: 'single_choice' | 'multiple_choice' | 'true_false'
  stem: string
  options: BankOption[]
  answer: string | string[] | null
  explanation: string
  difficulty: number
  tags: string[]
}
interface BankActivity { id: string; status: string }
interface Bank {
  id: string
  name: string
  description: string
  visibility: 'private' | 'public'
  status: string
  question_count: number
  activity: BankActivity | null
}

const route = useRoute()
const config = useRuntimeConfig()
const bankId = computed(() => String(route.params.id))

const bank = ref<Bank | null>(null)
const bankLoading = ref(true)
const questions = ref<BankQuestion[]>([])
const listLoading = ref(false)
const listError = ref('')

const activity = ref<BankActivity | null>(null)
const shareUrl = ref('')
const publishing = ref(false)
const publishError = ref('')
const copied = ref(false)
const ending = ref(false)
const syncing = ref(false)
const syncMessage = ref('')

async function resyncSnapshot() {
  if (!activity.value || syncing.value) return
  syncing.value = true
  syncMessage.value = ''
  try {
    await $fetch(`${config.public.apiBase}/activities/${activity.value.id}/publish`, { method: 'POST', credentials: 'include' })
    syncMessage.value = '已同步题库最新内容到答题活动。'
  } catch (err: any) {
    syncMessage.value = err?.data?.error?.message || '同步失败，请稍后重试。'
  } finally {
    syncing.value = false
  }
}

const qType = ref<'choice' | 'true_false'>('choice')
const stem = ref('')
const optionRows = ref([{ key: 'a', label: '' }, { key: 'b', label: '' }, { key: 'c', label: '' }, { key: 'd', label: '' }])
const answer = ref('')
const multiAnswer = ref<string[]>([])
const explanation = ref('')
const difficulty = ref(3)
const tagsInput = ref('')
const saving = ref(false)
const saveError = ref('')
const saveSuccess = ref('')

const settingName = ref('')
const settingDescription = ref('')
const settingVisibility = ref<'private' | 'public'>('private')
const savingSettings = ref(false)
const settingsError = ref('')
const settingsSuccess = ref('')

const typeLabels: Record<string, string> = { single_choice: '单选', multiple_choice: '多选', true_false: '判断' }
const difficultyLabels: Record<number, string> = { 1: '简单', 2: '较易', 3: '中等', 4: '较难', 5: '困难' }
const visibilityLabels: Record<string, string> = { private: '私密', public: '公开' }

function answerText(q: BankQuestion) {
  if (q.type === 'true_false') return q.answer === 'true' ? '正确' : '错误'
  if (Array.isArray(q.answer)) return q.answer.map((v) => q.options.find((o) => o.value === v)?.label ?? v).join('、')
  return q.options.length ? (q.options.find((o) => o.value === q.answer)?.label ?? String(q.answer)) : String(q.answer)
}

async function loadBank() {
  bankLoading.value = true
  try {
    const res = await $fetch<{ data: Bank }>(`${config.public.apiBase}/banks/${bankId.value}`, { credentials: 'include' })
    bank.value = res.data
    if (res.data) {
      settingName.value = res.data.name
      settingDescription.value = res.data.description ?? ''
      settingVisibility.value = res.data.visibility
      const rawActivity = (res.data as unknown as { activity?: BankActivity | string | null }).activity ?? null
      if (typeof rawActivity === 'string') {
        try { activity.value = JSON.parse(rawActivity) } catch { activity.value = null }
      } else {
        activity.value = rawActivity
      }
      await loadShareToken()
    }
  } catch {
    bank.value = null
  } finally {
    bankLoading.value = false
  }
}

async function saveSettings() {
  settingsError.value = ''
  settingsSuccess.value = ''
  if (!settingName.value.trim()) {
    settingsError.value = '题库名称不能为空。'
    return
  }
  savingSettings.value = true
  try {
    const res = await $fetch<{ data: Bank }>(`${config.public.apiBase}/banks/${bankId.value}`, {
      method: 'PATCH',
      credentials: 'include',
      body: { name: settingName.value.trim(), description: settingDescription.value.trim(), visibility: settingVisibility.value }
    })
    if (res.data) bank.value = res.data
    settingsSuccess.value = settingVisibility.value === 'public' ? '设置已保存：题库已设为公开。' : '设置已保存：题库已设为私密。'
  } catch (err: any) {
    settingsError.value = err?.data?.error?.message || '保存失败，请稍后重试。'
  } finally {
    savingSettings.value = false
  }
}

async function loadQuestions() {
  listLoading.value = true
  listError.value = ''
  try {
    const res = await $fetch<{ data: BankQuestion[] }>(`${config.public.apiBase}/banks/${bankId.value}/questions`, { credentials: 'include' })
    questions.value = res.data ?? []
  } catch {
    listError.value = '题目加载失败，请刷新重试。'
  } finally {
    listLoading.value = false
  }
}

function switchType(next: 'choice' | 'true_false') {
  qType.value = next
  answer.value = ''
  multiAnswer.value = []
  saveError.value = ''
}

function addOption() {
  if (optionRows.value.length >= 6) return
  optionRows.value.push({ key: String.fromCharCode(97 + optionRows.value.length), label: '' })
}

function removeOption(index: number) {
  if (optionRows.value.length <= 2) return
  const removed = optionRows.value[index].key
  optionRows.value.splice(index, 1)
  if (answer.value === removed) answer.value = ''
}

function toggleMulti(key: string) {
  multiAnswer.value = multiAnswer.value.includes(key)
    ? multiAnswer.value.filter((k) => k !== key)
    : [...multiAnswer.value, key].sort()
}

function resetForm() {
  stem.value = ''
  answer.value = ''
  multiAnswer.value = []
  explanation.value = ''
  optionRows.value = [{ key: 'a', label: '' }, { key: 'b', label: '' }, { key: 'c', label: '' }, { key: 'd', label: '' }]
  tagsInput.value = ''
  difficulty.value = 3
}

async function submitQuestion() {
  saveError.value = ''
  saveSuccess.value = ''
  if (!stem.value.trim()) {
    saveError.value = '请输入题干。'
    return
  }
  if (qType.value === 'choice') {
    const filled = optionRows.value.filter((o) => o.label.trim())
    if (filled.length < 2) {
      saveError.value = '选择题至少需要填写两个选项。'
      return
    }
    if (!multiAnswer.value.length) {
      saveError.value = '请勾选正确答案。'
      return
    }
  } else if (!answer.value) {
    saveError.value = '请选择判断题答案。'
    return
  }
  saving.value = true
  try {
    await $fetch(`${config.public.apiBase}/banks/${bankId.value}/questions`, {
      method: 'POST',
      credentials: 'include',
      body: {
        type: qType.value === 'choice' ? (multiAnswer.value.length >= 2 ? 'multiple_choice' : 'single_choice') : 'true_false',
        stem: stem.value.trim(),
        options: qType.value === 'choice' ? optionRows.value.filter((o) => o.label.trim()).map((o) => ({ value: o.key, label: o.label.trim() })) : undefined,
        answer: qType.value === 'choice' ? multiAnswer.value : answer.value,
        explanation: explanation.value.trim(),
        difficulty: difficulty.value,
        tags: tagsInput.value.split(/[,，、\s]+/).map((t) => t.trim()).filter(Boolean)
      }
    })
    saveSuccess.value = '题目已添加。'
    resetForm()
    await loadQuestions()
    await loadBank()
  } catch (err: any) {
    saveError.value = err?.data?.error?.message || '添加失败，请稍后重试。'
  } finally {
    saving.value = false
  }
}

async function removeQuestion(question: BankQuestion) {
  if (!window.confirm(`确定删除这道题吗？\n${question.stem.slice(0, 40)}`)) return
  try {
    await $fetch(`${config.public.apiBase}/banks/${bankId.value}/questions/${question.id}`, { method: 'DELETE', credentials: 'include' })
    questions.value = questions.value.filter((q) => q.id !== question.id)
    bank.value = bank.value ? { ...bank.value, question_count: bank.value.question_count - 1 } : bank.value
  } catch {
    window.alert('删除失败，请稍后重试。')
  }
}

async function loadShareToken() {
  if (!activity.value || activity.value.status === 'draft') { shareUrl.value = ''; return }
  try {
    const res = await $fetch<{ data: { shareToken: string; status: string } }>(`${config.public.apiBase}/activities/${activity.value.id}/share`, { credentials: 'include' })
    shareUrl.value = `${window.location.origin}/activity/${res.data.shareToken}`
  } catch { shareUrl.value = '' }
}

async function publishActivity() {
  publishError.value = ''
  if (!bank.value) return
  if (bank.value.question_count < 1) { publishError.value = '请先添加至少一道题目，再发布答题活动。'; return }
  publishing.value = true
  try {
    const created = await $fetch<{ data: { id: string; shareToken: string } }>(`${config.public.apiBase}/activities`, {
      method: 'POST',
      credentials: 'include',
      body: { bankId: bank.value.id, title: bank.value.name }
    })
    await $fetch(`${config.public.apiBase}/activities/${created.data.id}/publish`, { method: 'POST', credentials: 'include' })
    activity.value = { id: created.data.id, status: 'published' }
    shareUrl.value = `${window.location.origin}/activity/${created.data.shareToken}`
  } catch (err: any) {
    publishError.value = err?.data?.error?.message || '发布失败，请稍后重试。'
  } finally {
    publishing.value = false
  }
}

async function endActivity() {
  if (!activity.value) return
  if (!window.confirm('确定结束这个答题活动吗？结束后好友将无法继续作答。')) return
  ending.value = true
  try {
    await $fetch(`${config.public.apiBase}/activities/${activity.value.id}/end`, { method: 'POST', credentials: 'include' })
    activity.value = { ...activity.value, status: 'ended' }
  } catch {
    window.alert('操作失败，请稍后重试。')
  } finally {
    ending.value = false
  }
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    window.prompt('请手动复制链接：', shareUrl.value)
  }
}

const ready = useState<boolean>('auth:ready')
const { user } = useAuth()
onMounted(async () => {
  await loadBank()
  await loadQuestions()
})
</script>

<template>
  <div class="page">
    <AppHeader />

    <main class="container main">
      <template v-if="ready && !user">
        <div class="panel notice-panel">
          <h1>请先登录</h1>
          <p>登录后即可管理题库和题目。</p>
          <NuxtLink to="/login" class="btn btn-primary">前往登录</NuxtLink>
        </div>
      </template>

      <template v-else-if="bankLoading" />
      <template v-else-if="!bank">
        <div class="panel notice-panel">
          <h1>题库不存在</h1>
          <p>它可能已被删除，或者不属于当前账号。</p>
          <NuxtLink to="/banks" class="btn btn-primary">返回我的题库</NuxtLink>
        </div>
      </template>

      <template v-else>
        <div class="bank-head">
          <div>
            <NuxtLink to="/banks" class="back-link">返回我的题库</NuxtLink>
            <h1 class="bank-name">{{ bank.name }}</h1>
            <p v-if="bank.description" class="bank-desc">{{ bank.description }}</p>
          </div>
          <div class="head-badges">
            <span class="badge" :class="bank.visibility === 'public' ? 'is-public' : 'is-draft'">{{ visibilityLabels[bank.visibility] }}</span>
            <span class="badge is-draft">{{ bank.question_count }} 道题</span>
          </div>
        </div>

        <section class="panel share-panel" :class="{ 'is-live': activity && activity.status === 'published' }">
          <h2 class="panel-title">分享答题</h2>
          <template v-if="bank.visibility !== 'public'">
            <p class="hint">题库当前为<strong>私密</strong>。先在下方「题库设置」中把可见性改为公开，才能发布分享。</p>
          </template>
          <template v-else-if="activity && activity.status === 'published'">
            <p class="hint">把下面的链接发给好友，好友打开后输入显示名即可答题，无需注册。</p>
            <div class="share-row">
              <input class="share-link" :value="shareUrl" readonly @focus="($event.target as HTMLInputElement).select()" />
              <button type="button" class="btn btn-primary btn-sm" @click="copyLink">{{ copied ? '已复制' : '复制链接' }}</button>
              <button type="button" class="btn btn-secondary btn-sm" :disabled="ending" @click="endActivity">结束活动</button>
              <button type="button" class="btn btn-secondary btn-sm" :disabled="syncing" title="修改题库题目后，同步到进行中的活动" @click="resyncSnapshot">{{ syncing ? '同步中…' : '同步最新题目' }}</button>
              <NuxtLink :to="`/activities/${activity.id}/results`" class="btn btn-ghost btn-sm">查看答题情况</NuxtLink>
            </div>
            <p v-if="syncMessage" class="share-status">{{ syncMessage }}</p>
            <p class="share-status">活动进行中：好友提交后，点击「查看答题情况」即可看到每人的得分与逐题对错。</p>
          </template>
          <template v-else>
            <p class="hint">{{ activity && activity.status === 'ended' ? '上一个活动已结束，可以发布一个新的分享链接。' : '发布后生成一条分享链接，好友无需注册即可答题。' }}</p>
            <button type="button" class="btn btn-primary" :disabled="publishing" @click="publishActivity">
              {{ publishing ? '发布中…' : activity && activity.status === 'ended' ? '重新发布活动' : '发布答题活动' }}
            </button>
            <p v-if="publishError" class="error">{{ publishError }}</p>
            <p v-if="activity && activity.status === 'ended'" class="share-status">
              <NuxtLink :to="`/activities/${activity.id}/results`">查看上一个活动的答题情况</NuxtLink>
            </p>
          </template>
        </section>

        <div class="grid">
          <section class="panel">
            <h2 class="panel-title">添加题目</h2>
            <div class="type-switch" role="tablist" aria-label="题型">
              <button type="button" :class="{ active: qType === 'choice' }" @click="switchType('choice')">选择题</button>
              <button type="button" :class="{ active: qType === 'true_false' }" @click="switchType('true_false')">判断题</button>
            </div>

            <form @submit.prevent="submitQuestion">
              <label class="field">
                题干
                <textarea v-model="stem" rows="3" maxlength="2000" required placeholder="输入题目内容" />
              </label>

              <template v-if="qType === 'choice'">
                <div class="options">
                  <div v-for="(opt, i) in optionRows" :key="opt.key" class="option-row">
                    <label class="answer-check" title="勾选正确答案，勾两个及以上即为多选题">
                      <input type="checkbox" :checked="multiAnswer.includes(opt.key)" @change="toggleMulti(opt.key)" />
                      <span>{{ opt.key.toUpperCase() }}</span>
                    </label>
                    <input v-model="opt.label" class="option-input" maxlength="200" placeholder="选项内容" />
                    <button v-if="optionRows.length > 2" type="button" class="option-remove" title="删除选项" @click="removeOption(i)">×</button>
                  </div>
                  <button v-if="optionRows.length < 6" type="button" class="add-option" @click="addOption">+ 添加选项</button>
                  <p class="choice-hint">勾选 1 个正确答案为单选题，勾选 2 个及以上为多选题。</p>
                </div>
              </template>

              <div v-else class="options">
                <div class="tf-row">
                  <label class="answer-check"><input type="radio" name="tf" value="true" :checked="answer === 'true'" @change="answer = 'true'" /><span>正确</span></label>
                  <label class="answer-check"><input type="radio" name="tf" value="false" :checked="answer === 'false'" @change="answer = 'false'" /><span>错误</span></label>
                </div>
              </div>

              <label class="field">
                解析（可选）
                <textarea v-model="explanation" rows="2" maxlength="2000" placeholder="答题后展示的答案解析" />
              </label>

              <div class="row-2">
                <label class="field">
                  难度
                  <select v-model.number="difficulty">
                    <option :value="1">简单</option>
                    <option :value="2">较易</option>
                    <option :value="3">中等</option>
                    <option :value="4">较难</option>
                    <option :value="5">困难</option>
                  </select>
                </label>
                <label class="field">
                  分类标签（用逗号分隔）
                  <input v-model="tagsInput" maxlength="120" placeholder="例如：力学, 浮力" />
                </label>
              </div>

              <p v-if="saveError" class="error">{{ saveError }}</p>
              <p v-if="saveSuccess" class="success">{{ saveSuccess }}</p>
              <button type="submit" class="btn btn-primary btn-block" :disabled="saving">
                {{ saving ? '保存中…' : '添加题目' }}
              </button>
            </form>
          </section>

          <section class="panel">
            <h2 class="panel-title">题目列表</h2>
            <p v-if="listLoading" class="hint">加载中…</p>
            <p v-else-if="listError" class="error">{{ listError }}</p>
            <p v-else-if="!questions.length" class="hint">还没有题目。在左侧添加第一道题，之后就可以发布答题活动。</p>
            <ul v-else class="q-list">
              <li v-for="(q, i) in questions" :key="q.id" class="q-item">
                <div class="q-main">
                  <div class="q-top">
                    <span class="q-index">{{ i + 1 }}</span>
                    <span class="q-type">{{ typeLabels[q.type] }}</span>
                    <span v-for="tag in q.tags" :key="tag" class="tag">{{ tag }}</span>
                    <span class="q-diff">{{ difficultyLabels[q.difficulty] ?? '中等' }}</span>
                  </div>
                  <p class="q-stem">{{ q.stem }}</p>
                  <p class="q-answer">正确答案：{{ answerText(q) }}</p>
                  <p v-if="q.explanation" class="q-explain">{{ q.explanation }}</p>
                </div>
                <button type="button" class="q-delete" title="删除题目" @click="removeQuestion(q)">删除</button>
              </li>
            </ul>
          </section>
        </div>

        <section class="panel settings-panel">
          <h2 class="panel-title">题库设置</h2>
          <form @submit.prevent="saveSettings">
            <div class="row-2">
              <label class="field">
                题库名称
                <input v-model="settingName" maxlength="100" required />
              </label>
              <label class="field">
                可见性（是否可分享）
                <select v-model="settingVisibility">
                  <option value="private">私密（仅自己可见）</option>
                  <option value="public">公开（可被分享访问）</option>
                </select>
              </label>
            </div>
            <label class="field">
              描述
              <textarea v-model="settingDescription" rows="2" maxlength="500" placeholder="简要说明这个题库的用途" />
            </label>
            <p v-if="settingsError" class="error">{{ settingsError }}</p>
            <p v-if="settingsSuccess" class="success">{{ settingsSuccess }}</p>
            <button type="submit" class="btn btn-primary settings-save" :disabled="savingSettings">
              {{ savingSettings ? '保存中…' : '保存设置' }}
            </button>
          </form>
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

.bank-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
.bank-name { margin: 10px 0 6px; font-size: clamp(24px, 3vw, 32px); font-weight: 700; letter-spacing: 0.01em; line-height: 1.3; }
.bank-desc { margin: 0; color: var(--muted); line-height: 1.7; }
.head-badges { display: flex; gap: 8px; padding-top: 8px; }

.share-panel { margin-bottom: 20px; transition: background 0.2s ease, border-color 0.2s ease; }
.share-panel.is-live { background: var(--accent-soft); border-color: transparent; }
.share-panel.is-live .panel-title { color: var(--accent-strong); }
.share-panel .hint strong { color: var(--wrong); }
.share-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-top: 2px; }
.share-link {
  flex: 1; min-width: 240px; height: 40px; padding: 0 14px;
  border: 1px solid var(--line-strong); border-radius: var(--radius-sm);
  font-family: var(--mono); font-size: 13px; color: var(--ink); background: var(--surface);
}
.share-link:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(14, 122, 85, 0.14); }
.share-status { margin: 14px 0 0; font-size: 13px; color: var(--muted); }
.share-status a { color: var(--accent-strong); font-weight: 600; }

.grid { display: grid; grid-template-columns: 0.95fr 1.05fr; gap: 20px; align-items: start; margin-bottom: 20px; }

form { display: grid; gap: 16px; }

.type-switch {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 4px;
  background: var(--surface-2); border-radius: var(--radius-md); margin-bottom: 4px;
}
.type-switch button {
  height: 36px; border: 0; border-radius: 9px; background: transparent;
  font: inherit; font-size: 14px; font-weight: 600; color: var(--muted); cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.type-switch button.active { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-xs); }

.options { display: grid; gap: 10px; }
.option-row { display: flex; align-items: center; gap: 10px; }
.answer-check {
  display: inline-flex; align-items: center; gap: 6px; cursor: pointer; user-select: none;
  font-size: 13px; font-weight: 600; color: var(--muted);
  padding: 0 12px; height: 43px; flex-shrink: 0;
  border: 1px solid var(--line-strong); border-radius: var(--radius-sm); white-space: nowrap;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.answer-check:has(input:checked) { border-color: var(--accent); color: var(--accent-strong); background: var(--accent-soft); }
.answer-check input { accent-color: var(--accent); margin: 0; }
.option-input {
  flex: 1; min-width: 0; height: 43px; padding: 0 14px;
  border: 1px solid var(--line-strong); border-radius: var(--radius-sm);
  font: inherit; font-size: 14.5px; background: var(--surface); color: var(--ink);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.option-input::placeholder { color: var(--muted-2); font-weight: 400; }
.option-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(14, 122, 85, 0.14); }
.option-remove {
  width: 36px; height: 36px; flex-shrink: 0;
  border: 1px solid var(--line); border-radius: var(--radius-sm);
  background: var(--surface); color: var(--muted-2); font-size: 16px; cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.option-remove:hover { color: var(--wrong); border-color: var(--wrong); background: var(--wrong-soft); }
.add-option {
  justify-self: start; height: 34px; padding: 0 15px;
  border: 1px dashed var(--line-strong); border-radius: 999px; background: transparent;
  font: inherit; font-size: 13px; color: var(--muted); cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.add-option:hover { color: var(--accent-strong); border-color: var(--accent); }
.tf-row { display: flex; gap: 12px; }
.tf-row .answer-check { padding: 0 22px; }
.choice-hint { margin: 2px 0 0; font-size: 12.5px; color: var(--muted-2); }
.row-2 { display: grid; grid-template-columns: 1fr 1.4fr; gap: 14px; }

.q-list { list-style: none; margin: 0; padding: 0; }
.q-item {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  padding: 16px 12px; margin: 0 -12px; border-radius: var(--radius-md);
  transition: background 0.15s ease;
}
.q-item:hover { background: var(--bg); }
.q-item + .q-item { border-top: 1px solid var(--line); }
.q-main { min-width: 0; display: grid; gap: 6px; }
.q-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.q-index { font-family: var(--mono); font-size: 12.5px; color: var(--muted-2); }
.q-type { font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px; background: var(--accent-soft); color: var(--accent-strong); }
.tag { font-size: 12px; padding: 3px 9px; border-radius: 999px; background: var(--surface-2); color: var(--muted); }
.q-diff { font-size: 12px; color: var(--muted-2); }
.q-stem { margin: 0; font-size: 15px; font-weight: 600; line-height: 1.6; }
.q-answer { margin: 0; font-size: 13.5px; color: var(--accent-strong); }
.q-explain { margin: 0; font-size: 13.5px; color: var(--muted); line-height: 1.7; }
.q-delete {
  flex-shrink: 0; height: 30px; padding: 0 11px; margin-top: 2px;
  border: 1px solid transparent; border-radius: 8px;
  background: transparent; font: inherit; font-size: 13px; color: var(--muted-2); cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
}
.q-item:hover .q-delete { border-color: var(--line); color: var(--muted); }
.q-delete:hover { color: var(--wrong); border-color: var(--wrong); background: var(--wrong-soft); }

.settings-panel form { display: grid; gap: 16px; }
.settings-panel .row-2 { grid-template-columns: 1.4fr 1fr; }
.settings-save { justify-self: start; min-width: 140px; }

@media (max-width: 900px) {
  .main { padding: 32px 20px 72px; }
  .container { padding: 0 20px; }
  .grid { grid-template-columns: 1fr; }
  .row-2 { grid-template-columns: 1fr; }
  .settings-panel .row-2 { grid-template-columns: 1fr; }
}
</style>
