/** Excel 批量导入题目：把二维行数组解析为题目数据（纯函数，便于测试） */

export interface ImportOption { value: string; label: string }
export interface ImportQuestion {
  type: 'single_choice' | 'multiple_choice' | 'true_false'
  stem: string
  options?: ImportOption[]
  answer: string | string[]
  explanation: string
  difficulty: number
  tags: string[]
}
export type ImportErrorCode = 'invalidStem' | 'invalidOptions' | 'invalidAnswer'
export interface ImportRowError { row: number; code: ImportErrorCode }
export interface ImportParseResult { questions: ImportQuestion[]; errors: ImportRowError[]; totalRows: number }

export const IMPORT_LIMIT = 100
const OPTION_LETTERS = 'ABCDEF'

const TF_TRUE = ['正确', '对', '是', '√', 't', 'true', 'yes', 'y']
const TF_FALSE = ['错误', '错', '否', '×', 'f', 'false', 'no', 'n']
const HEADER_STEM = ['题干', '题目', '题目内容', 'stem', 'question']
const HEADER_ANSWER = ['答案', '正确答案', 'answer']
const HEADER_EXPLANATION = ['解析', '答案解析', '解释', 'explanation']
const HEADER_DIFFICULTY = ['难度', 'difficulty']
const HEADER_TAGS = ['标签', '分类', '分类标签', 'tags']

const cell = (value: unknown) => String(value ?? '').replace(/\u00a0/g, ' ').trim()
const normalizeHeader = (value: unknown) => cell(value).toLowerCase().replace(/[\s（）()：:．.·、，,-]/g, '')

interface ColumnMap { stem: number; options: number[]; answer: number; explanation: number; difficulty: number; tags: number }

/** 无表头时按下载模板的固定列序读取：题干 | A-F | 答案 | 解析 | 难度 | 标签 */
const FIXED_COLUMNS: ColumnMap = { stem: 0, options: [1, 2, 3, 4, 5, 6], answer: 7, explanation: 8, difficulty: 9, tags: 10 }

function detectHeaderColumns(firstRow: unknown[]): ColumnMap | null {
  const headers = firstRow.map(normalizeHeader)
  const stem = headers.findIndex((h) => HEADER_STEM.includes(h))
  const answer = headers.findIndex((h) => HEADER_ANSWER.includes(h))
  if (stem < 0 || answer < 0) return null
  const columns: ColumnMap = { stem, options: [], answer, explanation: -1, difficulty: -1, tags: -1 }
  headers.forEach((header, index) => {
    if (/^(?:选项|option|opt)?[a-f]$/.test(header)) columns.options.push(index)
  })
  const explanation = headers.findIndex((h) => HEADER_EXPLANATION.includes(h))
  if (explanation >= 0) columns.explanation = explanation
  const difficulty = headers.findIndex((h) => HEADER_DIFFICULTY.includes(h))
  if (difficulty >= 0) columns.difficulty = difficulty
  const tags = headers.findIndex((h) => HEADER_TAGS.includes(h))
  if (tags >= 0) columns.tags = tags
  return columns
}

const readCell = (cells: unknown[], index: number) => (index >= 0 ? cell(cells[index]) : '')

function parseAnswer(value: string, optionCount: number): { ok: true; answer: string | string[] } | { ok: false } {
  if (optionCount > 0) {
    const letters = [...new Set((value.toUpperCase().match(/[A-F]/g) ?? []).filter((letter) => OPTION_LETTERS.indexOf(letter) < optionCount))].sort()
    if (!letters.length) return { ok: false }
    return { ok: true, answer: letters.length > 1 ? letters.map((l) => l.toLowerCase()) : letters[0].toLowerCase() }
  }
  const normalized = value.toLowerCase().replace(/[\s。]/g, '')
  if (TF_TRUE.includes(normalized)) return { ok: true, answer: 'true' }
  if (TF_FALSE.includes(normalized)) return { ok: true, answer: 'false' }
  return { ok: false }
}

const parseDifficulty = (value: unknown) => {
  const num = Number(cell(value))
  if (!Number.isFinite(num) || num <= 0) return 3
  return Math.min(5, Math.max(1, Math.round(num)))
}

const parseTags = (value: unknown) => cell(value).split(/[,，、;；]+/).map((tag) => tag.trim()).filter(Boolean)

export function parseImportRows(rows: unknown[][]): ImportParseResult {
  const questions: ImportQuestion[] = []
  const errors: ImportRowError[] = []
  let totalRows = 0
  if (!rows.length) return { questions, errors, totalRows }

  const headerColumns = detectHeaderColumns(rows[0])
  const columns = headerColumns ?? FIXED_COLUMNS
  const dataRows = headerColumns ? rows.slice(1) : rows

  dataRows.forEach((raw) => {
    const cells = Array.isArray(raw) ? raw : []
    if (cells.every((value) => !cell(value))) return
    totalRows++
    if (totalRows > IMPORT_LIMIT) return
    const row = totalRows + (headerColumns ? 1 : 0)

    const stem = readCell(cells, columns.stem).replace(/^\d+\s*[.、．)）]\s*/, '')
    if (!stem) { errors.push({ row, code: 'invalidStem' }); return }

    const labels = columns.options.map((index) => readCell(cells, index))
      .map((label) => label.replace(/^[A-Fa-f][.、．:：)）]\s*/, '').trim())
      .filter(Boolean)
    if (labels.length) {
      if (labels.length < 2) { errors.push({ row, code: 'invalidOptions' }); return }
      const answer = parseAnswer(readCell(cells, columns.answer), labels.length)
      if (!answer.ok) { errors.push({ row, code: 'invalidAnswer' }); return }
      questions.push({
        type: Array.isArray(answer.answer) ? 'multiple_choice' : 'single_choice',
        stem,
        options: labels.map((label, i) => ({ value: OPTION_LETTERS[i].toLowerCase(), label })),
        answer: answer.answer,
        explanation: readCell(cells, columns.explanation),
        difficulty: parseDifficulty(cells[columns.difficulty]),
        tags: parseTags(cells[columns.tags])
      })
      return
    }

    const answer = parseAnswer(readCell(cells, columns.answer), 0)
    if (!answer.ok) { errors.push({ row, code: 'invalidAnswer' }); return }
    questions.push({
      type: 'true_false',
      stem,
      options: [{ value: 'true', label: '正确' }, { value: 'false', label: '错误' }],
      answer: answer.answer as string,
      explanation: readCell(cells, columns.explanation),
      difficulty: parseDifficulty(cells[columns.difficulty]),
      tags: parseTags(cells[columns.tags])
    })
  })

  return { questions, errors, totalRows }
}
