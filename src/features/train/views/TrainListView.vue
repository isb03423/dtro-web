<script setup>
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppSearchCondition from '@/components/common/AppSearchCondition.vue'
import { gfn_useListState } from '@/composables/useListState'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const searchFields = [
  { key: 'status', label: '운영 상태', type: 'select', options: TRAIN_STATUSES },
  {
    key: 'keyword',
    label: '검색어',
    type: 'search',
    placeholder: '열차 번호 또는 편성명으로 검색',
    wide: true,
    trim: true,
  },
]

const {
  filters,
  page: currentPage,
  size: pageSize,
  sort,
  gridSort,
  applyFilters,
  setGridOptions,
  reset,
} = gfn_useListState(searchFields)

// draft는 입력 중인 값이고, 실제 조회 조건은 filters에 보관한다.
const draft = ref({ ...filters.value })
const result = ref({ content: [], page: 0, totalElements: 0, totalPages: 0 })
const loading = ref(false)
const error = ref('')
let latestRequestId = 0

// 응답 데이터로 전체 페이지 수를 계산한다.
const totalPages = computed(() =>
  Math.max(1, result.value.totalPages || Math.ceil(result.value.totalElements / pageSize.value))
)

const headers = [
  { title: '열차 번호', key: 'trainNumber', width: '12%' },
  { title: '편성명', key: 'formationName', width: '25%' },
  { title: '운영 상태', key: 'status', width: '13%' },
  { title: '최근 점검일', key: 'lastInspectedOn' },
  { title: '등록일', key: 'createdAt' },
  { title: '등록자', key: 'createdByName' },
]

// 현재 검색 조건으로 목록을 불러오고 최신 요청 결과만 반영한다.
const fn_load = async () => {
  // 요청마다 번호를 올려 나중에 끝난 이전 요청이 화면을 덮지 못하게 한다.
  const requestId = ++latestRequestId

  loading.value = true
  error.value = ''
  try {
    const response = await fn_listTrains({
      ...filters.value,
      page: currentPage.value,
      size: pageSize.value,
      sort: sort.value,
    })

    if (requestId === latestRequestId) {
      result.value = response
    }
  } catch (requestError) {
    if (requestId === latestRequestId) {
      error.value = requestError.message
      result.value = { content: [], page: 0, totalElements: 0, totalPages: 0 }
    }
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

onMounted(fn_load)

// 입력한 조건을 저장한 뒤 열차 목록을 다시 조회한다.
const fn_search = () => {
  applyFilters(draft.value)
  fn_load()
}

// 검색 조건을 초기화하고 전체 열차 목록을 조회한다.
const fn_reset = () => {
  reset()
  draft.value = { ...filters.value }
  fn_load()
}

// 그리드의 페이지·정렬 변경을 저장하고 목록을 갱신한다.
const fn_updateGridOptions = options => {
  if (setGridOptions(options)) {
    fn_load()
  }
}

// 열차 ID로 상세 화면 주소를 만든다.
const fn_detailTo = id => {
  return `/trains/${id}`
}

// 선택한 그리드 행의 열차 상세 화면을 연다.
const fn_openTrain = (_event, { item }) => {
  return router.push(fn_detailTo(item.id))
}

// 그리드 행에 키보드 이동 속성과 동작을 부여한다.
const fn_rowProps = ({ item }) => ({
  class: 'train-grid__row',
  tabindex: 0,
  'aria-label': `${item.trainNumber} ${item.formationName}, Enter 키로 상세 보기`,

  // Enter 또는 Space 키로 해당 열차의 상세 화면을 연다.
  onKeydown: event => {
    if (event.target !== event.currentTarget) {
      return
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    router.push(fn_detailTo(item.id))
  },
})
</script>

<template>
  <div class="train-page">
    <header class="train-page__intro">
      <H2>열차 정보</H2>
      <p>열차 정보를 검색하고 등록·수정 내역을 관리합니다.</p>
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
            <RouterLink class="train-button train-button--primary" to="/trains/new"> 열차 정보 등록 </RouterLink>
          </div>

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
              loading-text="열차 정보를 불러오는 중입니다."
              @update:options="fn_updateGridOptions"
              @click:row="fn_openTrain"
            >
              <template #item.formationName="{ item }">
                <RouterLink class="train-grid__formation" :to="fn_detailTo(item.id)" @click.stop>
                  {{ item.formationName }}
                </RouterLink>
              </template>
              <template #item.createdAt="{ item }">
                {{ gfn_formatDate(item.createdAt, 'YYYY-MM-DD HH:mm:ss') }}
              </template>
              <template #item.status="{ item }">
                {{ gfn_getLabel(TRAIN_STATUSES, item.status) }}
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
            <p v-if="loading" class="train-mobile-list__state" role="status">열차 정보를 불러오는 중입니다.</p>
            <p v-else-if="error" class="train-mobile-list__state" role="alert">
              {{ error }} <button type="button" @click="fn_load">다시 시도</button>
            </p>
            <p v-else-if="!result.content.length" class="train-mobile-list__state">검색 결과가 없습니다.</p>
            <ul v-else class="train-mobile-list__items">
              <li v-for="item in result.content" :key="item.id">
                <RouterLink class="train-mobile-card" :to="fn_detailTo(item.id)">
                  <strong>{{ item.formationName }}</strong>
                  <dl>
                    <div>
                      <dt>열차 번호</dt>
                      <dd>{{ item.trainNumber }}</dd>
                    </div>
                    <div>
                      <dt>차량 수</dt>
                      <dd>{{ item.carCount }}량</dd>
                    </div>
                    <div>
                      <dt>운영 상태</dt>
                      <dd>{{ gfn_getLabel(TRAIN_STATUSES, item.status) }}</dd>
                    </div>
                    <div>
                      <dt>최근 점검일</dt>
                      <dd>{{ item.lastInspectedOn }}</dd>
                    </div>
                  </dl>
                </RouterLink>
              </li>
            </ul>
            <nav
              v-if="!loading && !error && result.totalElements > pageSize"
              class="train-mobile-list__pagination"
              aria-label="열차 목록 페이지"
            >
              <button
                class="train-button"
                type="button"
                :disabled="currentPage === 0"
                @click="fn_updateGridOptions({ page: currentPage, itemsPerPage: pageSize, sortBy: gridSort })"
              >
                이전
              </button>
              <span>{{ currentPage + 1 }} / {{ totalPages }}</span>
              <button
                class="train-button"
                type="button"
                :disabled="currentPage + 1 >= totalPages"
                @click="fn_updateGridOptions({ page: currentPage + 2, itemsPerPage: pageSize, sortBy: gridSort })"
              >
                다음
              </button>
            </nav>
          </div>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>
