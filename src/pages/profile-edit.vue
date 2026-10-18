<script setup>
import { fn_fetchMemberProfile, fn_updateMemberProfile } from '@/api/memberApi'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const form = ref({ name: '', email: '', phone: '' })
const errors = ref({})
const pageError = ref('')
const loading = ref(true)
const loaded = ref(false)
const saving = ref(false)

const fn_load = async () => {
  loading.value = true
  loaded.value = false
  pageError.value = ''
  try {
    const member = await fn_fetchMemberProfile()

    form.value = { name: member.name, email: member.email ?? '', phone: member.phone ?? '' }
    loaded.value = true
    authStore.setAccount(member)
  } catch (error) {
    if (error.status === 401) {
      authStore.expire()
      await router.replace('/login')

      return
    }
    pageError.value = error.message
  } finally {
    loading.value = false
  }
}

const fn_save = async () => {
  if (saving.value) {
    return
  }

  errors.value = {}
  pageError.value = ''
  saving.value = true
  try {
    const member = await fn_updateMemberProfile({
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      phone: form.value.phone.trim(),
    })

    authStore.setAccount(member)
    await router.push({ path: '/profile', query: { updated: '1' } })
  } catch (error) {
    if (error.status === 401) {
      authStore.expire()
      await router.replace('/login')

      return
    }
    pageError.value = error.message
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

onMounted(fn_load)
</script>

<template>
  <div class="member-page">
    <VCard class="member-card" elevation="0" tag="section" aria-labelledby="edit-title">
      <div class="member-heading">
        <span class="member-avatar" aria-hidden="true"><i class="bx bx-edit" /></span>
        <div>
          <h1 id="edit-title">내 정보 수정</h1>
          <p>이름과 연락처를 수정할 수 있습니다.</p>
        </div>
      </div>

      <p v-if="loading" class="member-status" role="status">계정 정보를 불러오는 중입니다.</p>
      <form v-else-if="loaded" class="member-form" @submit.prevent="fn_save">
        <div class="member-field">
          <label for="member-name">이름</label>
          <input id="member-name" v-model="form.name" type="text" autocomplete="name" maxlength="50" :aria-invalid="Boolean(errors.name)" required>
          <small v-if="errors.name">{{ errors.name }}</small>
        </div>
        <div class="member-field">
          <label for="member-email">이메일</label>
          <input id="member-email" v-model="form.email" type="email" autocomplete="email" maxlength="254" :aria-invalid="Boolean(errors.email)" required>
          <small v-if="errors.email">{{ errors.email }}</small>
        </div>
        <div class="member-field">
          <label for="member-phone">전화번호</label>
          <input id="member-phone" v-model="form.phone" type="tel" autocomplete="tel" maxlength="30" :aria-invalid="Boolean(errors.phone)" required>
          <small v-if="errors.phone">{{ errors.phone }}</small>
        </div>
        <p v-if="pageError" class="member-error" role="alert">{{ pageError }}</p>
        <div class="member-actions">
          <VBtn to="/profile" variant="outlined">취소</VBtn>
          <VBtn type="submit" variant="flat" :loading="saving" :disabled="saving">저장</VBtn>
        </div>
      </form>
      <template v-else>
        <p class="member-error" role="alert">{{ pageError }}</p>
        <VBtn class="member-status" variant="outlined" @click="fn_load">다시 시도</VBtn>
      </template>
    </VCard>
  </div>
</template>
