<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppSearchCondition from '@/components/common/AppSearchCondition.vue'
import { gfn_useListState } from '@/composables/useListState'
import { APP_ROLES } from '@/config/sideMenu'
import { fn_deleteResources, fn_listResources, fn_updateResourcesPublicYn } from '@/features/resource/api/resourceApi'
import { useAuthStore } from '@/stores/auth'
import { gfn_formatDate } from '@/utils/date'
import '../styles/resource.scss'

const router = useRouter()
const auth = useAuthStore()
const isGuest = computed(() => auth.role === APP_ROLES.GUEST)
const canCreate = computed(() => [APP_ROLES.TRAIN_MANAGER, APP_ROLES.ADMIN].includes(auth.role))
const isAdmin = computed(() => auth.role === APP_ROLES.ADMIN)
const publicOptions = [
  { label: '공개', value: true },
  { label: '비공개', value: false },
]
const allSearchFields = [
  { key: 'publicYn', label: '공개여부', type: 'select', options: publicOptions, compact: true },
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
    placeholder: '검색어를 입력하세요',
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
} = gfn_useListState(allSearchFields, { defaultSort: 'resourceId,desc' })
const draft = ref({ publicYn: '', keyword: '', searchType: 'all' })
const selected = ref([])
const bulkPublicYn = ref('')
const bulkSaving = ref(false)
const result = ref({ content: [], totalElements: 0, totalPages: 0 })
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
let latestRequestId = 0

const headers = computed(() => {
  const columns = [
    { title: '번호', key: 'resourceId', width: '10%' },
    ...(!isGuest.value ? [{ title: '공개 여부', key: 'publicYn', width: '14%' }] : []),
    { title: '제목', key: 'title', width: '48%' },
    { title: '등록일', key: 'createdAt', width: '20%' },
  ]
  return columns
})

const fn_load = async () => {
  const requestId = ++latestRequestId
  selected.value = []
  loading.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const [requestedSortKey, requestedSortOrder] = sort.value.split(',')
    const sortableKeys = ['resourceId', 'title', 'publicYn', 'createdAt']
    const sortKey = sortableKeys.includes(requestedSortKey) ? requestedSortKey : 'resourceId'
    const sortOrder = requestedSortOrder === 'asc' ? 'asc' : 'desc'
    const params = { page: currentPage.value, size: pageSize.value, sort: `${sortKey},${sortOrder}` }
    if (filters.value.keyword) {
      params.keyword = filters.value.keyword
      params.searchType = filters.value.searchType || 'all'
    }
    if (typeof filters.value.publicYn === 'boolean') params.publicYn = filters.value.publicYn
    const response = await fn_listResources(params)
    if (requestId === latestRequestId) result.value = response
  } catch (requestError) {
    if (requestId === latestRequestId) {
      error.value = requestError.message || '자료 목록을 불러오지 못했습니다.'
      result.value = { content: [], totalElements: 0, totalPages: 0 }
    }
  } finally {
    if (requestId === latestRequestId) loading.value = false
  }
}

onMounted(async () => {
  try {
    await auth.restore()
  } catch {
    // 공개 자료실은 로그인 복원 실패와 관계없이 조회할 수 있다.
  }
  fn_load()
})

watch(() => draft.value.publicYn, () => fn_search())
const fn_search = () => { applyFilters(draft.value); fn_load() }
const fn_reset = () => { reset(); draft.value = { publicYn: '', keyword: '', searchType: 'all' }; fn_load() }
const fn_updateGridOptions = options => {
  const selectedKey = options.sortBy?.[0]?.key
  const safeOptions = selectedKey && !['resourceId', 'title', 'publicYn', 'createdAt'].includes(selectedKey)
    ? { ...options, sortBy: gridSort.value }
    : options
  if (setGridOptions(safeOptions)) fn_load()
}
const fn_open = (event, { item }) => {
  if (event.target.closest('.v-selection-control')) return
  router.push(`/resources/${item.resourceId}`)
}
const fn_removeSelected = async () => {
  if (!isAdmin.value || !selected.value.length || bulkSaving.value) return
  if (!window.confirm(`선택한 자료 ${selected.value.length}건을 삭제하시겠습니까?`)) return
  bulkSaving.value = true
  error.value = ''
  try {
    await fn_deleteResources(selected.value)
    selected.value = []
    await fn_load()
  } catch (requestError) {
    error.value = requestError.message || '선택한 자료를 삭제하지 못했습니다.'
  } finally {
    bulkSaving.value = false
  }
}

