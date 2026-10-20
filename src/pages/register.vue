<script setup>
import { fn_registerMember } from '@/features/member/api/memberApi'

const router = useRouter()
const form = ref({ userid: '', password: '', passwordConfirm: '', name: '', email: '', phone: '', agreement: false })
const errors = ref({})
const pageError = ref('')
const submitting = ref(false)

// 비밀번호와 확인 입력값이 서로 다른지 판단한다.
const passwordMismatch = computed(() => Boolean(form.value.passwordConfirm && form.value.password !== form.value.passwordConfirm))

const fn_submit = async () => {
  errors.value = {}
  pageError.value = ''
  if (passwordMismatch.value) {
    errors.value.passwordConfirm = '비밀번호가 일치하지 않습니다.'

    return
  }

  submitting.value = true
  try {
    await fn_registerMember({
      userid: form.value.userid.trim(),
      password: form.value.password,
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim(),
      agreement: form.value.agreement,
    })
    await router.push({ path: '/login', query: { registered: '1' } })
  } catch (error) {
    pageError.value = error.message
    if (error.status === 409) {
      errors.value.userid = error.message
    }
    for (const detail of error.details ?? []) {
      const [field, message] = detail.split(': ', 2)
      if (field in form.value) {
        errors.value[field] = message
      }
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <VCard tag="section" class="auth-card auth-card--register" elevation="0" aria-labelledby="register-title">
    <div class="auth-card__heading">
      <h1 id="register-title">회원가입</h1>
      <p>서비스 이용을 위해 정보를 입력해 주세요.</p>
    </div>

    <form @submit.prevent="fn_submit">
      <label for="register-id">아이디</label>
      <input id="register-id" v-model="form.userid" type="text" autocomplete="username" placeholder="아이디를 입력해 주세요." minlength="4" maxlength="50" :aria-invalid="Boolean(errors.userid)" required>
      <span v-if="errors.userid" class="auth-card__error">{{ errors.userid }}</span>

      <label for="register-password">비밀번호</label>
      <input id="register-password" v-model="form.password" type="password" autocomplete="new-password" placeholder="8자 이상 입력해 주세요." minlength="8" maxlength="72" :aria-invalid="Boolean(errors.password)" required>
      <span v-if="errors.password" class="auth-card__error">{{ errors.password }}</span>

      <label for="register-password-confirm">비밀번호 확인</label>
      <input id="register-password-confirm" v-model="form.passwordConfirm" type="password" autocomplete="new-password" placeholder="비밀번호를 다시 입력해 주세요." :aria-invalid="Boolean(passwordMismatch)" required>
      <span v-if="passwordMismatch || errors.passwordConfirm" class="auth-card__error">{{ errors.passwordConfirm || '비밀번호가 일치하지 않습니다.' }}</span>

      <label for="register-name">이름</label>
      <input id="register-name" v-model="form.name" type="text" autocomplete="name" placeholder="이름을 입력해 주세요." maxlength="50" :aria-invalid="Boolean(errors.name)" required>
      <span v-if="errors.name" class="auth-card__error">{{ errors.name }}</span>

      <label for="register-email">이메일</label>
      <input id="register-email" v-model="form.email" type="email" autocomplete="email" placeholder="이메일을 입력해 주세요." maxlength="254" :aria-invalid="Boolean(errors.email)" required>
      <span v-if="errors.email" class="auth-card__error">{{ errors.email }}</span>

      <label for="register-phone">전화번호</label>
      <input id="register-phone" v-model="form.phone" type="tel" autocomplete="tel" placeholder="전화번호를 입력해 주세요." maxlength="30" :aria-invalid="Boolean(errors.phone)" required>
      <span v-if="errors.phone" class="auth-card__error">{{ errors.phone }}</span>

      <label class="auth-card__check auth-card__check--agreement">
        <input v-model="form.agreement" type="checkbox" required>
        <span>이용약관 및 개인정보 수집·이용 동의 (필수)</span>
      </label>
      <span v-if="errors.agreement" class="auth-card__error">{{ errors.agreement }}</span>

      <p v-if="pageError" class="auth-card__error" role="alert">{{ pageError }}</p>
      <VBtn class="auth-card__submit" type="submit" variant="flat" block :loading="submitting" :disabled="submitting">회원가입</VBtn>
    </form>

    <p class="auth-card__link">
      이미 회원이신가요?
      <RouterLink to="/login">로그인</RouterLink>
    </p>
  </VCard>
</template>

