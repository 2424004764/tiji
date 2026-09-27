export const messages = {
  'zh-CN': {
    appName: '题迹',
    activity: { start: '开始答题', submit: '提交答卷' },
    auth: { login: '登录', register: '注册' }
  },
  'en-US': {
    appName: 'Tiji',
    activity: { start: 'Start quiz', submit: 'Submit answers' },
    auth: { login: 'Log in', register: 'Create account' }
  }
} as const

export type SupportedLocale = keyof typeof messages
