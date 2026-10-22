<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DATextEditor from '@/components/common/DATextEditor.vue'
import { APP_ROLES } from '@/config/sideMenu'
import { fn_deleteResource, fn_getResource } from '@/features/resource/api/resourceApi'
import { useAuthStore } from '@/stores/auth'
import { gfn_formatDate } from '@/utils/date'
import '../styles/resource.scss'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isGuest = computed(() => auth.role === APP_ROLES.GUEST)
const canEdit = computed(() => [APP_ROLES.TRAIN_MANAGER, APP_ROLES.ADMIN].includes(auth.role))
const isAdmin = computed(() => auth.role === APP_ROLES.ADMIN)
const resource = ref(null)
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
let latestRequestId = 0

const fn_load = async () => {
  const requestId = ++latestRequestId

  loading.value = true
  error.value = ''
  resource.value = null
  try {
    const response = await fn_getResource(route.params.resourceId)
    if (requestId === latestRequestId) {
      resource.value = response
    }
  } catch (requestError) {
    if (requestId === latestRequestId) {
      error.value = requestError.message || '자료를 불러오지 못했습니다.'
    }
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

watch(() => route.params.resourceId, fn_load, { immediate: true })
onMounted(async () => {
  try {
    await auth.restore()
  } catch {
    // 공개 자료는 로그인 복원 실패와 관계없이 조회할 수 있다.
  }
})

const fn_remove = async () => {
  if (!isAdmin.value || deleting.value || !resource.value) {
    return
  }
  if (!window.confirm('이 자료를 삭제하시겠습니까?')) {
    return
  }
  deleting.value = true
  error.value = ''
  try {
    await fn_deleteResource(resource.value.resourceId)
    await router.push('/resources')
  } catch (requestError) {
    error.value = requestError.message || '자료를 삭제하지 못했습니다.'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="train-page resource-page resource-detail-page">
    <header class="train-page__intro">
      <h2>자료실</h2>
      <p>자료의 상세 내용과 첨부 파일을 확인하세요.</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0" role="status">자료를 불러오는 중입니다.</VCard>
    <VCard v-else-if="error && !resource" class="train-card train-card__state" elevation="0" role="alert">
      {{ error }} <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <template v-else-if="resource">
      <VCard class="train-card board-post" elevation="0" tag="article" aria-labelledby="resource-detail-heading">
        <header class="board-post__header">
          <div class="board-post__badges">
            <span v-if="!isGuest" class="board-post__badge" :class="{ 'board-post__badge--muted': !resource.publicYn }">
              {{ resource.publicYn ? '공개' : '비공개' }}
            </span>
          </div>
          <h2 id="resource-detail-heading" class="board-post__title">{{ resource.title }}</h2>
          <dl class="board-post__meta">
            <div><dt>등록자</dt><dd>{{ resource.createdByName || '—' }}</dd></div>
            <div><dt>등록일</dt><dd>{{ gfn_formatDate(resource.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</dd></div>
            <div v-if="resource.updatedByName"><dt>수정자</dt><dd>{{ resource.updatedByName }}</dd></div>
            <div v-if="resource.updatedByName"><dt>수정일</dt><dd>{{ gfn_formatDate(resource.updatedAt, 'YYYY-MM-DD HH:mm:ss') }}</dd></div>
          </dl>
        </header>
        <section class="board-post__body" aria-label="자료 내용">
          <DATextEditor :model-value="resource.content || ''" :editable="false" :focusable="false" reader-mode :maxlength="null" />
        </section>
        <section class="board-post__files" aria-labelledby="resource-files-heading">
          <h3 id="resource-files-heading">첨부 파일 {{ resource.attachments?.length || 0 }}건</h3>
          <ul v-if="resource.attachments?.length" class="resource-page__attachments">
            <li v-for="file in resource.attachments" :key="file.attachmentId">
              <a :href="file.filePath"><VIcon icon="mdi-paperclip" size="small" />{{ file.originalName }}</a>
            </li>
          </ul>
          <p v-else class="resource-page__empty-files">첨부 파일이 없습니다.</p>
        </section>
      </VCard>
      <p v-if="error" class="train-inline-error" role="alert">{{ error }}</p>
    </template>

    <div class="train-actions">
      <RouterLink class="train-button" to="/resources">목록</RouterLink>
      <button v-if="isAdmin && resource" class="train-button" type="button" :disabled="deleting" @click="fn_remove">
        {{ deleting ? '삭제 중...' : '삭제' }}
      </button>
      <RouterLink v-if="canEdit && resource && !deleting" class="train-button train-button--primary" :to="`/resources/${resource.resourceId}/edit`">수정</RouterLink>
    </div>
  </div>
</template>
