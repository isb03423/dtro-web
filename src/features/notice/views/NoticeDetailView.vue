<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DATextEditor from '@/components/common/DATextEditor.vue'
import { fn_deleteNotice, fn_getNoticeDetail } from '@/features/notice/api/noticeApi'
import { gfn_formatDate } from '@/utils/date'
import { APP_ROLES } from '@/config/sideMenu'
import { useAuthStore } from '@/stores/auth'
import '../styles/notice.scss'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isGuest = computed(() => auth.role === APP_ROLES.GUEST)
const canEdit = computed(() => [APP_ROLES.TRAIN_MANAGER, APP_ROLES.ADMIN].includes(auth.role))
const isAdmin = computed(() => auth.role === APP_ROLES.ADMIN)
const notice = ref(null)
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
let latestRequestId = 0

const fn_load = async () => {
  const requestId = ++latestRequestId
  loading.value = true
  error.value = ''
  notice.value = null

  try {
    const response = await fn_getNoticeDetail(route.params.id)
    if (requestId === latestRequestId) notice.value = response
  } catch (requestError) {
    if (requestId === latestRequestId) {
      error.value = requestError.message || '공지사항을 불러오지 못했습니다.'
    }
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

watch(() => route.params.id, fn_load, { immediate: true })

onMounted(async () => {
  try {
    await auth.restore()
  } catch {
    // 상세 공지는 로그인 상태를 복원できなくても表示する。
  }
})

const fn_remove = async () => {
  if (!isAdmin.value || deleting.value || !notice.value) return
  if (!window.confirm('이 공지사항을 삭제하시겠습니까?')) return

  deleting.value = true
  error.value = ''
  try {
    await fn_deleteNotice(notice.value.id)
    await router.push('/notices')
  } catch (requestError) {
    error.value = requestError.message || '공지사항을 삭제하지 못했습니다.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="train-page complaint-page notice-detail-page">
    <header class="train-page__intro">
      <h2>공지사항 보기</h2>
      <p>공지사항의 상세 내용을 확인합니다.</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">
      공지사항을 불러오는 중입니다.
    </VCard>
    <VCard v-else-if="error" class="train-card train-card__state" elevation="0" role="alert">
      {{ error }} <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <VCard v-else-if="notice" class="train-card" elevation="0" tag="section">
      <dl class="train-field-grid">
        <div class="notice-detail-page__full">
          <dt>제목</dt>
          <dd>{{ notice.title }}</dd>
        </div>
        <div>
          <dt>번호</dt>
          <dd>{{ notice.id }}</dd>
        </div>
        <div>
          <dt>중요 여부</dt>
          <dd>{{ notice.importantYn ? '중요' : '일반' }}</dd>
        </div>
        <div v-if="!isGuest">
          <dt>공개 여부</dt>
          <dd>{{ notice.publicYn ? '공개' : '비공개' }}</dd>
        </div>
        <div>
          <dt>등록일</dt>
          <dd>{{ gfn_formatDate(notice.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</dd>
        </div>
        <div class="notice-detail-page__full">
          <dt>내용</dt>
          <dd class="notice-detail-page__content">
            <DATextEditor :model-value="notice.content || ''" :editable="false" :maxlength="null" min-height="250px" />
          </dd>
        </div>
      </dl>
    </VCard>

    <div class="train-actions">
      <RouterLink class="train-button" to="/notices">목록</RouterLink>
      <button v-if="isAdmin && notice" class="train-button" type="button" :disabled="deleting" @click="fn_remove">
        {{ deleting ? '삭제 중...' : '삭제' }}
      </button>
      <RouterLink v-if="canEdit && notice && !deleting" class="train-button train-button--primary" :to="`/notices/${notice.id}/edit`">
        수정
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.notice-detail-page__full { grid-column: 1 / -1; }
.notice-detail-page__content {
  display: block;
  min-inline-size: 0;
  inline-size: 100%;
}
.notice-detail-page__content :deep(.tox-tinymce) {
  inline-size: 100% !important;
}
</style>
