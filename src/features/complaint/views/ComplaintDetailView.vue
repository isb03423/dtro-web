<script setup>
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import { gfn_useCustomerServiceDialog } from '@/features/customerservice/composables/useCustomerServiceDialog'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { APP_ROLES } from '@/config/sideMenu'
import DATextEditor from '@/components/common/DATextEditor.vue'
import DAAnswerContent from '@/components/common/DAAnswerContent.vue'
import { useRoute, useRouter } from 'vue-router'
import { fn_deleteComplaint, fn_getComplaint } from '@/features/complaint/api/complaintApi'
import { COMPLAINT_STATUSES, COMPLAINT_TYPES } from '@/features/complaint/constants/complaintOptions'
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDate } from '@/utils/date'
import '../styles/complaint.scss'

const { dialog, finishDialog, showRequestError, showSuccess, askConfirm } = gfn_useCustomerServiceDialog()

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

    if (requestId === latestRequestId) {
      complaint.value = response
    }
  } catch (requestError) {
    if (requestId === latestRequestId) {
      error.value = requestError.message
      showRequestError(requestError, () => router.push(listTo))
    }
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

watch(() => route.params.complaintId, fn_load, { immediate: true })

const fn_remove = async () => {
  if (deleting.value || !complaint.value) {
    return
  }
  deleting.value = true
  error.value = ''
  try {
    if (!(await askConfirm('계속 진행하시겠습니까?', '이 민원을 삭제하시겠습니까?', '삭제'))) {
      return
    }
    await fn_deleteComplaint(complaint.value.id)
    complaint.value = null
    showSuccess('삭제했습니다.', () => router.push(listTo))
  } catch (requestError) {
    error.value = requestError.message
    showRequestError(requestError)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="train-page complaint-page complaint-detail-page">
    <header class="train-page__intro">
      <h2>민원</h2>
      <p>민원 내용과 답변·처리 상태를 확인하세요.</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">민원을 불러오는 중입니다.</VCard>
    <VCard v-else-if="error && !complaint" class="train-card train-card__state" elevation="0" role="alert">
      {{ error }}
      <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <template v-else-if="complaint">
      <VCard class="train-card board-post" elevation="0" tag="article" aria-labelledby="complaint-detail-heading">
        <header class="board-post__header">
          <div class="board-post__badges">
            <span class="board-post__badge">{{ gfn_getLabel(COMPLAINT_TYPES, complaint.type) }}</span>
            <span class="board-post__badge" :class="complaint.status === 'ANSWERED' ? 'board-post__badge--answered' : 'board-post__badge--muted'">
              {{ gfn_getLabel(COMPLAINT_STATUSES, complaint.status) }}
            </span>
          </div>
          <h2 id="complaint-detail-heading" class="board-post__title">{{ complaint.title }}</h2>
          <dl class="board-post__meta">
            <div v-if="complaint.lineCodes?.length"><dt>노선</dt><dd>{{ complaint.lineCodes.map(code => `${code}호선`).join(', ') }}</dd></div>
            <div><dt>역 이름</dt><dd>{{ complaint.station }}</dd></div>
            <div><dt>등록자</dt><dd>{{ complaint.createdByName || '—' }}</dd></div>
            <div><dt>등록일</dt><dd>{{ gfn_formatDate(complaint.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</dd></div>
          </dl>
        </header>
        <section class="board-post__body" aria-label="민원 내용">
          <DATextEditor :model-value="complaint.content || ''" :editable="false" :focusable="false" reader-mode :maxlength="null" />
        </section>
        <section class="board-post__answer" aria-labelledby="complaint-answer-heading">
          <h3 id="complaint-answer-heading">답변</h3>
          <template v-if="complaint.status === 'ANSWERED'">
            <dl class="board-post__meta board-post__answer-meta">
              <div v-if="complaint.updatedByName"><dt>답변자</dt><dd>{{ complaint.updatedByName }}</dd></div>
              <div v-if="complaint.updatedAt"><dt>답변일</dt><dd>{{ gfn_formatDate(complaint.updatedAt, 'YYYY-MM-DD HH:mm:ss') }}</dd></div>
            </dl>
            <DAAnswerContent :model-value="complaint.replyContent || ''" />
          </template>
          <p v-else class="board-post__waiting">아직 등록된 답변이 없습니다.</p>
        </section>
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
    <AppMessageDialog
      :model-value="dialog.open"
      :type="dialog.type"
      :title="dialog.title"
      :message="dialog.message"
      :show-cancel="dialog.showCancel"
      :confirm-text="dialog.confirmText"
      @confirm="finishDialog(true)"
      @cancel="finishDialog(false)"
    />
  </div>
</template>
