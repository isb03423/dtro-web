<script setup>
import { computed, ref, watch } from 'vue'
import DATextEditor from '@/components/common/DATextEditor.vue'
import { useRoute, useRouter } from 'vue-router'
import { APP_ROLES } from '@/config/sideMenu'
import { useAuthStore } from '@/stores/auth'
import { fn_answerQna, fn_createQna, fn_getQna, fn_updateQna } from '@/features/qna/api/qnaApi'
import { QNA_TYPES } from '@/features/qna/constants/qnaOptions'
import { gfn_validateRequiredFields } from '@/utils/validation'
import '../styles/qna.scss'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isEdit = computed(() => Boolean(route.params.qnaId))
const qna = ref(null)
const loading = ref(false)
const replyContent = ref('')
const replyEditor = ref(null)
const replyError = ref('')
const isAdmin = computed(() => auth.role === APP_ROLES.ADMIN)
const canAnswer = computed(() => isAdmin.value && qna.value?.status === 'PENDING')
const contentEditor = ref(null)
const form = ref({ title: '', type: '', station: '', content: '' })
const requiredFields = ['title', 'type', 'station', 'content']
const errors = ref({})
const pageError = ref('')
const saving = ref(false)
const listTo = '/qnas'
const cancelTo = computed(() => isEdit.value ? `/qnas/${route.params.qnaId}` : listTo)
let latestRequestId = 0

