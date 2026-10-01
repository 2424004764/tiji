// 临时 mock API:仅用于本地验证答题页导航布局(上一题/下一题按钮不被挤压)
import http from 'node:http'

const N = 33
const questions = Array.from({ length: N }, (_, i) => ({
  id: `q${i + 1}`,
  type: 'single_choice',
  stem: `第 ${i + 1} 题:在 Photoshop 中,新建文档时默认且最适合用于网页、屏幕显示的色彩模式是?`,
  tags: ['PS', '基础'],
  options: [
    { value: 'a', label: 'CMYK 模式' },
    { value: 'b', label: 'RGB 模式' },
    { value: 'c', label: '灰度模式' },
    { value: 'd', label: 'LAB 模式' }
  ]
}))

const json = (res, code, body) => {
  res.writeHead(code, {
    'content-type': 'application/json',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type'
  })
  res.end(JSON.stringify(body))
}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (req.method === 'OPTIONS') return json(res, 204, {})
  if (req.method === 'GET' && /^\/api\/v1\/public\/activities\/[^/]+$/.test(url.pathname)) {
    return json(res, 200, { data: { title: 'Photoshop(PS)基础知识点试题集', description: 'Photoshop(PS)基础知识点试题集', bank_name: 'Photoshop(PS)基础知识点试题集', questions } })
  }
  if (req.method === 'POST' && /\/start$/.test(url.pathname)) return json(res, 200, { data: { attemptId: 'mock-attempt' } })
  if (req.method === 'POST' && /\/submit$/.test(url.pathname)) return json(res, 200, { data: { score: 90, totalPoints: 100 } })
  json(res, 404, { error: { code: 'NOT_FOUND' } })
}).listen(8799, () => console.log('mock api on http://localhost:8799'))
