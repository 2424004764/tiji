import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

export type Env = { Bindings: { DB: D1Database; APP_ENV?: string; PUBLIC_APP_URL?: string } }
type User = { id: string; username: string; locale: string; timezone: string }

const app = new Hono<Env>().basePath('/api/v1')
const isLocalOrigin = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
const allowedOrigins = (c: any) => String(c.env?.PUBLIC_APP_URL ?? '').split(',').map((s) => s.trim()).filter(Boolean)
app.use('*', cors({ origin: (origin, c) => (isLocalOrigin(origin) || allowedOrigins(c).includes(origin) ? origin : null), credentials: true, allowHeaders: ['content-type'] }))
app.onError((err, c) => { if (err instanceof HTTPException && err.res) return err.res; console.error('[api] unhandled:', err); return fail(c, 'INTERNAL_ERROR', '服务内部错误', 500) })
const SESSION_COOKIE = 'tiji_session'
const SESSION_DAYS = 30
// Cloudflare Workers 的 Web Crypto 对 PBKDF2 迭代次数上限为 100000
const PBKDF2_ITERATIONS = 100000

const json = (c: any, data: unknown, status = 200, meta: Record<string, unknown> = {}) => c.json({ data, error: null, meta }, status)
const fail = (c: any, code: string, message: string, status: number) => c.json({ data: null, error: { code, message }, meta: {} }, status)
const now = () => new Date().toISOString()
const id = () => crypto.randomUUID()
const bytes = (length: number) => crypto.getRandomValues(new Uint8Array(length))
const base64url = (input: Uint8Array) => btoa(String.fromCharCode(...input)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const randomToken = (length = 32) => base64url(bytes(length))
const sha256 = async (value: string) => base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))))

