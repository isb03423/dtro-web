<script setup>
const router = useRouter()
const form = ref({ username: '', password: '', passwordConfirm: '', name: '', email: '', phone: '', agreement: false })
// 비밀번호와 확인 입력값이 서로 다른지 판단한다.
const passwordMismatch = computed(() => form.value.passwordConfirm && form.value.password !== form.value.passwordConfirm)

// 비밀번호 일치 여부를 확인하고 로그인 화면으로 이동한다.
const fn_submit = () => {
  if (!passwordMismatch.value)
    router.push('/login')
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
      <input id="register-id" v-model="form.username" type="text" autocomplete="username" placeholder="아이디를 입력해 주세요." required>

      <label for="register-password">비밀번호</label>
      <input id="register-password" v-model="form.password" type="password" autocomplete="new-password" placeholder="비밀번호를 입력해 주세요." required>

      <label for="register-password-confirm">비밀번호 확인</label>
      <input id="register-password-confirm" v-model="form.passwordConfirm" type="password" autocomplete="new-password" placeholder="비밀번호를 다시 입력해 주세요." :aria-invalid="Boolean(passwordMismatch)" required>
      <span v-if="passwordMismatch" class="auth-card__error">비밀번호가 일치하지 않습니다.</span>

      <label for="register-name">이름</label>
      <input id="register-name" v-model="form.name" type="text" autocomplete="name" placeholder="이름을 입력해 주세요." required>

      <label for="register-email">이메일</label>
      <input id="register-email" v-model="form.email" type="email" autocomplete="email" placeholder="이메일을 입력해 주세요." required>

      <label for="register-phone">전화번호</label>
      <input id="register-phone" v-model="form.phone" type="tel" autocomplete="tel" placeholder="전화번호를 입력해 주세요." required>

      <label class="auth-card__check auth-card__check--agreement">
        <input v-model="form.agreement" type="checkbox" required>
        <span>이용약관 및 개인정보 수집·이용 동의 (필수)</span>
      </label>

      <VBtn class="auth-card__submit" type="submit" variant="flat" block>회원가입</VBtn>
    </form>

    <p class="auth-card__link">
      이미 회원이신가요?
      <RouterLink to="/login">로그인</RouterLink>
    </p>
  </VCard>
</template>

