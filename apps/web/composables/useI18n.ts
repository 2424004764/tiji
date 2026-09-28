import {
  defaultLocale,
  localeCookieMaxAge,
  localeCookieName,
  locales,
  messages,
  type InterpolationParams,
  type MessageKey,
  type SupportedLocale
} from '@tiji/i18n'

export type { SupportedLocale, MessageKey }
export { locales, defaultLocale }

type Params = InterpolationParams

function lookup(source: unknown, key: string): string | undefined {
  let node: unknown = source
  for (const part of key.split('.')) {
    if (node && typeof node === 'object' && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(template: string, params?: Params): string {
  let text = template
  // 英文复数：`1 question | {n} questions`，按参数 n 选择
  if (params && typeof params.n === 'number' && text.includes(' | ')) {
    const [singular, plural] = text.split(' | ')
    text = params.n === 1 ? singular : plural
  }
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match))
}

function detectLocale(): SupportedLocale {
  let language = ''
  if (import.meta.server) {
    language = useRequestHeaders(['accept-language'])['accept-language'] ?? ''
  } else if (typeof navigator !== 'undefined') {
    language = navigator.language ?? ''
  }
  return language.trim().toLowerCase().startsWith('en') ? 'en-US' : defaultLocale
}

/**
 * 轻量国际化：语言优先级为用户 cookie 设置 -> Accept-Language -> 默认 zh-CN。
 * `t()` 在渲染中读取 locale，切换语言后所有文案即时更新。
 */
export function useI18n() {
  const cookie = useCookie<SupportedLocale | null>(localeCookieName, { maxAge: localeCookieMaxAge, sameSite: 'lax' })
  const locale = useState<SupportedLocale>('locale', () => {
    if (cookie.value && cookie.value in messages) return cookie.value
    return detectLocale()
  })

  function t(key: MessageKey, params?: Params): string {
    const template = lookup(messages[locale.value], key) ?? lookup(messages[defaultLocale], key) ?? key
    return interpolate(template, params)
  }

  function setLocale(next: SupportedLocale) {
    locale.value = next
    cookie.value = next
  }

  function toggleLocale() {
    setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
  }

  /** API 错误码优先映射为当前语言文案，其次回退服务端消息 */
  function apiError(err: unknown, fallbackKey?: MessageKey): string {
    const code = (err as { data?: { error?: { code?: string } } })?.data?.error?.code
    const serverMessage = (err as { data?: { error?: { message?: string } } })?.data?.error?.message
    if (code && code in messages[locale.value].api.errors) return t(`api.errors.${code}` as MessageKey)
    if (serverMessage) return serverMessage
    return fallbackKey ? t(fallbackKey) : t('api.errors.INTERNAL_ERROR')
  }

  function formatDate(value: string): string {
    try {
      return new Date(value).toLocaleDateString(locale.value, { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return value
    }
  }

  function formatDateTime(value: string | null): string {
    if (!value) return ''
    try {
      return new Date(value).toLocaleString(locale.value, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    } catch {
      return value
    }
  }

  function formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return ''
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? t('results.durationMinutes', { m, s }) : t('results.durationSeconds', { s })
  }

  return { locale, locales, t, setLocale, toggleLocale, apiError, formatDate, formatDateTime, formatDuration }
}
