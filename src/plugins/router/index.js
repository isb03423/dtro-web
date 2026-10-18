import { createRouter, createWebHistory } from 'vue-router'
import { store } from '@/plugins/pinia'
import { useAuthStore } from '@/stores/auth'
import { APP_ROLES } from '@/config/sideMenu'
import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash }
    }

    return { top: 0 }
  },
})

router.beforeEach(async to => {
  const authStore = useAuthStore(store)

  if (to.meta.requiresAuth || to.path === '/') {
    try {
      await authStore.restore(Boolean(to.meta.roles))
    } catch {
      return { path: '/session-error', query: { redirect: to.fullPath } }
    }
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return '/login'
  }

  if (to.meta.roles && !to.meta.roles.includes(authStore.role)) {
    return '/forbidden'
  }

  if (to.path === '/' && authStore.isAuthenticated) {
    return authStore.role === APP_ROLES.ADMIN ? '/admin/dashboard' : '/dashboard'
  }
})

export default function (app) {
  app.use(router)
}
export { router }
