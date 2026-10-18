<script setup>
import { fn_fetchMemberProfile } from '@/api/memberApi'
import { APP_ROLES } from '@/config/sideMenu'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const router = useRouter()
const member = ref(null)
const loading = ref(true)
const pageError = ref('')

const roleLabels = {
  [APP_ROLES.ADMIN]: '관리자',
  [APP_ROLES.TRAIN_MANAGER]: '열차 운영자',
  [APP_ROLES.USER]: '일반 사용자',
}

const fn_load = async () => {
  loading.value = true
  pageError.value = ''
  try {
    member.value = await fn_fetchMemberProfile()
    authStore.setAccount(member.value)
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

onMounted(fn_load)
</script>

<template>
  <div class="member-page">
    <VCard class="member-card" elevation="0" tag="section" aria-labelledby="profile-title">
      <div class="member-heading">
        <span class="member-avatar" aria-hidden="true"><i class="bx bx-user" /></span>
        <div>
          <h1 id="profile-title">프로필</h1>
          <p>로그인한 계정 정보입니다.</p>
        </div>
      </div>

      <p v-if="loading" class="member-status" role="status">계정 정보를 불러오는 중입니다.</p>
      <p v-else-if="pageError" class="member-error" role="alert">{{ pageError }}</p>
      <template v-else-if="member">
        <p v-if="$route.query.updated === '1'" class="member-status" role="status">회원 정보가 수정되었습니다.</p>
        <p v-if="$route.query.passwordChanged === '1'" class="member-status" role="status">비밀번호가 변경되었습니다.</p>
        <dl class="member-details">
          <div><dt>아이디</dt><dd>{{ member.userid }}</dd></div>
          <div><dt>이름</dt><dd>{{ member.name }}</dd></div>
          <div><dt>이메일</dt><dd>{{ member.email || '등록된 정보 없음' }}</dd></div>
          <div><dt>전화번호</dt><dd>{{ member.phone || '등록된 정보 없음' }}</dd></div>
          <div><dt>권한</dt><dd>{{ roleLabels[member.role] ?? '사용자' }}</dd></div>
        </dl>
        <div class="member-actions">
          <VBtn to="/profile/edit" variant="flat">정보 수정</VBtn>
          <VBtn to="/profile/password" variant="outlined">비밀번호 변경</VBtn>
        </div>
      </template>
      <VBtn v-if="pageError" class="member-status" variant="outlined" @click="fn_load">다시 시도</VBtn>
    </VCard>
  </div>
</template>
