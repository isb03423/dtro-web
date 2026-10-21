<script setup>
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import { gfn_useCustomerServiceDialog } from '@/features/customerservice/composables/useCustomerServiceDialog'
import { APP_ROLES } from '@/config/sideMenu'
import { useAuthStore } from '@/stores/auth'
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppSearchCondition from '@/components/common/AppSearchCondition.vue'
import { gfn_useListState } from '@/composables/useListState'
import { fn_listQnas } from '@/features/qna/api/qnaApi'
import { QNA_STATUSES, QNA_TYPES } from '@/features/qna/constants/qnaOptions'
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDate } from '@/utils/date'
import '../styles/qna.scss'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const auth = useAuthStore()
const canCreate = computed(() => auth.isAuthenticated && [APP_ROLES.USER, APP_ROLES.TRAIN_MANAGER].includes(auth.role))
const router = useRouter()
const { dialog, finishDialog, showAccessDenied, showRequestError } = gfn_useCustomerServiceDialog()

const route = useRoute()

const searchFields = [
  { key: 'qnaType', label: '질문 유형', type: 'select', options: QNA_TYPES },
  { key: 'qnaStatus', label: '처리 상태', type: 'select', options: QNA_STATUSES },
  {
    key: 'keyword',
    label: '검색어',
    type: 'search',
    placeholder: '제목 또는 내용 전체가 일치하는 검색어',
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
} = gfn_useListState(searchFields, { defaultSort: 'id,desc' })

const draft = ref({ ...filters.value })
const result = ref({ content: [], page: 0, totalElements: 0, totalPages: 0 })
const loading = ref(false)
const error = ref('')
let latestRequestId = 0

const totalPages = computed(() =>
  Math.max(1, result.value.totalPages || Math.ceil(result.value.totalElements / pageSize.value))
)

const headers = [
  { title: '번호', key: 'id', width: '8%' },
  { title: '제목', key: 'title', width: '30%' },
  { title: '질문 유형', key: 'type', width: '16%' },
  { title: '처리 상태', key: 'status', width: '12%' },
  { title: '역 이름', key: 'station' },
  { title: '등록일', key: 'createdAt' },
]

const fn_load = async () => {
  const requestId = ++latestRequestId

  loading.value = true
  error.value = ''
  try {
    const response = await fn_listQnas({
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
      showRequestError(requestError)
      result.value = { content: [], page: 0, totalElements: 0, totalPages: 0 }
    }
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

// 현황 카드와 브라우저 뒤로 가기의 상태 조건을 목록에 반영한다.
watch(() => route.query.qnaStatus, value => {
  const status = QNA_STATUSES.some(item => item.value === value) ? value : ''

  applyFilters({ ...filters.value, qnaStatus: status })
  draft.value = { ...filters.value }
  fn_load()
}, { immediate: true })

const fn_search = () => {
  applyFilters(draft.value)
  fn_load()
}

const fn_reset = () => {
  reset()
  draft.value = { ...filters.value }
  fn_load()
}

const fn_updateGridOptions = options => {
  if (setGridOptions(options)) fn_load()
}


// 화면 안내와 별도로 서버에서도 동일한 접근 권한을 검사한다.
const fn_canRead = item => auth.isAuthenticated && (auth.role === APP_ROLES.ADMIN
  || (auth.memberId != null && item.createdBy != null && String(auth.memberId) === String(item.createdBy)))

const fn_checkAccess = (event, item) => {
  if (fn_canRead(item)) return true
  event?.preventDefault()
  showAccessDenied()
  return false
}

const fn_detailTo = id => {
  return `/qnas/${id}`
}

const fn_openQna = (_event, { item }) => {
  if (fn_checkAccess(_event, item)) return router.push(fn_detailTo(item.id))
}

const fn_rowProps = ({ item }) => ({
  class: 'train-grid__row',
  tabindex: 0,
  'aria-label': `${item.id} ${item.title}, Enter 키로 상세 보기`,

  onKeydown: event => {
    if (event.target !== event.currentTarget) {
      return
    }
    if (event.key !== 'Enter' && event.key !== ' ') {
      return
    }

    event.preventDefault()
    if (fn_checkAccess(event, item)) router.push(fn_detailTo(item.id))
  },
})
</script>

<template>
  <div class="train-page qna-page">
    <header class="train-page__intro">
      <h2>질문 및 답변</h2>
      <p>질문을 검색하고 접수·답변 내역을 관리합니다.</p>
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
            <RouterLink v-if="canCreate" class="train-button train-button--primary" to="/qnas/new"> 질문 등록 </RouterLink>
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
              loading-text="질문을 불러오는 중입니다."
              @update:options="fn_updateGridOptions"
              @click:row="fn_openQna"
            >
              <template #item.title="{ item }">
                <RouterLink class="train-grid__formation" :to="fn_detailTo(item.id)" @click.stop="fn_checkAccess($event, item)">
                  {{ item.title }}
                </RouterLink>
              </template>
              <template #item.createdAt="{ item }">
                {{ gfn_formatDate(item.createdAt, 'YYYY-MM-DD HH:mm:ss') }}
              </template>
              <template #item.type="{ item }">
                {{ gfn_getLabel(QNA_TYPES, item.type) }}
              </template>
              <template #item.status="{ item }">
                {{ gfn_getLabel(QNA_STATUSES, item.status) }}
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
            <p v-if="loading" class="train-mobile-list__state" role="status">질문을 불러오는 중입니다.</p>
            <p v-else-if="error" class="train-mobile-list__state" role="alert">
              {{ error }} <button type="button" @click="fn_load">다시 시도</button>
            </p>
            <p v-else-if="!result.content.length" class="train-mobile-list__state">검색 결과가 없습니다.</p>
            <ul v-else class="train-mobile-list__items">
              <li v-for="item in result.content" :key="item.id">
                <RouterLink class="train-mobile-card" :to="fn_detailTo(item.id)" @click="fn_checkAccess($event, item)">
                  <strong>{{ item.title }}</strong>
                  <dl>
                    <div>
                      <dt>번호</dt>
                      <dd>{{ item.id }}</dd>
                    </div>
                    <div>
                      <dt>질문 유형</dt>
                      <dd>{{ gfn_getLabel(QNA_TYPES, item.type) }}</dd>
                    </div>
                    <div>
                      <dt>처리 상태</dt>
                      <dd>{{ gfn_getLabel(QNA_STATUSES, item.status) }}</dd>
                    </div>
                    <div>
                      <dt>역 이름</dt>
                      <dd>{{ item.station }}</dd>
                    </div>
                  </dl>
                </RouterLink>
              </li>
            </ul>
            <nav
              v-if="!loading && !error && result.totalElements > pageSize"
              class="train-mobile-list__pagination"
              aria-label="질문 목록 페이지"
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

