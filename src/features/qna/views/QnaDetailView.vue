<script setup>
import { ref, watch } from 'vue'
import DAReadonlyTextarea from '@/components/common/DAReadonlyTextarea.vue'
import { useRoute, useRouter } from 'vue-router'
import { fn_deleteQna, fn_getQna } from '@/features/qna/api/qnaApi'
import { QNA_STATUSES, QNA_TYPES } from '@/features/qna/constants/qnaOptions'
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDate } from '@/utils/date'
import '../styles/qna.scss'

const route = useRoute()
const router = useRouter()
const qna = ref(null)
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

    if (requestId === latestRequestId) qna.value = response
  } catch (requestError) {
    if (requestId === latestRequestId) error.value = requestError.message
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

watch(() => route.params.qnaId, fn_load, { immediate: true })

const fn_remove = async () => {
  if (deleting.value || !qna.value) return
  if (!window.confirm('이 질문을 삭제하시겠습니까?')) return

  deleting.value = true
  error.value = ''
  try {
    await fn_deleteQna(qna.value.id)
    await router.push(listTo)
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="train-page qna-page">
    <header class="train-page__intro">
      <h2 id="qna-detail-heading">질문 상세</h2>
      <p>질문 내용과 답변·처리 상태를 확인하세요.</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">질문을 불러오는 중입니다.</VCard>
    <VCard v-else-if="error && !qna" class="train-card train-card__state" elevation="0" role="alert">
      {{ error }}
      <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <template v-else-if="qna">
      <VCard class="train-card" elevation="0" tag="section" aria-labelledby="qna-detail-heading">
        <dl class="train-field-grid">
          <div class="qna-field--full">
            <dt>제목</dt>
            <dd>{{ qna.title }}</dd>
          </div>
          <div>
            <dt>질문 유형</dt>
            <dd>{{ gfn_getLabel(QNA_TYPES, qna.type) }}</dd>
          </div>
          <div>
            <dt>처리 상태</dt>
            <dd>{{ gfn_getLabel(QNA_STATUSES, qna.status) }}</dd>
          </div>
          <div>
            <dt>역 이름</dt>
            <dd>{{ qna.station }}</dd>
          </div>
          <div>
            <dt>등록자 ID</dt>
            <dd>{{ qna.createdBy }}</dd>
          </div>
          <div>
            <dt>등록일</dt>
            <dd>{{ gfn_formatDate(qna.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</dd>
          </div>
          <div v-if="qna.updatedAt">
            <dt>수정일</dt>
            <dd>{{ gfn_formatDate(qna.updatedAt, 'YYYY-MM-DD HH:mm:ss') }}</dd>
          </div>
          <div class="qna-field--full">
            <dt>내용</dt>
            <dd class="qna-editor-view">
              <DAReadonlyTextarea :model-value="qna.content || ''" label="질문 내용" />
            </dd>
          </div>
        </dl>
      </VCard>

      <VCard class="train-card qna-answer" elevation="0" tag="section" aria-labelledby="qna-answer-heading">
        <h2 id="qna-answer-heading">답변</h2>
        <div v-if="qna.status === 'ANSWERED'" class="qna-editor-view">
          <DAReadonlyTextarea :model-value="qna.replyContent || ''" label="질문 답변" />
        </div>
        <p v-else>아직 등록된 답변이 없습니다.</p>
      </VCard>
    </template>

    <p v-if="error && qna" class="train-inline-error" role="alert">{{ error }}</p>
    <div class="train-actions">
      <RouterLink class="train-button" :to="listTo">목록</RouterLink>
      <button v-if="qna && !loading" class="train-button" type="button" :disabled="deleting" @click="fn_remove">
        {{ deleting ? '삭제 중...' : '삭제' }}
      </button>
      <RouterLink v-if="qna && !loading && !deleting" class="train-button train-button--primary" :to="`/qnas/${qna.id}/edit`">
        수정
      </RouterLink>
    </div>
  </div>
</template>
