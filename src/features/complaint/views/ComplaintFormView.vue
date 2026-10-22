<script setup>
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import { gfn_useCustomerServiceDialog } from '@/features/customerservice/composables/useCustomerServiceDialog'
import { computed, ref, watch } from 'vue'
import DATextEditor from '@/components/common/DATextEditor.vue'
import DAAnswerContent from '@/components/common/DAAnswerContent.vue'
import CustomerServiceStationFields from '@/features/customerservice/components/CustomerServiceStationFields.vue'
import { useRoute, useRouter } from 'vue-router'
import { APP_ROLES } from '@/config/sideMenu'
import { useAuthStore } from '@/stores/auth'
import { fn_answerComplaint, fn_createComplaint, fn_getComplaint, fn_updateComplaint } from '@/features/complaint/api/complaintApi'
import { COMPLAINT_STATUSES, COMPLAINT_TYPES } from '@/features/complaint/constants/complaintOptions'
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDate } from '@/utils/date'
import { gfn_validateRequiredFields } from '@/utils/validation'
import '../styles/complaint.scss'

const { dialog, finishDialog, showAccessDenied, showRequestError, showSuccess, showValidationError } = gfn_useCustomerServiceDialog()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isEdit = computed(() => Boolean(route.params.complaintId))
const complaint = ref(null)
const loading = ref(false)
const replyContent = ref('')
const replyError = ref('')
const isAdmin = computed(() => auth.role === APP_ROLES.ADMIN)


// 로그인 ID와 작성자 ID가 모두 있을 때만 본인으로 판단한다.
const isOwner = computed(() => auth.memberId != null
  && complaint.value?.createdBy != null
  && String(auth.memberId) === String(complaint.value.createdBy))

const canCreate = computed(() => !isEdit.value && auth.role === APP_ROLES.USER)

const canEdit = computed(() => isEdit.value && auth.isAuthenticated
  && !isAdmin.value && isOwner.value && complaint.value?.status === 'PENDING')

const canSaveComplaint = computed(() => !loading.value && (canCreate.value || canEdit.value))

const canAnswer = computed(() => isEdit.value && isAdmin.value
  && !loading.value && complaint.value?.status === 'PENDING')

const contentEditor = ref(null)
const form = ref({ title: '', type: '', station: '', content: '' })
const requiredFields = ['title', 'type', 'station', 'content']
const errors = ref({})
const pageError = ref('')
const saving = ref(false)
const listTo = '/complaints'
const cancelTo = computed(() => isEdit.value ? `/complaints/${route.params.complaintId}` : listTo)
let latestRequestId = 0

