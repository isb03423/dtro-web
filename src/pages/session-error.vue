<script setup>
import { useAuthStore } from '@/stores/auth'
import { APP_ROLES } from '@/config/sideMenu'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const checking = ref(false)
const errorMessage = ref('로그인 상태를 확인하지 못했습니다. 다시 시도해 주세요.')

const fn_retry = async () => {
  checking.value = true
  try {
    await authStore.restore()
    if (!authStore.isAuthenticated) {
      await router.push('/login')

      return
    }
    const redirect = route.query.redirect

    const fallback = authStore.role === APP_ROLES.ADMIN ? '/admin/dashboard' : '/dashboard'

    await router.push(typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : fallback)
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <VCard tag="section" class="auth-card" elevation="0" aria-labelledby="session-error-title">
    <div class="auth-card__heading">
      <h1 id="session-error-title">연결을 확인해 주세요</h1>
      <p>로그인 상태를 확인하는 중 문제가 발생했습니다.</p>
    </div>
    <p class="auth-card__error" role="alert">{{ errorMessage }}</p>
    <VBtn class="auth-card__submit" variant="flat" block :loading="checking" @click="fn_retry">다시 시도</VBtn>
  </VCard>
</template>
