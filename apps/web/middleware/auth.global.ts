export default defineNuxtRouteMiddleware(async (to) => {
  // 公开答题页不需要登录态：跳过 /auth/me，避免好友端出现无意义的 401
  if (to.path.startsWith('/activity/')) {
    useAuth().ready.value = true
    return
  }
  await useAuth().refresh()
})