const fn_load = async () => {
  const requestId = ++latestRequestId

  form.value = { title: '', type: '', station: '', content: '' }
  qna.value = null
  errors.value = {}
  pageError.value = ''
  replyContent.value = ''
  replyError.value = ''
  loading.value = isEdit.value
  if (!isEdit.value) return

  try {
    const response = await fn_getQna(route.params.qnaId)

    if (requestId === latestRequestId) {
      qna.value = response
      form.value = { title: response.title, type: response.type, station: response.station, content: response.content }
    }
  } catch (requestError) {
    if (requestId === latestRequestId) pageError.value = requestError.message
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

watch(() => route.params.qnaId, fn_load, { immediate: true })

const fn_validate = () => {
  const next = gfn_validateRequiredFields(form.value, requiredFields)

  if (form.value.title.trim().length > 100) next.title = '제목은 100자 이내로 입력하세요.'
  if (form.value.station.trim().length > 30) next.station = '역 이름은 30자 이내로 입력하세요.'
  if (!QNA_TYPES.some(item => item.value === form.value.type)) next.type = '질문 유형을 선택하세요.'
  // HTML 태그가 아닌 실제 입력 내용을 기준으로 필수값을 검사한다.
  const contentText = new DOMParser().parseFromString(form.value.content, 'text/html').body.textContent || ''

  if (!contentText.trim()) next.content = '내용을 입력하세요.'
  if (contentEditor.value?.isOverLimit) next.content = '내용은 65,000자 이내로 입력하세요.'
  errors.value = next

  return Object.keys(next).length === 0
}

const fn_save = async () => {
  if (saving.value || loading.value || (isEdit.value && !qna.value)) return

  // 에디터의 최신 HTML 내용을 검증하고 동일한 값으로 저장한다.
  form.value.content = contentEditor.value?.getContentForSave() ?? form.value.content
  if (!fn_validate()) return

  saving.value = true
  pageError.value = ''

  const payload = {
    title: form.value.title.trim(),
    type: form.value.type,
    station: form.value.station.trim(),
    content: form.value.content.trim(),
  }

  try {
    const saved = isEdit.value
      ? await fn_updateQna(route.params.qnaId, payload)
      : await fn_createQna(payload)

    await router.push(`/qnas/${saved.id}`)
  } catch (requestError) {
    pageError.value = requestError.message
    for (const detail of requestError.details ?? []) {
      const [field, message] = detail.split(': ', 2)

      if (field in form.value) errors.value[field] = message
    }
  } finally {
    saving.value = false
  }
}

const fn_answer = async () => {
  if (!canAnswer.value || saving.value || loading.value) return

  // HTML 태그를 제외한 실제 답변 길이를 검증하고 에디터의 최신 HTML을 저장한다.
  const reply = (replyEditor.value?.getContentForSave() ?? replyContent.value).trim()
  const replyText = new DOMParser().parseFromString(reply, 'text/html').body.textContent || ''

  replyError.value = replyText.trim().length < 10 ? '답변은 10글자 이상 작성하세요.' : ''
  if (replyEditor.value?.isOverLimit) replyError.value = '답변은 65,000자 이내로 입력하세요.'
  if (replyError.value) return

  const id = qna.value.id

  saving.value = true
  pageError.value = ''
  try {
    const saved = await fn_answerQna(id, { replyContent: reply })

    if (qna.value?.id === id) qna.value = saved
  } catch (requestError) {
    if (qna.value?.id === id) pageError.value = requestError.message
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="train-page qna-page">
    <header class="train-page__intro">
      <h2>{{ isEdit ? '질문 수정' : '질문 등록' }}</h2>
      <p>필수 항목을 확인한 뒤 저장하세요. * 필수 입력</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">질문 내용을 불러오는 중입니다.</VCard>
    <VCard v-else-if="isEdit && !qna" class="train-card train-card__state" elevation="0" role="alert">
      내용을 불러오지 못했습니다.
      <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <VCard v-else id="qna-form" class="train-card" elevation="0" tag="form" novalidate @submit.prevent="fn_save">
      <div class="train-field-grid train-field-grid--form">
        <label class="qna-field--full">
          <span>제목 *</span>
          <input v-model.trim="form.title" type="text" maxlength="100" :disabled="saving" :aria-invalid="Boolean(errors.title)" />
          <small v-if="errors.title">{{ errors.title }}</small>
        </label>
        <label>
          <span>질문 유형 *</span>
          <select v-model="form.type" :disabled="saving" :aria-invalid="Boolean(errors.type)">
            <option value="">유형을 선택하세요</option>
            <option v-for="item in QNA_TYPES" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <small v-if="errors.type">{{ errors.type }}</small>
        </label>
        <label>
          <span>역 이름 *</span>
          <input v-model.trim="form.station" type="text" maxlength="30" :disabled="saving" :aria-invalid="Boolean(errors.station)" />
          <small v-if="errors.station">{{ errors.station }}</small>
        </label>
        <div class="qna-field--full qna-editor-field" role="group" aria-labelledby="qna-content-label" :aria-invalid="Boolean(errors.content)">
          <span id="qna-content-label">내용 *</span>
          <DATextEditor
            ref="contentEditor"
            v-model="form.content"
            :editable="!saving"
            :maxlength="65000"
            min-height="300px"
            placeholder="질문 내용을 입력하세요."
          />
          <small v-if="errors.content" role="alert">{{ errors.content }}</small>
        </div>
      </div>
    </VCard>

    <VCard v-if="isEdit && qna" class="train-card qna-answer" elevation="0" tag="section" aria-labelledby="qna-answer-heading">
      <h2 id="qna-answer-heading">답변</h2>
      <div v-if="qna.status === 'ANSWERED'" class="qna-editor-view">
        <DATextEditor :model-value="qna.replyContent || ''" :editable="false" :maxlength="null" min-height="250px" />
      </div>
      <form v-else-if="canAnswer" id="qna-answer-form" novalidate @submit.prevent="fn_answer">
        <div class="train-field-grid train-field-grid--form">
          <div class="qna-field--full qna-editor-field" role="group" aria-labelledby="qna-reply-label" :aria-invalid="Boolean(replyError)">
            <span id="qna-reply-label">답변 내용 * (10자 이상)</span>
            <DATextEditor
              ref="replyEditor"
              v-model="replyContent"
              :editable="!saving && !loading"
              :maxlength="65000"
              min-height="300px"
              placeholder="답변 내용을 입력하세요."
            />
            <small v-if="replyError" role="alert">{{ replyError }}</small>
          </div>
        </div>
      </form>
      <p v-else>아직 등록된 답변이 없습니다.</p>
    </VCard>

    <p v-if="pageError" class="train-inline-error" role="alert">{{ pageError }}</p>
    <div class="train-actions">
      <RouterLink class="train-button" :to="listTo">목록</RouterLink>
      <RouterLink class="train-button" :to="cancelTo">취소</RouterLink>
      <button class="train-button train-button--primary" type="submit" form="qna-form" :disabled="saving || loading || (isEdit && !qna)">
        {{ saving ? '저장 중...' : '저장' }}
      </button>
      <button v-if="canAnswer && !loading" class="train-button train-button--primary" type="submit" form="qna-answer-form" :disabled="saving">
        {{ saving ? '저장 중...' : '답변 등록' }}
      </button>
    </div>
  </div>
</template>
