<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DATextEditor from '@/components/common/DATextEditor.vue'
import { fn_createResource, fn_getResource, fn_updateResource } from '@/features/resource/api/resourceApi'
import { gfn_validateRequiredFields } from '@/utils/validation'
import '../styles/resource.scss'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => Boolean(route.params.resourceId))
const form = ref({ title: '', content: '', publicYn: true })
const attachments = ref([])
const selectedFiles = ref([])
const editor = ref(null)
const errors = ref({})
const pageError = ref('')
const loading = ref(false)
const saving = ref(false)
let latestRequestId = 0

const fn_load = async () => {
  const requestId = ++latestRequestId
  form.value = { title: '', content: '', publicYn: true }
  attachments.value = []
  selectedFiles.value = []
  errors.value = {}
  pageError.value = ''
  loading.value = isEdit.value
  if (!isEdit.value) return
  try {
    const data = await fn_getResource(route.params.resourceId)
    if (requestId === latestRequestId) {
      form.value = { title: data.title ?? '', content: data.content ?? '', publicYn: Boolean(data.publicYn) }
      attachments.value = data.attachments ?? []
    }
  } catch (requestError) {
    if (requestId === latestRequestId) pageError.value = requestError.message || '자료를 불러오지 못했습니다.'
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

watch(() => route.params.resourceId, fn_load, { immediate: true })

const fn_selectFiles = event => {
  selectedFiles.value = [...event.target.files]
  errors.value.files = ''
}

const fn_validate = () => {
  const next = gfn_validateRequiredFields(form.value, ['title', 'content'])
  if (form.value.title.trim().length > 200) next.title = '제목은 200자 이내로 입력하세요.'
  const contentText = new DOMParser().parseFromString(form.value.content, 'text/html').body.textContent || ''
  if (!contentText.trim()) next.content = '내용을 입력하세요.'
  if (editor.value?.isOverLimit) next.content = '내용은 65,000자 이내로 입력하세요.'
  if (selectedFiles.value.reduce((sum, file) => sum + file.size, 0) > 10 * 1024 * 1024) {
    next.files = '첨부 파일은 합계 10MB 이하로 선택하세요.'
  }
  errors.value = next
  return Object.keys(next).length === 0
}

const fn_save = async () => {
  if (saving.value || loading.value || (isEdit.value && !form.value.title && pageError.value)) return
  form.value.content = editor.value?.getContentForSave() ?? form.value.content
  if (!fn_validate()) return

  saving.value = true
  pageError.value = ''
  const payload = {
    title: form.value.title.trim(),
    content: form.value.content.trim(),
    publicYn: form.value.publicYn,
  }
  try {
    const saved = isEdit.value
      ? await fn_updateResource(route.params.resourceId, payload, selectedFiles.value)
      : await fn_createResource(payload, selectedFiles.value)
    const savedId = isEdit.value
      ? route.params.resourceId
      : (saved?.resourceId ?? saved?.id)
    if (!savedId) {
      throw new Error('자료는 저장되었지만 상세 정보 번호를 받지 못했습니다. 자료실 목록에서 확인해 주세요.')
    }
    await router.push(`/resources/${savedId}`)
  } catch (requestError) {
    pageError.value = requestError.message || '자료를 저장하지 못했습니다.'
    for (const detail of requestError.details ?? []) {
      const [field, message] = detail.split(': ', 2)
      if (field in form.value) errors.value[field] = message
    }
  } finally {
    saving.value = false
  }
}

const cancelTo = computed(() => isEdit.value ? `/resources/${route.params.resourceId}` : '/resources')
</script>

<template>
  <div class="train-page resource-page">
    <header class="train-page__intro">
      <h2>{{ isEdit ? '자료 수정' : '자료 등록' }}</h2>
      <p>자료 정보를 입력하고 필요한 파일을 첨부하세요. * 필수 입력</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">자료를 불러오는 중입니다.</VCard>
    <VCard v-else-if="isEdit && pageError && !form.title" class="train-card train-card__state" elevation="0" role="alert">
      {{ pageError }} <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <VCard v-else id="resource-form" class="train-card" elevation="0" tag="form" novalidate @submit.prevent="fn_save">
      <div class="train-field-grid train-field-grid--form">
        <label class="resource-page__full">
          <span>제목 *</span>
          <input v-model.trim="form.title" type="text" maxlength="200" :disabled="saving" :aria-invalid="Boolean(errors.title)" />
          <small v-if="errors.title" role="alert">{{ errors.title }}</small>
        </label>
        <div class="resource-page__full resource-page__visibility">
          <VSwitch v-model="form.publicYn" label="공개 여부" color="info" density="compact" hide-details :disabled="saving" />
        </div>
        <label class="resource-page__full">
          <span>첨부 파일 (선택, 합계 10MB 이하)</span>
          <input type="file" multiple :disabled="saving" @change="fn_selectFiles" />
          <small v-if="errors.files" role="alert">{{ errors.files }}</small>
          <small v-if="selectedFiles.length" class="resource-page__file-names">
            {{ selectedFiles.map(file => file.name).join(', ') }}
          </small>
        </label>
        <div v-if="attachments.length" class="resource-page__full">
          <span class="resource-page__label">기존 첨부 파일</span>
          <ul class="resource-page__existing-files">
            <li v-for="file in attachments" :key="file.attachmentId">{{ file.originalName }}</li>
          </ul>
        </div>
        <div class="resource-page__full resource-page__editor" role="group" aria-labelledby="resource-content-label" :aria-invalid="Boolean(errors.content)">
          <span id="resource-content-label">내용 *</span>
          <DATextEditor ref="editor" v-model="form.content" :editable="!saving" :maxlength="65000" min-height="300px" placeholder="자료 내용을 입력하세요." />
          <small v-if="errors.content" role="alert">{{ errors.content }}</small>
        </div>
      </div>
    </VCard>

    <p v-if="pageError && !(isEdit && !form.title)" class="train-inline-error" role="alert">{{ pageError }}</p>
    <div class="train-actions">
      <RouterLink class="train-button" to="/resources">목록</RouterLink>
      <RouterLink class="train-button" :to="cancelTo">취소</RouterLink>
      <button class="train-button train-button--primary" type="button" :disabled="saving || loading || (isEdit && !form.title && Boolean(pageError))" @click="fn_save">
        {{ saving ? '저장 중...' : '저장' }}
      </button>
    </div>
  </div>
</template>
