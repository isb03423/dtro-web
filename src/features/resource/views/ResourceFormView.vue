<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DATextEditor from '@/components/common/DATextEditor.vue'
import { fn_createResource, fn_getResource, fn_updateResource } from '@/features/resource/api/resourceApi'
import { gfn_validateRequiredFields } from '@/utils/validation'
import '@styles/resource.scss'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => Boolean(route.params.resourceId))
const form = ref({ title: '', content: '', publicYn: true })
const attachments = ref([])
const selectedFiles = ref([])
const removedAttachmentIds = ref([])
const isDragging = ref(false)
const editor = ref(null)
const errors = ref({})
const pageError = ref('')
const loading = ref(false)
const saving = ref(false)
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const selectedFileBytes = computed(() => selectedFiles.value.reduce((sum, file) => sum + file.size, 0))
let latestRequestId = 0
let dragDepth = 0

const fn_load = async () => {
  const requestId = ++latestRequestId

  form.value = { title: '', content: '', publicYn: true }
  attachments.value = []
  selectedFiles.value = []
  removedAttachmentIds.value = []
  isDragging.value = false
  dragDepth = 0
  errors.value = {}
  pageError.value = ''
  loading.value = isEdit.value
  if (!isEdit.value) {
    return
  }
  try {
    const data = await fn_getResource(route.params.resourceId)
    if (requestId === latestRequestId) {
      form.value = { title: data.title ?? '', content: data.content ?? '', publicYn: Boolean(data.publicYn) }
      attachments.value = data.attachments ?? []
    }
  } catch (requestError) {
    if (requestId === latestRequestId) {
      pageError.value = requestError.message || '자료를 불러오지 못했습니다.'
    }
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

watch(() => route.params.resourceId, fn_load, { immediate: true })

const fn_fileKey = file => `${file.name}:${file.size}:${file.lastModified}`

const attachmentItems = computed(() => [
  ...attachments.value
    .filter(file => !removedAttachmentIds.value.includes(file.attachmentId))
    .map(file => ({ key: `existing-${file.attachmentId}`, id: file.attachmentId, name: file.originalName, href: file.filePath, size: file.sizeBytes })),
  ...selectedFiles.value.map(file => ({ key: `selected-${fn_fileKey(file)}`, name: file.name, size: file.size, file })),
])

const fn_getFilesError = files => files.reduce((sum, file) => sum + file.size, 0) > MAX_ATTACHMENT_BYTES
  ? '첨부 파일은 합계 10MB 이하로 선택하세요.'
  : ''

const fn_addFiles = files => {
  const existingKeys = new Set(selectedFiles.value.map(fn_fileKey))
  const nextFiles = [...selectedFiles.value]
  for (const file of files ?? []) {
    const key = fn_fileKey(file)
    if (!existingKeys.has(key)) {
      nextFiles.push(file)
      existingKeys.add(key)
    }
  }
  selectedFiles.value = nextFiles
  errors.value.files = fn_getFilesError(nextFiles)
}

const fn_selectFiles = event => {
  fn_addFiles(event.target.files)
  event.target.value = ''
  isDragging.value = false
  dragDepth = 0
}

const fn_dragEnter = () => {
  if (saving.value) {
    return
  }
  dragDepth += 1
  isDragging.value = true
}

const fn_dragLeave = () => {
  dragDepth = Math.max(0, dragDepth - 1)
  isDragging.value = dragDepth > 0
}

const fn_dropFiles = event => {
  isDragging.value = false
  dragDepth = 0
  if (!saving.value) {
    fn_addFiles(event.dataTransfer?.files)
  }
}

const fn_removeFile = item => {
  if (item.id != null) {
    removedAttachmentIds.value = [...removedAttachmentIds.value, item.id]
  } else {
    selectedFiles.value = selectedFiles.value.filter(file => file !== item.file)
  }
  errors.value.files = fn_getFilesError(selectedFiles.value)
}

const fn_removeAllFiles = () => {
  removedAttachmentIds.value = attachments.value.map(file => file.attachmentId)
  selectedFiles.value = []
  errors.value.files = ''
}

const fn_fileTypeLabel = name => {
  const extensionIndex = name.lastIndexOf('.')

  return extensionIndex > 0 && extensionIndex < name.length - 1
    ? name.slice(extensionIndex + 1).toUpperCase()
    : 'FILE'
}

const fn_formatFileSize = size => {
  if (size < 1024) {
    return `${size} B`
  }

  return size < 1024 * 1024
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`
}

const fn_validate = () => {
  const next = gfn_validateRequiredFields(form.value, ['title', 'content'])
  if (form.value.title.trim().length > 200) {
    next.title = '제목은 200자 이내로 입력하세요.'
  }
  const contentText = new DOMParser().parseFromString(form.value.content, 'text/html').body.textContent || ''
  if (!contentText.trim()) {
    next.content = '내용을 입력하세요.'
  }
  if (editor.value?.isOverLimit) {
    next.content = '내용은 65,000자 이내로 입력하세요.'
  }
  if (fn_getFilesError(selectedFiles.value)) {
    next.files = fn_getFilesError(selectedFiles.value)
  }
  errors.value = next

  return Object.keys(next).length === 0
}

const fn_save = async () => {
  if (saving.value || loading.value || (isEdit.value && !form.value.title && pageError.value)) {
    return
  }
  form.value.content = editor.value?.getContentForSave() ?? form.value.content
  if (!fn_validate()) {
    return
  }

  saving.value = true
  pageError.value = ''

  const payload = {
    title: form.value.title.trim(),
    content: form.value.content.trim(),
    publicYn: form.value.publicYn,
    ...(isEdit.value ? { removedAttachmentIds: removedAttachmentIds.value } : {}),
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
      if (field in form.value) {
        errors.value[field] = message
      }
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
    <template v-else>
      <VCard id="resource-form" class="train-card board-compose" elevation="0" tag="form" novalidate @submit.prevent="fn_save">
        <div class="board-compose__fields">
          <label class="board-compose__title">
            <span>제목 *</span>
            <input v-model.trim="form.title" type="text" maxlength="200" placeholder="제목을 입력하세요" :disabled="saving" :aria-invalid="Boolean(errors.title)" />
            <small v-if="errors.title" role="alert">{{ errors.title }}</small>
          </label>
          <div class="board-compose__editor" role="group" aria-labelledby="resource-content-label" :aria-invalid="Boolean(errors.content)">
            <div class="board-compose__content-heading">
              <span id="resource-content-label">내용 *</span>
              <div class="board-compose__flags">
                <label class="board-compose__flag">
                  <input v-model="form.publicYn" type="checkbox" :disabled="saving" />
                  <span>공개 여부</span>
                </label>
              </div>
            </div>
            <DATextEditor ref="editor" v-model="form.content" :editable="!saving" :maxlength="65000" min-height="300px" placeholder="자료 내용을 입력하세요." />
            <small v-if="errors.content" role="alert">{{ errors.content }}</small>
          </div>
        </div>
      </VCard>

      <VCard class="train-card resource-upload-card" elevation="0" tag="section" aria-labelledby="resource-upload-heading">
        <h2 id="resource-upload-heading">첨부파일</h2>
        <div
          class="resource-upload-card__dropzone"
          :class="{ 'resource-upload-card__dropzone--active': isDragging, 'resource-upload-card__dropzone--disabled': saving }"
          @dragenter.prevent.stop="fn_dragEnter"
          @dragover.prevent.stop
          @dragleave.prevent.stop="fn_dragLeave"
          @drop.prevent.stop="fn_dropFiles"
        >
          <VIcon icon="bx-upload" size="28" aria-hidden="true" />
          <div class="resource-upload-card__guide">
            <strong>파일을 이곳에 끌어놓거나 버튼으로 선택하세요.</strong>
            <small>새로 추가할 파일 합계 {{ fn_formatFileSize(selectedFileBytes) }} / 10 MB</small>
          </div>
          <input id="resource-file-input" class="resource-upload-card__input" type="file" multiple aria-label="첨부 파일 선택" :disabled="saving" @change="fn_selectFiles" />
          <label class="resource-upload-card__choose" for="resource-file-input">+ 파일 선택</label>
        </div>
        <small v-if="errors.files" class="resource-upload-card__error" role="alert">{{ errors.files }}</small>
        <div v-if="attachmentItems.length" class="resource-upload-card__summary">
          <span>{{ attachmentItems.length }}개 파일</span>
          <button type="button" :disabled="saving" @click="fn_removeAllFiles">전체 파일 삭제</button>
        </div>
        <ul v-if="attachmentItems.length" class="resource-upload-card__list" aria-label="첨부 파일 목록">
          <li v-for="item in attachmentItems" :key="item.key">
            <span class="resource-upload-card__type">{{ fn_fileTypeLabel(item.name) }}</span>
            <a v-if="item.href" class="resource-upload-card__name" :href="item.href">{{ item.name }}</a>
            <span v-else class="resource-upload-card__name">{{ item.name }}</span>
            <span class="resource-upload-card__size">{{ item.size == null ? '' : fn_formatFileSize(item.size) }}</span>
            <button type="button" :aria-label="`${item.name} 삭제`" :disabled="saving" @click="fn_removeFile(item)">
              <VIcon icon="bx-x" size="20" aria-hidden="true" />
            </button>
          </li>
        </ul>
        <small v-if="isEdit && removedAttachmentIds.length" class="resource-upload-card__note">기존 파일 삭제는 저장할 때 반영됩니다.</small>
      </VCard>
    </template>

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