const fn_load = async () => {
  const requestId = ++latestRequestId

  form.value = { title: '', type: '', station: '', content: '' }
  complaint.value = null
  errors.value = {}
  pageError.value = ''
  replyContent.value = ''
  replyError.value = ''
  loading.value = isEdit.value
  if (!isEdit.value) {
    if (!canCreate.value) {
      showAccessDenied('민원을 등록할 권한이 없습니다.', () => router.push(listTo))
    }

    return
  }

  try {
    const response = await fn_getComplaint(route.params.complaintId)

    if (requestId === latestRequestId) {
      complaint.value = response
      form.value = { title: response.title, type: response.type, station: response.station, content: response.content }
    }
  } catch (requestError) {
    if (requestId === latestRequestId) {
      pageError.value = requestError.message
      showRequestError(requestError, () => router.push(listTo))
    }
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

watch(() => route.params.complaintId, fn_load, { immediate: true })

const fn_validate = () => {
  const next = gfn_validateRequiredFields(form.value, requiredFields)

  if (form.value.title.trim().length > 100) {
    next.title = '제목은 100자 이내로 입력하세요.'
  }
  if (form.value.station.trim().length > 30) {
    next.station = '역 이름은 30자 이내로 입력하세요.'
  }
  if (!COMPLAINT_TYPES.some(item => item.value === form.value.type)) {
    next.type = '민원 유형을 선택하세요.'
  }

  // HTML 태그가 아닌 실제 입력 내용을 기준으로 필수값을 검사한다.
  const contentText = new DOMParser().parseFromString(form.value.content, 'text/html').body.textContent || ''

  if (!contentText.trim()) {
    next.content = '내용을 입력하세요.'
  }
  if (contentEditor.value?.isOverLimit) {
    next.content = '내용은 65,000자 이내로 입력하세요.'
  }
  errors.value = next

  return Object.keys(next).length === 0
}

const fn_save = async () => {
  if (saving.value || !canSaveComplaint.value) {
    return
  }

  // 에디터의 최신 HTML 내용을 검증하고 동일한 값으로 저장한다.
  form.value.content = contentEditor.value?.getContentForSave() ?? form.value.content
  if (!fn_validate()) {
    showValidationError('필수 입력 항목과 입력 내용을 확인해주세요.')

    return
  }

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
      ? await fn_updateComplaint(route.params.complaintId, payload)
      : await fn_createComplaint(payload)

    showSuccess('저장했습니다.', () => router.push(`/complaints/${saved.id}`))
  } catch (requestError) {
    pageError.value = requestError.message
    showRequestError(requestError)
    for (const detail of requestError.details ?? []) {
      const [field, message] = detail.split(': ', 2)

      if (field in form.value) {
        errors.value[field] = message
      }
    }
  } finally {
    saving.value = false
  }
}

const fn_answer = async () => {
  if (!canAnswer.value || saving.value || loading.value) {
    return
  }

  const reply = replyContent.value.trim()

  replyError.value = Array.from(reply).length < 10 ? '답변은 10글자 이상 작성하세요.' : ''
  if (Array.from(reply).length > 65000) {
    replyError.value = '답변은 65,000자 이내로 입력하세요.'
  }
  if (replyError.value) {
    showValidationError(replyError.value)

    return
  }

  const id = complaint.value.id

  saving.value = true
  pageError.value = ''
  try {
    const saved = await fn_answerComplaint(id, { replyContent: reply })

    if (complaint.value?.id === id) {
      complaint.value = saved
      showSuccess('답변을 등록했습니다.', () => router.push(`/complaints/${id}`))
    }
  } catch (requestError) {
    if (complaint.value?.id === id) {
      pageError.value = requestError.message
      showRequestError(requestError)
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="train-page complaint-page complaint-compose-page">
    <header class="train-page__intro">
      <h2>{{ isEdit ? (isAdmin ? '민원 답변' : '민원 수정') : '민원 등록' }}</h2>
      <p v-if="canAnswer">민원 내용은 읽기 전용입니다. 답변만 등록할 수 있습니다.</p>
      <p v-else-if="isEdit && !canEdit && !loading">민원 내용은 읽기 전용입니다. 작성한 본인만 답변 대기 상태에서 수정할 수 있습니다.</p>
      <p v-else>필수 항목을 확인한 뒤 저장하세요. * 필수 입력</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">민원 내용을 불러오는 중입니다.</VCard>
    <VCard v-else-if="isEdit && !complaint" class="train-card train-card__state" elevation="0" role="alert">
      내용을 불러오지 못했습니다.
      <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <VCard v-else-if="isEdit && !canEdit" class="train-card board-post" elevation="0" tag="article" aria-labelledby="complaint-preview-heading">
      <header class="board-post__header">
        <div class="board-post__badges">
          <span class="board-post__badge">{{ gfn_getLabel(COMPLAINT_TYPES, complaint.type) }}</span>
          <span class="board-post__badge" :class="complaint.status === 'ANSWERED' ? 'board-post__badge--answered' : 'board-post__badge--muted'">
            {{ gfn_getLabel(COMPLAINT_STATUSES, complaint.status) }}
          </span>
        </div>
        <h2 id="complaint-preview-heading" class="board-post__title">{{ complaint.title }}</h2>
        <dl class="board-post__meta">
          <div v-if="complaint.lineCodes?.length"><dt>노선</dt><dd>{{ complaint.lineCodes.map(code => `${code}호선`).join(', ') }}</dd></div>
          <div><dt>역 이름</dt><dd>{{ complaint.station }}</dd></div>
          <div><dt>등록자</dt><dd>{{ complaint.createdByName || '—' }}</dd></div>
          <div><dt>등록일</dt><dd>{{ gfn_formatDate(complaint.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</dd></div>
        </dl>
      </header>
      <div class="board-post__body">
        <DATextEditor :model-value="complaint.content || ''" :editable="false" :focusable="false" reader-mode :maxlength="null" />
      </div>
    </VCard>
    <VCard v-else id="complaint-form" class="train-card board-compose" elevation="0" tag="form" novalidate @submit.prevent="fn_save">
      <div class="board-compose__fields">
        <label class="board-compose__type">
          <span>민원 유형 *</span>
          <select v-model="form.type" :disabled="saving" :aria-invalid="Boolean(errors.type)">
            <option value="">유형을 선택하세요</option>
            <option v-for="item in COMPLAINT_TYPES" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <small v-if="errors.type">{{ errors.type }}</small>
        </label>
        <label class="board-compose__title">
          <span>제목 *</span>
          <input v-model.trim="form.title" type="text" maxlength="100" placeholder="제목을 입력하세요" :disabled="saving" :aria-invalid="Boolean(errors.title)" />
          <small v-if="errors.title">{{ errors.title }}</small>
        </label>
        <div class="board-compose__station">
          <CustomerServiceStationFields v-model="form.station" :disabled="saving" :error="errors.station" />
        </div>
        <div class="board-compose__editor complaint-editor-field" role="group" aria-labelledby="complaint-content-label" :aria-invalid="Boolean(errors.content)">
          <span id="complaint-content-label">내용 *</span>
          <DATextEditor
            ref="contentEditor"
            v-model="form.content"
            :editable="!saving"
            :maxlength="65000"
            min-height="300px"
            placeholder="민원 내용을 입력하세요."
          />
          <small v-if="errors.content" role="alert">{{ errors.content }}</small>
        </div>
      </div>
    </VCard>

    <VCard v-if="isEdit && complaint" class="train-card complaint-answer" elevation="0" tag="section" aria-labelledby="complaint-answer-heading">
      <h2 id="complaint-answer-heading">답변</h2>
      <div v-if="complaint.status === 'ANSWERED'" class="complaint-editor-view">
        <DAAnswerContent :model-value="complaint.replyContent || ''" />
      </div>
      <form v-else-if="canAnswer" id="complaint-answer-form" novalidate @submit.prevent="fn_answer">
        <div class="complaint-editor-field" role="group" aria-labelledby="complaint-reply-label" :aria-invalid="Boolean(replyError)">
          <span id="complaint-reply-label">답변 내용 * (10자 이상)</span>
          <textarea v-model="replyContent" class="customer-service-answer-textarea" aria-labelledby="complaint-reply-label" :aria-invalid="Boolean(replyError)" :disabled="saving || loading" maxlength="65000" rows="10" placeholder="답변 내용을 입력하세요." />
          <small v-if="replyError" role="alert">{{ replyError }}</small>
        </div>
      </form>
      <div v-else class="complaint-editor-view">
        <DAAnswerContent v-if="complaint.replyContent" :model-value="complaint.replyContent" />
        <p v-else>아직 등록된 답변이 없습니다.</p>
      </div>
    </VCard>

    <p v-if="pageError" class="train-inline-error" role="alert">{{ pageError }}</p>
    <div class="train-actions">
      <RouterLink class="train-button" :to="listTo">목록</RouterLink>
      <RouterLink class="train-button" :to="cancelTo">취소</RouterLink>
      <button v-if="canSaveComplaint" class="train-button train-button--primary" type="submit" form="complaint-form" :disabled="saving">
        {{ saving ? '저장 중...' : '저장' }}
      </button>
      <button v-if="canAnswer && !loading" class="train-button train-button--primary" type="submit" form="complaint-answer-form" :disabled="saving">
        {{ saving ? '저장 중...' : '답변 등록' }}
      </button>
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
