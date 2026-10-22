<script setup>
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import { gfn_useCustomerServiceDialog } from '@/features/customerservice/composables/useCustomerServiceDialog'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { APP_ROLES } from '@/config/sideMenu'
import DATextEditor from '@/components/common/DATextEditor.vue'
import DAAnswerContent from '@/components/common/DAAnswerContent.vue'
import { useRoute, useRouter } from 'vue-router'
import { fn_deleteQna, fn_getQna } from '@/features/qna/api/qnaApi'
import { QNA_STATUSES, QNA_TYPES } from '@/features/qna/constants/qnaOptions'
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDate } from '@/utils/date'
import '@styles/customer-service.scss'

const { dialog, finishDialog, showRequestError, showSuccess, askConfirm } = gfn_useCustomerServiceDialog()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const qna = ref(null)
const isAdmin = computed(() => auth.role === APP_ROLES.ADMIN)

const isOwner = computed(() => auth.memberId != null && qna.value?.createdBy != null
  && String(auth.memberId) === String(qna.value.createdBy))

const canEdit = computed(() => auth.isAuthenticated && !isAdmin.value && isOwner.value && qna.value?.status === 'PENDING')
const canAnswer = computed(() => isAdmin.value && ['PENDING', 'ANSWERED'].includes(qna.value?.status))
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
const listTo = '/qnas'
let latestRequestId = 0

const fn_load = async () => {
  const requestId = ++latestRequestId

  loading.value = true
  error.value = ''
  qna.value = null
  try {
    const response = await fn_getQna(route.params.qnaId)

    if (requestId === latestRequestId) {
      qna.value = response
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

watch(() => route.params.qnaId, fn_load, { immediate: true })

const fn_remove = async () => {
  if (deleting.value || !qna.value) {
    return
  }
  deleting.value = true
  error.value = ''
  try {
    if (!(await askConfirm('계속 진행하시겠습니까?', '이 질문을 삭제하시겠습니까?', '삭제'))) {
      return
    }
    await fn_deleteQna(qna.value.id)
    qna.value = null
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
  <div class="train-page qna-page qna-detail-page">
    <header class="train-page__intro">
      <h2>질문 및 답변</h2>
      <p>등록한 질문과 답변을 확인하세요.</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">질문을 불러오는 중입니다.</VCard>
    <VCard v-else-if="error && !qna" class="train-card train-card__state" elevation="0" role="alert">
      {{ error }}
      <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <template v-else-if="qna">
      <VCard class="train-card qna-post" elevation="0" tag="article" aria-labelledby="qna-detail-heading">
        <header class="qna-post__header">
          <div class="qna-post__labels">
            <span class="qna-post__type">{{ gfn_getLabel(QNA_TYPES, qna.type) }}</span>
            <span class="qna-post__status" :class="qna.status === 'ANSWERED' ? 'qna-post__status--answered' : 'qna-post__status--pending'">
              {{ gfn_getLabel(QNA_STATUSES, qna.status) }}
            </span>
          </div>
          <h2 id="qna-detail-heading" class="qna-post__title">{{ qna.title }}</h2>
          <dl class="qna-post__meta">
            <div v-if="qna.lineCodes?.length"><dt>노선</dt><dd>{{ qna.lineCodes.map(code => `${code}호선`).join(', ') }}</dd></div>
            <div v-if="qna.station"><dt>역 이름</dt><dd>{{ qna.station }}</dd></div>
            <div><dt>등록자</dt><dd>{{ qna.createdByName || '—' }}</dd></div>
            <div><dt>등록일</dt><dd>{{ gfn_formatDate(qna.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</dd></div>
          </dl>
        </header>

        <section class="qna-post__body" aria-label="질문 내용">
          <DATextEditor :model-value="qna.content || ''" :editable="false" :focusable="false" reader-mode :maxlength="null" />
        </section>

        <section class="qna-post__answer" aria-labelledby="qna-answer-heading">
          <div class="qna-post__answer-heading">
            <h3 id="qna-answer-heading">답변</h3>
          </div>
          <template v-if="qna.status === 'ANSWERED'">
            <dl class="qna-post__meta qna-post__answer-meta">
              <div v-if="qna.updatedByName"><dt>답변자</dt><dd>{{ qna.updatedByName }}</dd></div>
              <div v-if="qna.updatedAt"><dt>답변일</dt><dd>{{ gfn_formatDate(qna.updatedAt, 'YYYY-MM-DD HH:mm:ss') }}</dd></div>
            </dl>
            <DAAnswerContent :model-value="qna.replyContent || ''" />
          </template>
          <p v-else class="qna-post__waiting">아직 등록된 답변이 없습니다.</p>
        </section>
      </VCard>
    </template>

    <p v-if="error && qna" class="train-inline-error" role="alert">{{ error }}</p>
    <div class="train-actions">
      <RouterLink class="train-button" :to="listTo">목록</RouterLink>
      <button v-if="qna && !loading" class="train-button" type="button" :disabled="deleting" @click="fn_remove">
        {{ deleting ? '삭제 중...' : '삭제' }}
      </button>
      <RouterLink v-if="(canEdit || canAnswer) && !loading && !deleting" class="train-button train-button--primary" :to="`/qnas/${qna.id}/edit`">
        {{ canAnswer ? (qna.status === 'ANSWERED' ? '답변 수정' : '답변 등록') : '질문 수정' }}
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
