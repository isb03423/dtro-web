<script setup>
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppSearchCondition from '@/components/common/AppSearchCondition.vue'
import { gfn_useListState } from '@/composables/useListState'
import { fn_listNotices, fn_deleteNotices, fn_updateNoticesPublicYn } from '@/features/notice/api/noticeApi'
import { gfn_formatDate } from '@/utils/date'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { APP_ROLES } from '@/config/sideMenu'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const isGuest = computed(() => auth.role === APP_ROLES.GUEST)
const canCreate = computed(() => [APP_ROLES.TRAIN_MANAGER, APP_ROLES.ADMIN].includes(auth.role))
const isAdmin = computed(() => auth.role === APP_ROLES.ADMIN)

const PUBLIC_OPTIONS = [
  { label: '공개', value: true },
  { label: '비공개', value: false },
]

const allSearchFields = [
  {
    key: 'publicYn',
    label: '공개여부',
    type: 'select',
    compact: true,
    options: PUBLIC_OPTIONS,
  },
  {
    key: 'keyword',
    label: '검색어',
    type: 'search-with-select',
    searchTypeKey: 'searchType',
    searchTypeLabel: '검색 범위',
    defaultSearchType: 'all',
    options: [
      { label: '제목', value: 'title' },
      { label: '내용', value: 'content' },
      { label: '제목+내용', value: 'all' },
    ],
    placeholder: '제목 또는 내용 전체가 일치하는 검색어',
    wide: true,
    trim: true,
  },
]
const searchFields = computed(() => isGuest.value ? allSearchFields.filter(field => field.key !== 'publicYn') : allSearchFields)

const {
  filters,
  page: currentPage,
  size: pageSize,
  sort,
  gridSort,
  applyFilters,
  setGridOptions,
  reset,
} = gfn_useListState(allSearchFields, { defaultSort: 'id,desc' })

const draft = ref({ publicYn: '', keyword: '', searchType: 'all' })
const selected = ref([])
const bulkPublicYn = ref('')
const bulkSaving = ref(false)
const result = ref({ content: [], page: 0, totalElements: 0, totalPages: 0 })
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
let latestRequestId = 0

const totalPages = computed(() =>
  Math.max(1, result.value.totalPages || Math.ceil(result.value.totalElements / pageSize.value))
)

const headers = computed(() => {
  const baseHeaders = [
    { title: '번호', key: 'id', width: '8%' },
    { title: '중요', key: 'importantYn', width: '10%' },
    ...(!isGuest.value ? [{ title: '공개여부', key: 'publicYn', width: '12%' }] : []),
    { title: '제목', key: 'title', width: '40%' },
    { title: '등록일', key: 'createdAt', width: '20%' },
  ]
  
  return baseHeaders
})

