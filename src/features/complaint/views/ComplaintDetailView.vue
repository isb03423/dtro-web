<script setup>
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { APP_ROLES } from '@/config/sideMenu'
import DAReadonlyTextarea from '@/components/common/DAReadonlyTextarea.vue'
import { useRoute, useRouter } from 'vue-router'
import { fn_deleteComplaint, fn_getComplaint } from '@/features/complaint/api/complaintApi'
import { COMPLAINT_STATUSES, COMPLAINT_TYPES } from '@/features/complaint/constants/complaintOptions'
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDate } from '@/utils/date'
import '../styles/complaint.scss'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const complaint = ref(null)
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
const listTo = '/complaints'
const isAdmin = computed(() => auth.role === APP_ROLES.ADMIN)
const isOwner = computed(() => auth.memberId != null && complaint.value?.createdBy != null
  && String(auth.memberId) === String(complaint.value.createdBy))
const canEdit = computed(() => auth.isAuthenticated && !isAdmin.value && isOwner.value && complaint.value?.status === 'PENDING')
const canAnswer = computed(() => isAdmin.value && complaint.value?.status === 'PENDING')
let latestRequestId = 0

const fn_load = async () => {
  const requestId = ++latestRequestId

  loading.value = true
  error.value = ''
  complaint.value = null
  try {
    const response = await fn_getComplaint(route.params.complaintId)

    if (requestId === latestRequestId) complaint.value = response
  } catch (requestError) {
    if (requestId === latestRequestId) error.value = requestError.status === 403
      ? '작성자 본인과 관리자만 상세보기를 할 수 있습니다.'
      : requestError.message
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

watch(() => route.params.complaintId, fn_load, { immediate: true })

const fn_remove = async () => {
  if (deleting.value || !complaint.value) return
  if (!window.confirm('이 민원을 삭제하시겠습니까?')) return

  deleting.value = true
  error.value = ''
  try {
    await fn_deleteComplaint(complaint.value.id)
    await router.push(listTo)
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="train-page complaint-page">
    <header class="train-page__intro">
      <h2 id="complaint-detail-heading">민원 상세</h2>
      <p>민원 내용과 답변·처리 상태를 확인하세요.</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">민원을 불러오는 중입니다.</VCard>
    <VCard v-else-if="error && !complaint" class="train-card train-card__state" elevation="0" role="alert">
      {{ error }}
      <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <template v-else-if="complaint">
      <VCard class="train-card" elevation="0" tag="section" aria-labelledby="complaint-detail-heading">
        <dl class="train-field-grid">
          <div class="complaint-field--full">
            <dt>제목</dt>
            <dd>{{ complaint.title }}</dd>
          </div>
          <div>
            <dt>민원 유형</dt>
            <dd>{{ gfn_getLabel(COMPLAINT_TYPES, complaint.type) }}</dd>
          </div>
          <div>
            <dt>처리 상태</dt>
            <dd>{{ gfn_getLabel(COMPLAINT_STATUSES, complaint.status) }}</dd>
          </div>
          <div>
            <dt>역 이름</dt>
            <dd>{{ complaint.station }}</dd>
          </div>
          <div>
            <dt>등록자 ID</dt>
            <dd>{{ complaint.createdBy }}</dd>
          </div>
          <div>
            <dt>등록일</dt>
            <dd>{{ gfn_formatDate(complaint.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</dd>
          </div>
          <div v-if="complaint.updatedAt">
            <dt>수정일</dt>
            <dd>{{ gfn_formatDate(complaint.updatedAt, 'YYYY-MM-DD HH:mm:ss') }}</dd>
          </div>
          <div class="complaint-field--full">
            <dt>내용</dt>
            <dd class="complaint-editor-view">
              <DAReadonlyTextarea :model-value="complaint.content || ''" label="민원 내용" />
            </dd>
          </div>
        </dl>
      </VCard>

      <VCard class="train-card complaint-answer" elevation="0" tag="section" aria-labelledby="complaint-answer-heading">
        <h2 id="complaint-answer-heading">답변</h2>
        <div v-if="complaint.status === 'ANSWERED'" class="complaint-editor-view">
          <DAReadonlyTextarea :model-value="complaint.replyContent || ''" label="민원 답변" />
        </div>
        <p v-else>아직 등록된 답변이 없습니다.</p>
      </VCard>
    </template>

    <p v-if="error && complaint" class="train-inline-error" role="alert">{{ error }}</p>
    <div class="train-actions">
      <RouterLink class="train-button" :to="listTo">목록</RouterLink>
      <button v-if="complaint && !loading" class="train-button" type="button" :disabled="deleting" @click="fn_remove">
        {{ deleting ? '삭제 중...' : '삭제' }}
      </button>
      <RouterLink v-if="(canEdit || canAnswer) && !loading && !deleting" class="train-button train-button--primary" :to="`/complaints/${complaint.id}/edit`">
        {{ canAnswer ? '답변 등록' : '수정' }}
      </RouterLink>
    </div>
  </div>
</template>
