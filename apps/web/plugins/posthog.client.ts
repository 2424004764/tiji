import posthog from 'posthog-js'

type PosthogClient = typeof posthog | null

// 仅客户端运行;未配置 NUXT_PUBLIC_POSTHOG_KEY 时整个插件静默禁用
export default defineNuxtPlugin((nuxtApp): { provide: { posthog: PosthogClient } } => {
  const config = useRuntimeConfig()
  const key = config.public.posthogKey
  if (!key) return { provide: { posthog: null } }

  // SPA 路由切换不会触发自动 pageview,改为在 afterEach 手动上报
  posthog.init(key, {
    api_host: config.public.posthogHost || 'https://us.i.posthog.com',
    capture_pageview: false,
    autocapture: true,
    persistence: 'localStorage+cookie'
  })

  const router = useRouter()
  router.afterEach((to) => {
    posthog.capture('$pageview', { $current_url: to.fullPath })
  })

  // 跟随登录态识别用户:登录后 identify,登出后 reset,避免跨用户混淆
  const { user } = useAuth()
  let identifiedId: string | null = null
  watch(
    user,
    (next) => {
      const id = next?.id ?? null
      if (id === identifiedId) return
      if (id) {
        identifiedId = id
        posthog.identify(id, { username: next?.username })
      } else {
        identifiedId = null
        posthog.reset()
      }
    },
    { immediate: true }
  )

  nuxtApp.hook('vue:error', (err) => {
    posthog.captureException(err)
  })

  return { provide: { posthog } }
})