const fn_updateSelectedPublicYn = async () => {
  if (!isAdmin.value || !selected.value.length || bulkPublicYn.value === '' || bulkSaving.value) return
  const publicYn = bulkPublicYn.value === 'true'
  const label = publicYn ? '공개' : '비공개'
  if (!window.confirm(`선택한 자료 ${selected.value.length}건을 ${label}로 변경하시겠습니까?`)) return
  bulkSaving.value = true
  error.value = ''
  try {
    const ids = [...selected.value]
    const updatedCount = await fn_updateResourcesPublicYn(ids, publicYn)
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
const fn_rowProps = ({ item }) => ({
  class: 'train-grid__row',
  tabindex: 0,
  'aria-label': `${item.resourceId} ${item.title}, Enter 키로 상세 보기`,
  onKeydown: event => {
    if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return
    event.preventDefault()
    router.push(`/resources/${item.resourceId}`)
  },
})
</script>

<template>
  <div class="train-page resource-list-page">
    <header class="train-page__intro">
      <h2>자료실</h2>
      <p>자료를 검색하고 안내 파일을 확인합니다.</p>
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
            <div><h2>목록</h2><span>총 {{ result.totalElements }}건</span></div>
            <div class="resource-page__list-actions">
              <div v-if="isAdmin" class="resource-page__bulk-actions">
                <span>{{ selected.length }}건 선택</span>
                <select v-model="bulkPublicYn" aria-label="선택한 자료 공개 여부" :disabled="bulkSaving">
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
              <RouterLink v-if="canCreate" class="train-button train-button--primary" to="/resources/new">자료 등록</RouterLink>
            </div>
          </div>
          <p v-if="successMessage" class="resource-page__feedback resource-page__feedback--success" role="status">{{ successMessage }}</p>
          <p v-if="error" class="resource-page__feedback resource-page__feedback--error" role="alert">{{ error }}</p>
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
              item-value="resourceId"
              loading-text="자료를 불러오는 중입니다."
              @update:options="fn_updateGridOptions"
              @click:row="fn_open"
            >
              <template #item.title="{ item }">
                <RouterLink class="train-grid__formation resource-list__title" :to="`/resources/${item.resourceId}`" @click.stop>{{ item.title }}</RouterLink>
              </template>
              <template #item.publicYn="{ item }">
                <v-chip :color="item.publicYn ? 'info' : 'grey'" size="x-small" label>
                  {{ item.publicYn ? '공개' : '비공개' }}
                </v-chip>
              </template>
              <template #item.createdAt="{ item }">{{ gfn_formatDate(item.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</template>
              <template #no-data>
                <div v-if="error" class="train-grid__error">{{ error }} <button type="button" @click="fn_load">다시 시도</button></div>
                <span v-else>검색 결과가 없습니다.</span>
              </template>
            </AppDataGrid>
          </div>
          <div class="train-mobile-list">
            <p v-if="loading" class="train-mobile-list__state" role="status">자료를 불러오는 중입니다.</p>
            <p v-else-if="error" class="train-mobile-list__state" role="alert">{{ error }} <button type="button" @click="fn_load">다시 시도</button></p>
            <p v-else-if="!result.content.length" class="train-mobile-list__state">검색 결과가 없습니다.</p>
            <ul v-else class="train-mobile-list__items">
              <li v-for="item in result.content" :key="item.resourceId">
                <label v-if="isAdmin" class="resource-page__mobile-select" @click.stop>
                  <input type="checkbox" :checked="selected.includes(item.resourceId)" :disabled="bulkSaving" @change="fn_toggleMobileSelection(item.resourceId, $event.target.checked)" />
                  선택
                </label>
                <RouterLink class="train-mobile-card" :to="`/resources/${item.resourceId}`">
                  <strong class="resource-list__title">{{ item.title }}</strong>
                  <dl>
                    <div><dt>번호</dt><dd>{{ item.resourceId }}</dd></div>
                    <div v-if="!isGuest"><dt>공개 여부</dt><dd>{{ item.publicYn ? '공개' : '비공개' }}</dd></div>
                    <div><dt>등록일</dt><dd>{{ gfn_formatDate(item.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</dd></div>
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
.resource-page__list-actions,
.resource-page__bulk-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.resource-page__bulk-actions select {
  min-block-size: 40px;
  padding: 0 10px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 4px;
  background: rgb(var(--v-theme-surface));
}

.resource-page__mobile-select {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
}

.resource-page__feedback {
  margin: 12px 0 0;
  font-size: 14px;
}

.resource-page__feedback--success { color: #147a42; }
.resource-page__feedback--error { color: #c62828; }

.resource-list__title {
  display: block;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.train-grid .v-data-table__th--sorted .v-data-table-header__content) {
  justify-content: flex-start;
  gap: 6px;
}
</style>