const fn_load = async () => {
  const requestId = ++latestRequestId
  selected.value = []

  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const queryParams = {
      page: currentPage.value,
      size: pageSize.value,
    }
    const [requestedSortKey, requestedSortOrder] = sort.value.split(',')
    const sortableKeys = ['id', 'importantYn', 'publicYn', 'title', 'createdAt']
    const sortKey = sortableKeys.includes(requestedSortKey) ? requestedSortKey : 'id'
    const sortOrder = requestedSortOrder === 'asc' ? 'asc' : 'desc'
    // 응답/그리드에서는 id를 사용하지만 JPA 엔티티의 실제 필드는 noticeId다.
    queryParams.sort = `${sortKey === 'id' ? 'noticeId' : sortKey},${sortOrder}`

    if (filters.value.keyword) {
      queryParams.keyword = filters.value.keyword
      queryParams.searchType = filters.value.searchType || 'all'
    }

    if (typeof filters.value.publicYn === 'boolean') {
      queryParams.publicYn = filters.value.publicYn
    }

    const response = await fn_listNotices(queryParams)

    if (requestId === latestRequestId) {
      if (Array.isArray(response)) {
        result.value = { content: response, totalElements: response.length, totalPages: 1 }
      } else {
        result.value = response
      }
    }
  } catch (requestError) {
    if (requestId === latestRequestId) {
      error.value = requestError.message || '공지사항을 불러오지 못했습니다.'
      result.value = { content: [], page: 0, totalElements: 0, totalPages: 0 }
    }
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

onMounted(async () => {
  try {
    await auth.restore()
  } catch {
    // 공개 공지 목록은 로그인 복원이 실패해도 계속 볼 수 있다.
  }
  fn_load()
})

watch(
  () => draft.value.publicYn,
  () => {
    fn_search()
  }
)

const fn_search = () => {
  applyFilters(draft.value)
  fn_load()
}

const fn_reset = () => {
  reset()
  draft.value = { publicYn: '', keyword: '', searchType: 'all' }
  fn_load()
}

const fn_updateGridOptions = options => {
  const selectedKey = options.sortBy?.[0]?.key
  const safeOptions = selectedKey && !['id', 'importantYn', 'publicYn', 'title', 'createdAt'].includes(selectedKey)
    ? { ...options, sortBy: gridSort.value }
    : options
  if (setGridOptions(safeOptions)) fn_load()
}

const fn_detailTo = id => {
  return `/notices/${id}`
}

const fn_openNotice = (event, { item }) => {
  if (event.target.closest('.v-selection-control')) return
  const targetId = item.id || item.noticeId
  return router.push(fn_detailTo(targetId))
}

const fn_removeSelected = async () => {
  if (!isAdmin.value || !selected.value.length || bulkSaving.value) return
  if (!window.confirm(`선택한 공지사항 ${selected.value.length}건을 삭제하시겠습니까?`)) return

  bulkSaving.value = true
  error.value = ''
  try {
    await fn_deleteNotices(selected.value)
    selected.value = []
    await fn_load()
  } catch (requestError) {
    error.value = requestError.message || '선택한 공지사항을 삭제하지 못했습니다.'
  } finally {
    bulkSaving.value = false
  }
}

const fn_updateSelectedPublicYn = async () => {
  if (!isAdmin.value || !selected.value.length || bulkPublicYn.value === '' || bulkSaving.value) return
  const publicYn = bulkPublicYn.value === 'true'
  const label = publicYn ? '공개' : '비공개'
  if (!window.confirm(`선택한 공지사항 ${selected.value.length}건을 ${label}로 변경하시겠습니까?`)) return

  bulkSaving.value = true
  error.value = ''
  try {
    const ids = [...selected.value]
    const updatedCount = await fn_updateNoticesPublicYn(ids, publicYn)
    bulkPublicYn.value = ''
    await fn_load()
    if (error.value) throw new Error(`목록을 다시 불러오지 못했습니다. ${error.value}`)
    successMessage.value = `${typeof updatedCount === 'number' ? updatedCount : ids.length}건의 공개 여부를 ${label}로 변경했습니다.`
  } catch (requestError) {
    const message = requestError.message || '공개 여부를 변경하지 못했습니다.'
    await fn_load()
    error.value = message
  } finally {
    bulkSaving.value = false
  }
}

const fn_toggleMobileSelection = (id, checked) => {
  if (checked && !selected.value.includes(id)) selected.value = [...selected.value, id]
  if (!checked) selected.value = selected.value.filter(selectedId => selectedId !== id)
}

const fn_rowProps = ({ item }) => {
  const targetId = item.id || item.noticeId
  return {
    class: 'train-grid__row',
    tabindex: 0,
    'aria-label': `${targetId} ${item.title}, Enter 키로 상세 보기`,
    onKeydown: event => {
      if (event.target !== event.currentTarget) return
      if (event.key !== 'Enter' && event.key !== ' ') return
      event.preventDefault()
      router.push(fn_detailTo(targetId))
    },
  }
}
</script>

<template>
  <div class="train-page complaint-page">
    <header class="train-page__intro">
      <h2>공지사항</h2>
      <p>공지사항을 검색하고 안내 내역을 관리합니다.</p>
    </header>

    <VRow class="train-layout" no-gutters>
      <VCol cols="12">
        <VCard class="train-search-card" elevation="0">
          <AppSearchCondition v-model="draft" :fields="searchFields" @search="fn_search" @reset="fn_reset" />
        </VCard>
      </VCol>

      <VCol cols="12">
        <VCard class="train-list-card" elevation="0" tag="section">
          <div class="train-list__heading">
            <div>
              <h2>목록</h2>
              <span>총 {{ result.totalElements }}건</span>
            </div>
            <div class="notice-list__actions">
              <div v-if="isAdmin" class="notice-list__bulk-actions">
                <span>{{ selected.length }}건 선택</span>
                <select v-model="bulkPublicYn" aria-label="선택한 공지사항 공개 여부" :disabled="bulkSaving">
                  <option value="">공개 여부 선택</option>
                  <option value="true">공개</option>
                  <option value="false">비공개</option>
                </select>
                <button class="train-button train-button--primary" type="button" :disabled="!selected.length || bulkPublicYn === '' || bulkSaving" @click="fn_updateSelectedPublicYn">
                  {{ bulkSaving ? '처리 중...' : '공개 여부 변경' }}
                </button>
                <button class="train-button" type="button" :disabled="!selected.length || bulkSaving" @click="fn_removeSelected">
                  선택 삭제
                </button>
              </div>
              <RouterLink v-if="canCreate" class="train-button train-button--primary" to="/notices/new">공지 등록</RouterLink>
            </div>
          </div>

          <p v-if="successMessage" class="notice-list__feedback notice-list__feedback--success" role="status">{{ successMessage }}</p>
          <p v-if="error" class="notice-list__feedback notice-list__feedback--error" role="alert">{{ error }}</p>

          <div class="train-table-wrap">
            <AppDataGrid
              class="train-grid"
              :columns="headers"
              :rows="result.content"
              :total-items="result.totalElements"
              :page-size="pageSize"
              :page="currentPage + 1"
              :sort-by="gridSort"
              :row-props="fn_rowProps"
              :loading="loading"
              v-model="selected"
              :show-select="isAdmin"
              item-value="id"
              loading-text="공지사항을 불러오는 중입니다."
              @update:options="fn_updateGridOptions"
              @click:row="fn_openNotice"
            >
              <template #item.importantYn="{ item }">
                <v-chip :color="item.importantYn ? 'error' : 'default'" size="x-small" label>
                  {{ item.importantYn ? '중요' : '일반' }}
                </v-chip>
              </template>

              <template #item.publicYn="{ item }">
                <v-chip :color="item.publicYn ? 'info' : 'grey'" size="x-small" label>
                  {{ item.publicYn ? '공개' : '비공개' }}
                </v-chip>
              </template>

              <template #item.title="{ item }">
                <RouterLink class="train-grid__formation notice-list__title" :to="fn_detailTo(item.id || item.noticeId)" @click.stop>
                  {{ item.title }}
                </RouterLink>
              </template>

              <template #item.createdAt="{ item }">
                {{ gfn_formatDate(item.createdAt, 'YYYY-MM-DD HH:mm:ss') }}
              </template>

              <template #no-data>
                <div v-if="error" class="train-grid__error">
                  {{ error }} <button type="button" @click="fn_load">다시 시도</button>
                </div>
                <span v-else>검색 결과가 없습니다.</span>
              </template>
            </AppDataGrid>
          </div>

          <div class="train-mobile-list">
            <p v-if="loading" class="train-mobile-list__state" role="status">공지사항을 불러오는 중입니다.</p>
            <p v-else-if="error" class="train-mobile-list__state" role="alert">
              {{ error }} <button type="button" @click="fn_load">다시 시도</button>
            </p>
            <p v-else-if="!result.content.length" class="train-mobile-list__state">검색 결과가 없습니다.</p>
            <ul v-else class="train-mobile-list__items">
              <li v-for="item in result.content" :key="item.id || item.noticeId">
                <label v-if="isAdmin" class="notice-list__mobile-select" @click.stop>
                  <input type="checkbox" :checked="selected.includes(item.id || item.noticeId)" :disabled="bulkSaving" @change="fn_toggleMobileSelection(item.id || item.noticeId, $event.target.checked)" />
                  선택
                </label>
                <RouterLink class="train-mobile-card" :to="fn_detailTo(item.id || item.noticeId)">
                  <strong class="notice-list__title">{{ item.title }}</strong>
                  <dl>
                    <div>
                      <dt>번호</dt>
                      <dd>{{ item.id || item.noticeId }}</dd>
                    </div>
                    <div>
                      <dt>중요여부</dt>
                      <dd>{{ item.importantYn ? '중요' : '일반' }}</dd>
                    </div>
                    <div v-if="!isGuest">
                      <dt>공개여부</dt>
                      <dd>{{ item.publicYn ? '공개' : '비공개' }}</dd>
                    </div>
                  </dl>
                </RouterLink>
              </li>
            </ul>
          </div>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.notice-list__actions,
.notice-list__bulk-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.notice-list__bulk-actions select {
  min-block-size: 40px;
  padding: 0 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
}

.notice-list__mobile-select {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
}

.notice-list__feedback {
  margin: 12px 0 0;
  font-size: 14px;
}

.notice-list__feedback--success { color: #147a42; }
.notice-list__feedback--error { color: #c62828; }

.notice-list__title {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
