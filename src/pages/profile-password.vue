<script setup>
import { fn_changeMemberPassword } from '@/api/memberApi'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const form = ref({ currentPassword: '', newPassword: '', passwordConfirm: '' })
const errors = ref({})
const pageError = ref('')
const saving = ref(false)
const passwordMismatch = computed(() => Boolean(form.value.passwordConfirm && form.value.newPassword !== form.value.passwordConfirm))

const fn_save = async () => {
  if (saving.value) {
    return
  }

  errors.value = {}
  pageError.value = ''
  if (passwordMismatch.value) {
    errors.value.passwordConfirm = '새 비밀번호가 일치하지 않습니다.'

    return
  }

  saving.value = true
  try {
    await fn_changeMemberPassword({
      currentPassword: form.value.currentPassword,
      newPassword: form.value.newPassword,
    })
    authStore.expire()
    await router.replace({ path: '/login', query: { passwordChanged: '1' } })
  } catch (error) {
    if (error.status === 401) {
      authStore.expire()
      await router.replace('/login')

      return
    }
    pageError.value = error.message
    if (error.code === 'MEMBER_CURRENT_PASSWORD_INVALID') {
      errors.value.currentPassword = error.message
    }
    for (const detail of error.details ?? []) {
      const [field, message] = detail.split(': ', 2)
      if (field in form.value) {
        errors.value[field] = message
      }
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="member-page">
    <VCard class="member-card" elevation="0" tag="section" aria-labelledby="password-title">
      <div class="member-heading">
        <span class="member-avatar" aria-hidden="true"><i class="bx bx-lock" /></span>
        <div>
          <h1 id="password-title">비밀번호 변경</h1>
          <p>현재 비밀번호를 확인한 뒤 새 비밀번호를 입력하세요.</p>
        </div>
      </div>

      <form class="member-form" @submit.prevent="fn_save">
        <div class="member-field">
          <label for="current-password">현재 비밀번호</label>
          <input id="current-password" v-model="form.currentPassword" type="password" autocomplete="current-password" :aria-invalid="Boolean(errors.currentPassword)" required>
          <small v-if="errors.currentPassword">{{ errors.currentPassword }}</small>
        </div>
        <div class="member-field">
          <label for="new-password">새 비밀번호</label>
          <input id="new-password" v-model="form.newPassword" type="password" autocomplete="new-password" minlength="8" maxlength="72" :aria-invalid="Boolean(errors.newPassword)" required>
          <small v-if="errors.newPassword">{{ errors.newPassword }}</small>
        </div>
        <div class="member-field">
          <label for="confirm-password">새 비밀번호 확인</label>
          <input id="confirm-password" v-model="form.passwordConfirm" type="password" autocomplete="new-password" :aria-invalid="passwordMismatch || Boolean(errors.passwordConfirm)" required>
          <small v-if="passwordMismatch || errors.passwordConfirm">{{ errors.passwordConfirm || '새 비밀번호가 일치하지 않습니다.' }}</small>
        </div>
        <p v-if="pageError" class="member-error" role="alert">{{ pageError }}</p>
        <div class="member-actions">
          <VBtn to="/profile" variant="outlined">취소</VBtn>
          <VBtn type="submit" variant="flat" :loading="saving" :disabled="saving">변경</VBtn>
        </div>
      </form>
    </VCard>
  </div>
</template>
