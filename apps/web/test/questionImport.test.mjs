import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseImportRows, IMPORT_LIMIT } from '../utils/questionImport.ts'

test('带表头：单选 / 多选 / 判断自动识别', () => {
  const rows = [
    ['题干', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '答案', '解析', '难度', '标签'],
    ['在 Photoshop 中新建文档默认的色彩模式是？', 'CMYK', 'RGB', '灰度', 'LAB', '', '', 'B', '默认 RGB', 3, 'PS,基础'],
    ['下列哪些属于前端语言？', 'HTML', 'CSS', 'JS', 'Python', '', '', 'A、B、C', '', 2, '前端'],
    ['HTTP 404 表示资源未找到。', '', '', '', '', '', '', '正确', '', '', '']
  ]
  const result = parseImportRows(rows)
  assert.deepEqual(result.errors, [])
  assert.equal(result.totalRows, 3)
  assert.deepEqual(result.questions.map((q) => q.type), ['single_choice', 'multiple_choice', 'true_false'])
  assert.equal(result.questions[0].answer, 'b')
  assert.deepEqual(result.questions[0].options, [
    { value: 'a', label: 'CMYK' }, { value: 'b', label: 'RGB' }, { value: 'c', label: '灰度' }, { value: 'd', label: 'LAB' }
  ])
  assert.deepEqual(result.questions[1].answer, ['a', 'b', 'c'])
  assert.equal(result.questions[2].answer, 'true')
  assert.deepEqual(result.questions[0].tags, ['PS', '基础'])
})

test('无表头按固定列序读取', () => {
  const rows = [
    ['地球绕太阳转。', '', '', '', '', '', '', '对', '', '', ''],
    ['1+1 等于？', '1', '2', '3', '4', '', '', 'B', '', '', '']
  ]
  const result = parseImportRows(rows)
  assert.deepEqual(result.errors, [])
  assert.equal(result.questions.length, 2)
  assert.equal(result.questions[0].type, 'true_false')
  assert.equal(result.questions[1].answer, 'b')
})

test('无表头时首行是数据（含题干与答案列序）', () => {
  const rows = [
    ['天空是什么颜色？', '红', '蓝', '', '', '', '', 'B', '', 1, '常识']
  ]
  const result = parseImportRows(rows)
  assert.deepEqual(result.errors, [])
  assert.equal(result.questions[0].stem, '天空是什么颜色？')
  assert.equal(result.questions[0].answer, 'b')
  assert.equal(result.questions[0].difficulty, 1)
})

test('表头为英文列名也能识别', () => {
  const rows = [
    ['Question', 'Option A', 'Option B', 'Option C', 'Option D', '', '', 'Answer', 'Explanation', 'Difficulty', 'Tags'],
    ['Which is a color?', 'Red', 'Blue', '', '', '', '', 'A', '', '', '']
  ]
  const result = parseImportRows(rows)
  assert.deepEqual(result.errors, [])
  assert.equal(result.questions[0].answer, 'a')
})

test('答案写法：字母带分隔符 / 判断多种写法', () => {
  const rows = [
    ['题干', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '答案', '解析', '难度', '标签'],
    ['Q1', '甲', '乙', '丙', '丁', '', '', 'B D', '', '', ''],
    ['Q2', '甲', '乙', '丙', '', '', '', 'A、C', '', '', ''],
    ['Q3', '', '', '', '', '', '', '错误', '', '', ''],
    ['Q4', '', '', '', '', '', '', 'F', '', '', ''],
    ['Q5', '', '', '', '', '', '', '√', '', '', ''],
    ['Q6', '', '', '', '', '', '', '×', '', '', '']
  ]
  const result = parseImportRows(rows)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.questions[0].answer, ['b', 'd'])
  assert.deepEqual(result.questions[1].answer, ['a', 'c'])
  assert.equal(result.questions[2].answer, 'false')
  assert.equal(result.questions[3].answer, 'false')
  assert.equal(result.questions[4].answer, 'true')
  assert.equal(result.questions[5].answer, 'false')
})

test('错误行：缺题干 / 选项不足 / 答案无法识别，行号含表头偏移', () => {
  const rows = [
    ['题干', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '答案', '解析', '难度', '标签'],
    ['', '甲', '乙', '', '', '', '', 'A', '', '', ''],
    ['只有一个选项', '甲', '', '', '', '', '', 'A', '', '', ''],
    ['答案越界', '甲', '乙', '', '', '', '', 'E', '', '', ''],
    ['乱写的答案', '甲', '乙', '', '', '', '', '二十五', '', '', ''],
    ['判断乱写', '', '', '', '', '', '', '不知道', '', '', ''],
    ['正确的一题', '甲', '乙', '', '', '', '', 'B', '', '', '']
  ]
  const result = parseImportRows(rows)
  assert.equal(result.questions.length, 1)
  assert.deepEqual(result.errors, [
    { row: 2, code: 'invalidStem' },
    { row: 3, code: 'invalidOptions' },
    { row: 4, code: 'invalidAnswer' },
    { row: 5, code: 'invalidAnswer' },
    { row: 6, code: 'invalidAnswer' }
  ])
})

test('空白行跳过、题干序号与选项前缀剥离', () => {
  const rows = [
    [],
    ['1. 第一道题？', 'A. 甲', 'B. 乙', '', '', '', '', '答案：A', '', '', '']
  ]
  const result = parseImportRows(rows)
  assert.deepEqual(result.errors, [])
  assert.equal(result.questions[0].stem, '第一道题？')
  assert.equal(result.questions[0].options[0].label, '甲')
})

test('难度取整与夹取、非法难度回退 3', () => {
  const rows = [
    ['题干', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '答案', '解析', '难度', '标签'],
    ['Q1', '甲', '乙', '', '', '', '', 'A', '', 99, ''],
    ['Q2', '甲', '乙', '', '', '', '', 'A', '', 4.4, ''],
    ['Q3', '甲', '乙', '', '', '', '', 'A', '', '中等', ''],
    ['Q4', '', '', '', '', '', '', '正确', '', 0, '']
  ]
  const result = parseImportRows(rows)
  assert.deepEqual(result.questions.map((q) => q.difficulty), [5, 4, 3, 3])
})

test('超过上限：只保留前 100 行并记录总行数', () => {
  const header = ['题干', '选项A', '选项B', '选项C', '选项D', '选项E', '选项F', '答案', '解析', '难度', '标签']
  const rows = [header]
  for (let i = 0; i < IMPORT_LIMIT + 30; i++) rows.push([`Q${i}`, '甲', '乙', '', '', '', '', 'A', '', '', ''])
  const result = parseImportRows(rows)
  assert.equal(result.totalRows, IMPORT_LIMIT + 30)
  assert.equal(result.questions.length, IMPORT_LIMIT)
})

test('空文件与全空行', () => {
  assert.equal(parseImportRows([]).totalRows, 0)
  const result = parseImportRows([['', ''], ['  ', '']])
  assert.equal(result.totalRows, 0)
  assert.deepEqual(result.questions, [])
})