async function hashPassword(password: string, salt = randomToken(16)) {
  const key = await crypto.subtle.importKey('raw', new Uint8Array(await new Blob([password]).arrayBuffer()), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, key, 256)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${base64url(new Uint8Array(bits))}`
}
async function verifyPassword(password: string, stored: string) {
  const [, iterations, salt, expected] = stored.split('$')
  if (!iterations || !salt || !expected) return false
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: Number(iterations), hash: 'SHA-256' }, key, 256)
  return base64url(new Uint8Array(bits)) === expected
}
const parseBody = async (c: any) => { try { return await c.req.json() } catch { return null } }
const cleanUsername = (value: unknown) => typeof value === 'string' && /^[\w-]{3,32}$/.test(value) ? value : null

type ImportErrorCode = 'invalidType' | 'invalidStem' | 'invalidOptions' | 'invalidAnswer'
type NormalizedQuestion = { type: 'single_choice' | 'multiple_choice' | 'true_false'; stem: string; options: Array<{ value: string; label: string }>; answer: string | string[]; explanation: string; difficulty: number; tags: string[] }

// 单题创建与批量导入共用的校验/归一化，失败时返回 code（供前端 i18n）和 message（供 API 直调方）
function normalizeQuestionInput(body: any): { ok: true; value: NormalizedQuestion } | { ok: false; code: ImportErrorCode; message: string } {
  const validType = body?.type === 'single_choice' || body?.type === 'true_false' || body?.type === 'multiple_choice'
  const stem = typeof body?.stem === 'string' ? body.stem.trim().slice(0, 2000) : ''
  if (!validType) return { ok: false, code: 'invalidType', message: '题目内容不完整' }
  if (!stem) return { ok: false, code: 'invalidStem', message: '题目内容不完整' }
  const base = { stem, explanation: typeof body.explanation === 'string' ? body.explanation.trim().slice(0, 2000) : '', difficulty: Math.min(5, Math.max(1, Number(body.difficulty) || 1)), tags: (Array.isArray(body.tags) ? body.tags : []).map((t: any) => String(t).trim().slice(0, 20)).filter(Boolean).slice(0, 10) }
  if (body.type === 'true_false') {
    if (body.answer !== 'true' && body.answer !== 'false') return { ok: false, code: 'invalidAnswer', message: '请选择判断题答案' }
    return { ok: true, value: { type: 'true_false', ...base, options: [{ value: 'true', label: '正确' }, { value: 'false', label: '错误' }], answer: body.answer } }
  }
  let options: Array<{ value: string; label: string }> = (Array.isArray(body.options) ? body.options : []).map((o: any, i: number) => { const provided = typeof o?.value === 'string' && /^[a-z0-9_-]{1,8}$/i.test(o.value) ? o.value : String.fromCharCode(97 + i); return { value: provided, label: String(o?.label ?? '').trim().slice(0, 200) } }).filter((o: any) => o.label).slice(0, 6)
  const seen = new Set<string>(); options = options.filter((o: any) => { if (seen.has(o.value)) return false; seen.add(o.value); return true })
  if (options.length < 2) return { ok: false, code: 'invalidOptions', message: '选择题至少需要两个选项' }
  if (body.type === 'single_choice') {
    if (typeof body.answer !== 'string' || !options.some((o: any) => o.value === body.answer)) return { ok: false, code: 'invalidAnswer', message: '请选择正确答案' }
    return { ok: true, value: { type: 'single_choice', ...base, options, answer: body.answer } }
  }
  const picked: string[] = (Array.isArray(body.answer) ? body.answer : []).map((v: any) => String(v)).filter((v: string) => options.some((o: any) => o.value === v))
  const answer = [...new Set(picked)].sort()
  if (!answer.length) return { ok: false, code: 'invalidAnswer', message: '请至少勾选一个正确答案' }
  return { ok: true, value: { type: 'multiple_choice', ...base, options, answer } }
}

const questionInsert = (db: D1Database, question: NormalizedQuestion, questionId: string, ownerId: string, timestamp: string) =>
  db.prepare('INSERT INTO questions(id,owner_id,type,stem,options_json,answer_json,explanation,difficulty,tags_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)')
    .bind(questionId, ownerId, question.type, question.stem, JSON.stringify(question.options), JSON.stringify(question.answer), question.explanation, question.difficulty, JSON.stringify(question.tags), timestamp, timestamp)
// position 用子查询取当前最大值 +1，批量语句按顺序执行时可正确接续
const bankQuestionInsert = (db: D1Database, bankId: string, questionId: string, timestamp: string) =>
  db.prepare('INSERT INTO bank_questions(bank_id,question_id,position,created_at) SELECT ?,?,COALESCE(MAX(position),-1)+1,? FROM bank_questions WHERE bank_id=?').bind(bankId, questionId, timestamp, bankId)

async function currentUser(c: any): Promise<User | null> {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) return null
  const row = await c.env.DB.prepare(`SELECT u.id,u.username,u.locale,u.timezone FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.status='active'`).bind(await sha256(token), now()).first() as User | null
  if (row) await c.env.DB.prepare('UPDATE sessions SET last_seen_at=? WHERE token_hash=?').bind(now(), await sha256(token)).run()
  return row || null
}
async function requireUser(c: any): Promise<User> { const user = await currentUser(c); if (!user) throw new HTTPException(401, { res: fail(c, 'AUTH_REQUIRED', '请先登录', 401) }); return user }
async function createSession(c: any, userId: string) {
  const token = randomToken(32); const timestamp = Date.now(); const expires = new Date(timestamp + SESSION_DAYS * 86400000).toISOString()
  await c.env.DB.prepare('INSERT INTO sessions(id,user_id,token_hash,expires_at,created_at,last_seen_at) VALUES(?,?,?,?,?,?)').bind(id(), userId, await sha256(token), expires, now(), now()).run()
  setCookie(c, SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: isLocalOrigin(new URL(c.req.url).origin) ? 'Lax' : 'None', path: '/', maxAge: SESSION_DAYS * 86400 })
}

app.get('/health', (c) => json(c, { ok: true, service: 'tiji-api' }))
app.post('/auth/register', async (c) => {
  const body = await parseBody(c); const username = cleanUsername(body?.username); const password = typeof body?.password === 'string' ? body.password : ''
  if (!username || password.length < 8 || password.length > 128) return fail(c, 'VALIDATION_ERROR', '用户名需为 3-32 位，密码需为 8-128 位', 400)
  const exists = await c.env.DB.prepare('SELECT id FROM users WHERE username=?').bind(username).first()
  if (exists) return fail(c, 'USERNAME_TAKEN', '用户名已存在', 409)
  const userId = id(); const timestamp = now()
  await c.env.DB.prepare('INSERT INTO users(id,username,password_hash,created_at,updated_at) VALUES(?,?,?,?,?)').bind(userId, username, await hashPassword(password), timestamp, timestamp).run()
  await createSession(c, userId); return json(c, { id: userId, username })
})
app.post('/auth/login', async (c) => {
  const body = await parseBody(c); const username = cleanUsername(body?.username); const password = typeof body?.password === 'string' ? body.password : ''
  const user = username ? await c.env.DB.prepare('SELECT id,username,password_hash,locale,timezone FROM users WHERE username=? AND status=\'active\'').bind(username).first() as any : null
  if (!user || !(await verifyPassword(password, user.password_hash))) return fail(c, 'INVALID_CREDENTIALS', '用户名或密码错误', 401)
  await createSession(c, user.id); return json(c, { id: user.id, username: user.username, locale: user.locale, timezone: user.timezone })
})
app.post('/auth/logout', async (c) => { const token = getCookie(c, SESSION_COOKIE); if (token) await c.env.DB.prepare('UPDATE sessions SET revoked_at=? WHERE token_hash=?').bind(now(), await sha256(token)).run(); deleteCookie(c, SESSION_COOKIE, { path: '/' }); return json(c, { ok: true }) })
app.get('/auth/me', async (c) => { const user = await currentUser(c); return user ? json(c, user) : fail(c, 'AUTH_REQUIRED', '请先登录', 401) })

app.get('/banks', async (c) => { const user = await requireUser(c); if (typeof user !== 'object') return user; const rows = await c.env.DB.prepare('SELECT b.id,b.name,b.description,b.visibility,b.status,b.created_at,b.updated_at,(SELECT COUNT(*) FROM bank_questions bq JOIN questions q ON q.id=bq.question_id AND q.deleted_at IS NULL WHERE bq.bank_id=b.id) AS question_count,(SELECT json_object(\'id\',a.id,\'status\',a.status) FROM activities a WHERE a.bank_id=b.id ORDER BY a.created_at DESC LIMIT 1) AS activity FROM question_banks b WHERE b.owner_id=? AND b.deleted_at IS NULL ORDER BY b.updated_at DESC').bind(user.id).all(); return json(c, rows.results) })
app.post('/banks', async (c) => { const user = await requireUser(c); if (typeof user !== 'object') return user; const body = await parseBody(c); const name = typeof body?.name === 'string' ? body.name.trim() : ''; if (!name || name.length > 100) return fail(c, 'VALIDATION_ERROR', '题库名称不能为空且不能超过 100 字', 400); const bankId = id(); const timestamp = now(); await c.env.DB.prepare('INSERT INTO question_banks(id,owner_id,name,description,visibility,created_at,updated_at) VALUES(?,?,?,?,?,?,?)').bind(bankId,user.id,name,typeof body.description === 'string' ? body.description.slice(0,500) : '',body.visibility === 'public' ? 'public' : 'private',timestamp,timestamp).run(); return json(c,{ id: bankId, name },201) })
app.post('/banks/:bankId/questions', async (c) => { const user = await requireUser(c); if (typeof user !== 'object') return user; const bankId = c.req.param('bankId'); const bank = await c.env.DB.prepare('SELECT id FROM question_banks WHERE id=? AND owner_id=? AND deleted_at IS NULL').bind(bankId,user.id).first(); if (!bank) return fail(c,'NOT_FOUND','题库不存在',404); const parsed = normalizeQuestionInput(await parseBody(c)); if (!parsed.ok) return fail(c,'VALIDATION_ERROR',parsed.message,400); const timestamp=now(); const questionId=id(); await c.env.DB.batch([questionInsert(c.env.DB, parsed.value, questionId, user.id, timestamp), bankQuestionInsert(c.env.DB, bankId, questionId, timestamp)]); return json(c,{ id: questionId },201) })

app.post('/banks/:bankId/questions/import', async (c) => {
  const user = await requireUser(c); if (typeof user !== 'object') return user
  const bankId = c.req.param('bankId')
  const bank = await c.env.DB.prepare('SELECT id FROM question_banks WHERE id=? AND owner_id=? AND deleted_at IS NULL').bind(bankId, user.id).first()
  if (!bank) return fail(c, 'NOT_FOUND', '题库不存在', 404)
  const body = await parseBody(c)
  const list = Array.isArray(body?.questions) ? body.questions : []
  if (!list.length) return fail(c, 'VALIDATION_ERROR', '没有可导入的题目', 400)
  if (list.length > 100) return fail(c, 'VALIDATION_ERROR', '单次最多导入 100 道题', 400)
  const normalized: NormalizedQuestion[] = []
  const invalid: Array<{ index: number; code: ImportErrorCode; message: string }> = []
  list.forEach((item: any, index: number) => { const parsed = normalizeQuestionInput(item); if (parsed.ok) normalized.push(parsed.value); else invalid.push({ index, code: parsed.code, message: parsed.message }) })
  if (invalid.length) return c.json({ data: null, error: { code: 'VALIDATION_ERROR', message: '部分题目无效，未导入任何题目', invalid }, meta: {} }, 400)
  const timestamp = now()
  const statements: D1PreparedStatement[] = []
  for (const question of normalized) {
    const questionId = id()
    statements.push(questionInsert(c.env.DB, question, questionId, user.id, timestamp), bankQuestionInsert(c.env.DB, bankId, questionId, timestamp))
  }
  await c.env.DB.batch(statements)
  return json(c, { imported: normalized.length }, 201)
})

app.get('/banks/:bankId', async (c) => { const user = await requireUser(c); if (typeof user !== 'object') return user; const bankId = c.req.param('bankId'); const bank = await c.env.DB.prepare('SELECT id,name,description,visibility,status,created_at,updated_at,(SELECT COUNT(*) FROM bank_questions bq JOIN questions q ON q.id=bq.question_id AND q.deleted_at IS NULL WHERE bq.bank_id=question_banks.id) AS question_count,(SELECT json_object(\'id\',a.id,\'status\',a.status) FROM activities a WHERE a.bank_id=question_banks.id ORDER BY a.created_at DESC LIMIT 1) AS activity FROM question_banks WHERE id=? AND owner_id=? AND deleted_at IS NULL').bind(bankId,user.id).first() as any; if (!bank) return fail(c,'NOT_FOUND','题库不存在',404); if (bank && typeof bank.activity === 'string') { try { bank.activity = JSON.parse(bank.activity) } catch { bank.activity = null } } return json(c,bank) })

app.patch('/banks/:bankId', async (c) => { const user = await requireUser(c); if (typeof user !== 'object') return user; const bankId = c.req.param('bankId'); const bank = await c.env.DB.prepare('SELECT id FROM question_banks WHERE id=? AND owner_id=? AND deleted_at IS NULL').bind(bankId,user.id).first(); if (!bank) return fail(c,'NOT_FOUND','题库不存在',404); const body = await parseBody(c); const name = typeof body?.name === 'string' && body.name.trim() ? body.name.trim().slice(0,100) : null; const description = typeof body?.description === 'string' ? body.description.trim().slice(0,500) : null; const visibility = body?.visibility === 'public' ? 'public' : body?.visibility === 'private' ? 'private' : null; if (name === null && description === null && visibility === null) return fail(c,'VALIDATION_ERROR','没有需要更新的内容',400); const timestamp = now(); await c.env.DB.prepare('UPDATE question_banks SET name=COALESCE(?,name),description=COALESCE(?,description),visibility=COALESCE(?,visibility),updated_at=? WHERE id=?').bind(name,description,visibility,timestamp,bankId).run(); const updated = await c.env.DB.prepare('SELECT id,name,description,visibility,status,created_at,updated_at,(SELECT COUNT(*) FROM bank_questions bq JOIN questions q ON q.id=bq.question_id AND q.deleted_at IS NULL WHERE bq.bank_id=question_banks.id) AS question_count,(SELECT json_object(\'id\',a.id,\'status\',a.status) FROM activities a WHERE a.bank_id=question_banks.id ORDER BY a.created_at DESC LIMIT 1) AS activity FROM question_banks WHERE id=? AND deleted_at IS NULL').bind(bankId).first() as any; if (updated && typeof updated.activity === 'string') { try { updated.activity = JSON.parse(updated.activity) } catch { updated.activity = null } } return json(c,updated) })

app.get('/banks/:bankId/questions', async (c) => { const user = await requireUser(c); if (typeof user !== 'object') return user; const bankId = c.req.param('bankId'); const bank = await c.env.DB.prepare('SELECT id FROM question_banks WHERE id=? AND owner_id=? AND deleted_at IS NULL').bind(bankId,user.id).first(); if (!bank) return fail(c,'NOT_FOUND','题库不存在',404); const rows = await c.env.DB.prepare('SELECT q.id,q.type,q.stem,q.options_json,q.answer_json,q.explanation,q.difficulty,q.tags_json,q.created_at FROM bank_questions bq JOIN questions q ON q.id=bq.question_id WHERE bq.bank_id=? AND q.deleted_at IS NULL ORDER BY bq.position,q.created_at').bind(bankId).all(); const items = (rows.results || []).map((q:any)=>({ id:q.id, type:q.type, stem:q.stem, options:JSON.parse(q.options_json||'[]'), answer:JSON.parse(q.answer_json||'null'), explanation:q.explanation, difficulty:q.difficulty, tags:JSON.parse(q.tags_json||'[]'), created_at:q.created_at })); return json(c,items) })

app.delete('/banks/:bankId/questions/:questionId', async (c) => { const user = await requireUser(c); if (typeof user !== 'object') return user; const bankId = c.req.param('bankId'); const questionId = c.req.param('questionId'); const link = await c.env.DB.prepare('SELECT bq.question_id FROM bank_questions bq JOIN question_banks b ON b.id=bq.bank_id JOIN questions q ON q.id=bq.question_id WHERE bq.bank_id=? AND bq.question_id=? AND b.owner_id=? AND b.deleted_at IS NULL AND q.deleted_at IS NULL').bind(bankId,questionId,user.id).first(); if (!link) return fail(c,'NOT_FOUND','题目不存在',404); const timestamp = now(); await c.env.DB.batch([c.env.DB.prepare('DELETE FROM bank_questions WHERE bank_id=? AND question_id=?').bind(bankId,questionId), c.env.DB.prepare('UPDATE questions SET deleted_at=?,updated_at=? WHERE id=?').bind(timestamp,timestamp,questionId)]); return json(c,{ ok: true }) })

app.post('/activities', async (c) => { const user = await requireUser(c); if (typeof user !== 'object') return user; const body=await parseBody(c); const bankId=typeof body?.bankId==='string'?body.bankId:''; const bank=await c.env.DB.prepare('SELECT b.id,b.visibility FROM question_banks b WHERE b.id=? AND b.owner_id=? AND b.deleted_at IS NULL').bind(bankId,user.id).first() as any; if (!bank) return fail(c,'NOT_FOUND','题库不存在',404); if (bank.visibility!=='public') return fail(c,'FORBIDDEN','题库为私密，请先在题库设置中改为公开',403); const activityId=id(); const token=randomToken(9); const timestamp=now(); await c.env.DB.prepare('INSERT INTO activities(id,owner_id,bank_id,title,description,share_token_hash,share_token,settings_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(activityId,user.id,bankId,typeof body.title==='string'&&body.title.trim()?body.title.trim().slice(0,100):'未命名答题活动',typeof body.description==='string'?body.description.slice(0,500):'',await sha256(token),token,JSON.stringify(body.settings||{}),timestamp,timestamp).run(); return json(c,{id:activityId,shareToken:token},201) })
app.post('/activities/:id/publish', async (c) => { const user=await requireUser(c); if(typeof user!=='object') return user; const activityId=c.req.param('id'); const activity=await c.env.DB.prepare('SELECT a.id,a.bank_id,a.status,b.visibility FROM activities a JOIN question_banks b ON b.id=a.bank_id WHERE a.id=? AND a.owner_id=?').bind(activityId,user.id).first() as any; if(!activity) return fail(c,'NOT_FOUND','活动不存在',404); if(activity.visibility!=='public') return fail(c,'FORBIDDEN','题库为私密，请先在题库设置中改为公开',403); const questions=await c.env.DB.prepare('SELECT q.id,q.type,q.stem,q.options_json,q.answer_json,q.explanation,q.tags_json,bq.position FROM bank_questions bq JOIN questions q ON q.id=bq.question_id WHERE bq.bank_id=? AND q.deleted_at IS NULL ORDER BY bq.position').bind(activity.bank_id).all() as any; if(!questions.results.length) return fail(c,'VALIDATION_ERROR','题库至少需要一道题',400); const statements=[c.env.DB.prepare('DELETE FROM activity_questions WHERE activity_id=?').bind(activityId),...questions.results.map((q: any) =>c.env.DB.prepare('INSERT INTO activity_questions(activity_id,question_id,position,type,stem,options_json,answer_json,explanation,tags_json,points) VALUES(?,?,?,?,?,?,?,?,?,?)').bind(activityId,q.id,q.position,q.type,q.stem,q.options_json,q.answer_json,q.explanation,q.tags_json||'[]',1)),c.env.DB.prepare('UPDATE activities SET status=\'published\',snapshot_version=snapshot_version+1,published_at=?,updated_at=? WHERE id=?').bind(now(),now(),activityId)]; await c.env.DB.batch(statements); return json(c,{id:activityId,status:'published',questionCount:questions.results.length}) })

app.get('/activities/:id/share', async (c) => { const user=await requireUser(c); if(typeof user!=='object') return user; const activityId=c.req.param('id'); const row=await c.env.DB.prepare('SELECT share_token,status FROM activities WHERE id=? AND owner_id=?').bind(activityId,user.id).first() as any; if(!row||!row.share_token) return fail(c,'NOT_FOUND','活动不存在',404); return json(c,{ shareToken: row.share_token, status: row.status }) })

app.post('/activities/:id/end', async (c) => { const user=await requireUser(c); if(typeof user!=='object') return user; const activityId=c.req.param('id'); const row=await c.env.DB.prepare('SELECT id,status FROM activities WHERE id=? AND owner_id=?').bind(activityId,user.id).first() as any; if(!row) return fail(c,'NOT_FOUND','活动不存在',404); if(row.status==='ended') return json(c,{id:activityId,status:'ended'}); const timestamp=now(); await c.env.DB.prepare('UPDATE activities SET status=\'ended\',updated_at=? WHERE id=?').bind(timestamp,activityId).run(); return json(c,{id:activityId,status:'ended'}) })

async function publicActivity(c:any) { const token=c.req.param('token'); return c.env.DB.prepare('SELECT a.id,a.title,a.description,a.status,b.name AS bank_name FROM activities a LEFT JOIN question_banks b ON b.id=a.bank_id WHERE a.share_token=?').bind(token).first() as any }
app.get('/public/activities/:token', async (c) => { const activity=await publicActivity(c); if(!activity) return fail(c,'NOT_FOUND','活动不存在',404); if(activity.status!=='published') return fail(c,'ACTIVITY_NOT_OPEN','活动当前不可答题',409); const questions=await c.env.DB.prepare('SELECT question_id AS id,type,stem,options_json AS options,tags_json AS tags,answer_json AS answer,explanation,points FROM activity_questions WHERE activity_id=? ORDER BY position').bind(activity.id).all() as any; return json(c,{...activity,questions:questions.results.map((q: any) =>({...q,options:JSON.parse(q.options),tags:JSON.parse(q.tags||'[]'),answer:JSON.parse(q.answer??'null')}))}) })
app.post('/public/activities/:token/start', async (c) => { const activity=await publicActivity(c); if(!activity || activity.status!=='published') return fail(c,'ACTIVITY_NOT_OPEN','活动当前不可答题',409); const body=await parseBody(c); const displayName=typeof body?.displayName==='string'?body.displayName.trim():''; if(!displayName || displayName.length>40) return fail(c,'VALIDATION_ERROR','请输入 1-40 位显示名',400); const respondentId=id(); const attemptId=id(); const timestamp=now(); await c.env.DB.batch([c.env.DB.prepare('INSERT INTO respondents(id,activity_id,display_name,anonymous_key,created_at) VALUES(?,?,?,?,?)').bind(respondentId,activity.id,displayName,randomToken(16),timestamp),c.env.DB.prepare('INSERT INTO attempts(id,activity_id,respondent_id,status,idempotency_key,started_at) VALUES(?,?,?,?,?,?)').bind(attemptId,activity.id,respondentId,'in_progress',randomToken(16),timestamp)]); return json(c,{attemptId,activityId:activity.id,displayName}) })
app.post('/public/activities/:token/submit', async (c) => { const activity=await publicActivity(c); if(!activity || activity.status!=='published') return fail(c,'ACTIVITY_NOT_OPEN','活动当前不可答题',409); const body=await parseBody(c); const attemptId=typeof body?.attemptId==='string'?body.attemptId:''; const answers=body?.answers && typeof body.answers==='object'?body.answers:{}; const attempt=await c.env.DB.prepare('SELECT id,started_at,status FROM attempts WHERE id=? AND activity_id=?').bind(attemptId,activity.id).first() as any; if(!attempt) return fail(c,'NOT_FOUND','答卷不存在',404); if(attempt.status==='submitted') { const result=await c.env.DB.prepare('SELECT score,total_points,duration_seconds FROM attempts WHERE id=?').bind(attemptId).first(); return json(c,result) } const questions=await c.env.DB.prepare('SELECT question_id,type,answer_json,points FROM activity_questions WHERE activity_id=?').bind(activity.id).all() as any; let score=0,total=0; const timestamp=now(); const writes=questions.results.map((q: any) =>{ const answer=answers[q.question_id]; const expected=JSON.parse(q.answer_json); let correct; if(q.type==='short_answer'){ correct=null } else if(q.type==='multiple_choice'){ const g=Array.isArray(answer)?[...answer].map(String).sort():[]; const e=Array.isArray(expected)?[...expected].map(String).sort():[]; correct=g.length===e.length&&g.every((v,i)=>v===e[i]) } else { correct=JSON.stringify(answer)===JSON.stringify(expected) } total+=q.type==='short_answer'?0:q.points; if(correct===true) score+=q.points; return c.env.DB.prepare('INSERT INTO attempt_answers(id,attempt_id,question_id,answer_json,is_correct,points,answered_at) VALUES(?,?,?,?,?,?,?)').bind(id(),attemptId,q.question_id,JSON.stringify(answer??null),correct===null?null:(correct?1:0),correct===null?null:(correct?q.points:0),timestamp) }); writes.push(c.env.DB.prepare('UPDATE attempts SET status=\'submitted\',score=?,total_points=?,duration_seconds=?,submitted_at=? WHERE id=? AND status=\'in_progress\'').bind(score,total,Math.max(0,Math.floor((Date.parse(timestamp)-Date.parse(attempt.started_at))/1000)),timestamp,attemptId)); await c.env.DB.batch(writes); return json(c,{attemptId,score,totalPoints:total,submittedAt:timestamp}) })
app.get('/activities/:id', async (c) => { const user=await requireUser(c); if(typeof user!=='object') return user; const activityId=c.req.param('id'); const activity=await c.env.DB.prepare('SELECT a.id,a.title,a.description,a.status,a.bank_id,a.published_at,(SELECT COUNT(*) FROM activity_questions aq WHERE aq.activity_id=a.id) AS question_count FROM activities a WHERE a.id=? AND a.owner_id=?').bind(activityId,user.id).first(); if(!activity) return fail(c,'NOT_FOUND','活动不存在',404); return json(c,activity) })

app.get('/activities/:id/results/respondents', async (c) => { const user=await requireUser(c); if(typeof user!=='object') return user; const activityId=c.req.param('id'); const activity=await c.env.DB.prepare('SELECT id FROM activities WHERE id=? AND owner_id=?').bind(activityId,user.id).first(); if(!activity) return fail(c,'NOT_FOUND','活动不存在',404); const rows=await c.env.DB.prepare('SELECT r.id,r.display_name,r.created_at AS started_at,a.status,a.score,a.total_points,a.duration_seconds,a.submitted_at FROM respondents r LEFT JOIN attempts a ON a.respondent_id=r.id AND a.activity_id=r.activity_id WHERE r.activity_id=? ORDER BY CASE WHEN a.submitted_at IS NULL THEN 1 ELSE 0 END,a.submitted_at DESC').bind(activityId).all(); return json(c,rows.results) })

app.get('/activities/:id/results/respondents/:respondentId', async (c) => { const user=await requireUser(c); if(typeof user!=='object') return user; const activityId=c.req.param('id'); const respondentId=c.req.param('respondentId'); const activity=await c.env.DB.prepare('SELECT id FROM activities WHERE id=? AND owner_id=?').bind(activityId,user.id).first(); if(!activity) return fail(c,'NOT_FOUND','活动不存在',404); const resp=await c.env.DB.prepare('SELECT r.id,r.display_name,r.created_at,a.id AS attempt_id,a.status,a.score,a.total_points,a.duration_seconds,a.submitted_at FROM respondents r LEFT JOIN attempts a ON a.respondent_id=r.id WHERE r.id=? AND r.activity_id=?').bind(respondentId,activityId).first() as any; if(!resp) return fail(c,'NOT_FOUND','答题者不存在',404); const rows=await c.env.DB.prepare('SELECT aq.question_id AS id,aq.position,aq.stem,aq.type,aq.options_json,aq.answer_json,aq.explanation,aa.answer_json AS given_json,aa.is_correct FROM activity_questions aq LEFT JOIN attempt_answers aa ON aa.attempt_id=? AND aa.question_id=aq.question_id WHERE aq.activity_id=? ORDER BY aq.position').bind(resp.attempt_id??'',activityId).all(); const questions=(rows.results||[]).map((q:any)=>({ id:q.id, position:q.position, stem:q.stem, type:q.type, options:JSON.parse(q.options_json||'[]'), correctAnswer:JSON.parse(q.answer_json||'null'), givenAnswer:q.given_json?JSON.parse(q.given_json):null, isCorrect:q.is_correct===null||q.is_correct===undefined?null:!!q.is_correct, explanation:q.explanation })); return json(c,{ respondent:{ id:resp.id, displayName:resp.display_name, status:resp.status, score:resp.score, totalPoints:resp.total_points, durationSeconds:resp.duration_seconds, submittedAt:resp.submitted_at }, questions }) })

app.get('/activities/:id/results/summary', async (c) => { const user=await requireUser(c); if(typeof user!=='object') return user; const activityId=c.req.param('id'); const owner=await c.env.DB.prepare('SELECT id FROM activities WHERE id=? AND owner_id=?').bind(activityId,user.id).first(); if(!owner) return fail(c,'NOT_FOUND','活动不存在',404); const summary=await c.env.DB.prepare('SELECT COUNT(*) AS total,SUM(CASE WHEN status=\'submitted\' THEN 1 ELSE 0 END) AS submitted,AVG(score) AS average_score FROM attempts WHERE activity_id=?').bind(activityId).first(); return json(c,summary) })

export default app
