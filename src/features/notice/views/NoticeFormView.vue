<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DATextEditor from '@/components/common/DATextEditor.vue'
import { fn_createNotice, fn_getNoticeDetail, fn_updateNotice } from '@/features/notice/api/noticeApi'
import { gfn_validateRequiredFields } from '@/utils/validation'
import '../styles/notice.scss'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => Boolean(route.params.id))
const form = ref({ title: '', content: '', importantYn: false, publicYn: true })
const contentEditor = ref(null)
const errors = ref({})
const pageError = ref('')
const loading = ref(false)
const saving = ref(false)
let latestRequestId = 0

const fn_load = async () => {
  const requestId = ++latestRequestId
  form.value = { title: '', content: '', importantYn: false, publicYn: true }
  errors.value = {}
  pageError.value = ''
  loading.value = isEdit.value
  if (!isEdit.value) return

  try {
    const notice = await fn_getNoticeDetail(route.params.id)
    if (requestId === latestRequestId) {
      form.value = {
        title: notice.title ?? '',
        content: notice.content ?? '',
        importantYn: Boolean(notice.importantYn),
        publicYn: Boolean(notice.publicYn),
      }
    }
  } catch (requestError) {
    if (requestId === latestRequestId) pageError.value = requestError.message
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

watch(() => route.params.id, fn_load, { immediate: true })

const fn_validate = () => {
  const next = gfn_validateRequiredFields(form.value, ['title', 'content'])
  if (form.value.title.trim().length > 200) next.title = '제목은 200자 이내로 입력하세요.'

  const contentText = new DOMParser().parseFromString(form.value.content, 'text/html').body.textContent || ''
  if (!contentText.trim()) next.content = '내용을 입력하세요.'
  if (contentEditor.value?.isOverLimit) next.content = '내용은 65,000자 이내로 입력하세요.'
  errors.value = next

  return Object.keys(next).length === 0
}

const fn_save = async () => {
  if (saving.value || loading.value || (isEdit.value && !form.value.title && pageError.value)) return
  form.value.content = contentEditor.value?.getContentForSave() ?? form.value.content
  if (!fn_validate()) return

  saving.value = true
  pageError.value = ''
  const payload = {
    title: form.value.title.trim(),
    content: form.value.content.trim(),
    importantYn: form.value.importantYn,
    publicYn: form.value.publicYn,
  }

  try {
    const saved = isEdit.value
      ? await fn_updateNotice(route.params.id, payload)
      : await fn_createNotice(payload)
    const savedId = isEdit.value ? route.params.id : (saved?.id ?? saved?.noticeId)
    await router.push(savedId ? `/notices/${savedId}` : '/notices')
  } catch (requestError) {
    pageError.value = requestError.message || '공지사항을 저장하지 못했습니다.'
    for (const detail of requestError.details ?? []) {
      const [field, message] = detail.split(': ', 2)
      if (field in form.value) errors.value[field] = message
    }
  } finally {
    saving.value = false
  }
}

const cancelTo = computed(() => isEdit.value ? `/notices/${route.params.id}` : '/notices')
</script>

<template>
  <div class="train-page notice-form-page">
    <header class="train-page__intro">
      <h2>{{ isEdit ? '공지사항 수정' : '공지사항 등록' }}</h2>
      <p>필수 항목을 확인한 뒤 저장하세요. * 필수 입력</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">
      공지사항을 불러오는 중입니다.
    </VCard>
    <VCard v-else-if="isEdit && pageError && !form.title" class="train-card train-card__state" elevation="0" role="alert">
      {{ pageError }} <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <VCard v-else id="notice-form" class="train-card" elevation="0" tag="form" novalidate @submit.prevent="fn_save">
      <div class="train-field-grid train-field-grid--form">
        <label class="notice-form-page__full">
          <span>제목 *</span>
          <input v-model.trim="form.title" type="text" maxlength="200" :disabled="saving" :aria-invalid="Boolean(errors.title)" />
          <small v-if="errors.title" role="alert">{{ errors.title }}</small>
        </label>

        <div class="notice-form-page__full notice-form-page__switches">
          <VSwitch v-model="form.importantYn" label="중요 공지" color="error" density="compact" hide-details :disabled="saving" />
          <VSwitch v-model="form.publicYn" label="공개 여부" color="info" density="compact" hide-details :disabled="saving" />
        </div>

        <div class="notice-form-page__full notice-form-page__editor" role="group" aria-labelledby="notice-content-label" :aria-invalid="Boolean(errors.content)">
          <span id="notice-content-label">내용 *</span>
          <DATextEditor
            ref="contentEditor"
            v-model="form.content"
            :editable="!saving"
            :maxlength="65000"
            min-height="300px"
            placeholder="공지사항 내용을 입력하세요."
          />
          <small v-if="errors.content" role="alert">{{ errors.content }}</small>
        </div>
      </div>
    </VCard>

    <p v-if="pageError && !(isEdit && !form.title)" class="train-inline-error" role="alert">{{ pageError }}</p>
    <div class="train-actions">
      <RouterLink class="train-button" to="/notices">목록</RouterLink>
      <RouterLink class="train-button" :to="cancelTo">취소</RouterLink>
      <button class="train-button train-button--primary" type="submit" form="notice-form" :disabled="saving || loading || (isEdit && !form.title && Boolean(pageError))">
        {{ saving ? '저장 중...' : '저장' }}
      </button>
    </div>
  </div>
</template>
