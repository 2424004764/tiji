export interface AuthUser {
  id: string
  username: string
  locale?: string
  timezone?: string
}

export const useAuth = () => {
  const user = useState<AuthUser | null>('auth:user', () => null)
  const ready = useState<boolean>('auth:ready', () => false)
  const config = useRuntimeConfig()
  const requestFetch = useRequestFetch()

  async function refresh() {
    try {
      const res = await requestFetch<{ data: AuthUser | null }>(`${config.public.apiBase}/auth/me`, { credentials: 'include' })
      user.value = res.data ?? null
    } catch {
      user.value = null
    } finally {
      ready.value = true
    }
  }

  function setAuthenticated(next: AuthUser) {
    user.value = next
    ready.value = true
  }

  async function logout() {
    try {
      await $fetch(`${config.public.apiBase}/auth/logout`, { method: 'POST', credentials: 'include' })
    } finally {
      user.value = null
    }
  }

  return { user, ready, refresh, setAuthenticated, logout }
}
