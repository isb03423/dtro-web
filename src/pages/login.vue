<script setup>
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const form = ref({ username: '', password: '', remember: false })
const loginError = ref('')
const isSubmitting = ref(false)

// 로그인 양식을 제출하고 성공하면 대시보드로 이동한다.
const fn_submit = async () => {
  isSubmitting.value = true
  try {
    await authStore.login(form.value.username, form.value.password)
    loginError.value = ''
    await router.push('/dashboard')
  }
  catch (error) {
    loginError.value = error.status === 401
      ? '아이디 또는 비밀번호가 일치하지 않습니다.'
      : error.message
  }
  finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <VCard tag="section" class="auth-card" elevation="0" aria-labelledby="login-title">
    <div class="auth-card__heading">
      <h1 id="login-title">로그인</h1>
      <p>서비스 이용을 위해 정보를 입력해 주세요.</p>
    </div>

    <form @submit.prevent="fn_submit">
      <label for="login-id">아이디</label>
      <input id="login-id" v-model="form.username" type="text" autocomplete="username" placeholder="아이디를 입력해 주세요." required @input="loginError = ''">

      <label for="login-password">비밀번호</label>
      <input id="login-password" v-model="form.password" type="password" autocomplete="current-password" placeholder="비밀번호를 입력해 주세요." required :aria-invalid="Boolean(loginError)" aria-describedby="login-error" @input="loginError = ''">

      <p v-if="loginError" id="login-error" class="auth-card__error" role="alert">{{ loginError }}</p>

      <label class="auth-card__check">
        <input v-model="form.remember" type="checkbox">
        <span>아이디 저장</span>
      </label>

      <VBtn class="auth-card__submit" type="submit" variant="flat" block :loading="isSubmitting">로그인</VBtn>
    </form>

    <p class="auth-card__link">
      회원이 아니신가요?
      <RouterLink to="/register">회원가입</RouterLink>
    </p>
  </VCard>
</template>

