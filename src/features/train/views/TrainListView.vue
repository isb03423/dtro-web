<script setup>
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import AppSearchCondition from '@/components/common/AppSearchCondition.vue'
import { gfn_useListState } from '@/composables/useListState'
import { gfn_useMessageDialog } from '@/composables/useMessageDialog'
import { fn_deleteTrains, fn_listTrains, fn_saveTrains } from '@/features/train/api/trainApi'
import { TRAIN_STATUSES } from '@/features/train/constants/trainOptions'
import { gfn_formatDate } from '@/utils/date'
import { computed, onMounted, ref } from 'vue'

const searchFields = [
  { key: 'status', label: '운영 상태', type: 'select', options: TRAIN_STATUSES },
  {
    key: 'keyword',
    label: '검색어',
    type: 'search',
    placeholder: '열차 번호 또는 편성명으로 검색',
    trim: true,
  },
]

const {
  filters,
  page,
  size: pageSize,
  sort,
  gridSort,
  applyFilters,
  setGridOptions,
  reset,
} = gfn_useListState(searchFields)

const { dialog, finishDialog, showMessage, askConfirm } = gfn_useMessageDialog()
const draft = ref({ ...filters.value })
const rows = ref([])
const original = ref(new Map())
const selected = ref([])
const result = ref({ totalElements: 0, totalPages: 0 })
const loading = ref(false)
const saving = ref(false)
let nextDraftId = 0
let latestRequestId = 0

const headers = [
  { title: '열차 번호', key: 'trainNumber', maxText: 'TRN-9999', autoWidth: true },
  { title: '편성명', key: 'formationName', width: 210 },
  { title: '차량 유형', key: 'carType', width: 160 },
  { title: '차량 수', key: 'carCount', width: 130 },
  { title: '운영 상태', key: 'status', width: 160 },
  { title: '도입일', key: 'introducedOn', width: 185 },
  { title: '최근 점검일', key: 'lastInspectedOn', width: 185 },
  { title: '등록일시', key: 'createdAt', maxText: '9999-12-31 23:59:59' },
  { title: '등록자', key: 'createdByName', autoWidth: true, sortable: false },
  { title: '수정일시', key: 'updatedAt', maxText: '9999-12-31 23:59:59' },
  { title: '수정자', key: 'updatedByName', autoWidth: true, sortable: false },
]

// 그리드 행을 저장 요청 데이터로 변환한다.
const fn_payload = row => ({
  id: row._new ? null : row.id,
  formationName: String(row.formationName ?? '').trim(),
  carType: String(row.carType ?? '').trim(),
  carCount: row.carCount === '' ? null : Number(row.carCount),
  status: row.status,
  introducedOn: row.introducedOn,
  lastInspectedOn: row.lastInspectedOn,
})

const hasChanges = computed(() =>
  rows.value.some(row => row._new || JSON.stringify(fn_payload(row)) !== original.value.get(row.id))
)

// 현재 검색 조건으로 목록을 불러오고 최신 요청 결과만 반영한다.
const fn_load = async () => {
  const requestId = ++latestRequestId

  loading.value = true
  try {
    const data = await fn_listTrains({
      ...filters.value,
      page: page.value,
      size: pageSize.value,
      sort: sort.value,
    })

    if (requestId !== latestRequestId) {
      return false
    }
    rows.value = data.content
    result.value = data
    original.value = new Map(rows.value.map(row => [row.id, JSON.stringify(fn_payload(row))]))
    selected.value = []

    return true
  } catch (cause) {
    if (requestId === latestRequestId) {
      showMessage('error', '오류가 발생했습니다', cause.message)
    }

    return false
  } finally {
    if (requestId === latestRequestId) {
      loading.value = false
    }
  }
}

// 저장하지 않은 변경사항을 버릴지 확인한다.
const fn_mayDiscard = async () =>
  !hasChanges.value || (await askConfirm('계속 진행하시겠습니까?', '저장하지 않은 변경사항이 사라집니다.'))

// 입력한 조건으로 다시 조회한다.
const fn_search = async () => {
  if (!(await fn_mayDiscard())) {
    return
  }
  applyFilters(draft.value)
  fn_load()
}

// 검색 조건과 정렬을 초기화한다.
const fn_reset = async () => {
  if (!(await fn_mayDiscard())) {
    return
  }
  reset()
  draft.value = { ...filters.value }
  fn_load()
}

// 페이지·정렬 변경 전에 저장하지 않은 행이 있는지 확인한다.
const fn_updateGridOptions = async options => {
  const nextSort = options.sortBy[0] ? `${options.sortBy[0].key},${options.sortBy[0].order}` : 'id,asc'
  const nextPage = options.itemsPerPage === pageSize.value ? options.page - 1 : 0
  if (nextPage === page.value && options.itemsPerPage === pageSize.value && nextSort === sort.value) {
    return
  }
  if (!(await fn_mayDiscard())) {
    return
  }
  if (setGridOptions(options)) {
    fn_load()
  }
}

// 새 열차를 입력할 행을 목록 맨 위에 추가한다.
const fn_add = () =>
  rows.value.unshift({
    id: `new-${++nextDraftId}`,
    _new: true,
    trainNumber: '',
    formationName: '',
    carType: '',
    carCount: '',
    status: '',
    introducedOn: '',
    lastInspectedOn: '',
  })

// 변경된 행의 필수값과 입력 범위를 확인한다.
const fn_invalidRow = row => {
  const payload = fn_payload(row)
  if (
    !payload.formationName ||
    !payload.carType ||
    !payload.status ||
    !payload.introducedOn ||
    !payload.lastInspectedOn
  ) {
    return '편성명, 차량 유형, 운영 상태, 도입일, 최근 점검일을 모두 입력해주세요.'
  }
  if (payload.formationName.length > 100 || payload.carType.length > 50) {
    return '편성명은 100자, 차량 유형은 50자 이내로 입력해주세요.'
  }
  if (!Number.isInteger(payload.carCount) || payload.carCount < 1) {
    return '차량 수는 1 이상의 정수로 입력해주세요.'
  }

  return ''
}

// 추가·수정된 행을 일괄 저장한다.
const fn_save = async () => {
  const changed = rows.value.filter(row => row._new || JSON.stringify(fn_payload(row)) !== original.value.get(row.id))
  if (!changed.length) {
    return
  }
  const invalid = changed.find(row => fn_invalidRow(row))
  if (invalid) {
    showMessage('warning', '입력값을 확인해주세요', `${invalid.trainNumber || '새 열차'}: ${fn_invalidRow(invalid)}`)

    return
  }
  saving.value = true
  try {
    const saved = await fn_saveTrains(changed.map(fn_payload))

    changed.forEach((row, index) => {
      original.value.delete(row.id)
      Object.assign(row, saved[index])
      delete row._new
      original.value.set(row.id, JSON.stringify(fn_payload(row)))
    })
    selected.value = []

    if (await fn_load()) {
      showMessage('success', '처리가 완료되었습니다', `${changed.length}건 저장했습니다.`)
    } else {
      showMessage(
        'warning',
        '저장은 완료되었습니다',
        '목록을 다시 불러오지 못했습니다. 검색 버튼을 눌러 다시 조회해주세요.'
      )
    }
  } catch (cause) {
    showMessage('error', '오류가 발생했습니다', cause.message)
  } finally {
    saving.value = false
  }
}

// 선택한 행을 확인한 뒤 일괄 삭제한다.
const fn_remove = async () => {
  if (
    !selected.value.length ||
    !(await askConfirm('계속 진행하시겠습니까?', `선택한 ${selected.value.length}건을 삭제하시겠습니까?`, '삭제'))
  ) {
    return
  }
  const count = selected.value.length
  const ids = selected.value.filter(id => typeof id === 'number')

  const unsavedSurvivors = rows.value.some(
    row =>
      !selected.value.includes(row.id) && (row._new || JSON.stringify(fn_payload(row)) !== original.value.get(row.id))
  )

  if (
    ids.length &&
    unsavedSurvivors &&
    !(await askConfirm(
      '변경사항을 버리시겠습니까?',
      '삭제 후 목록을 다시 조회하면 다른 행의 저장하지 않은 변경사항이 사라집니다.'
    ))
  ) {
    return
  }
  saving.value = true
  try {
    if (ids.length) {
      await fn_deleteTrains(ids)
    }
    rows.value = rows.value.filter(row => !selected.value.includes(row.id))
    selected.value = []
    if (ids.length) {
      const reloaded = await fn_load()
      if (!reloaded) {
        showMessage(
          'warning',
          '삭제는 완료되었습니다',
          '목록을 다시 불러오지 못했습니다. 검색 버튼을 눌러 다시 조회해주세요.'
        )

        return
      }
      if (!rows.value.length && page.value > 0) {
        page.value = Math.max(0, result.value.totalPages - 1)
        if (!(await fn_load())) {
          showMessage('warning', '삭제는 완료되었습니다', '목록을 다시 불러오지 못했습니다. 검색 버튼을 눌러 다시 조회해주세요.')

          return
        }
      }
    }
    showMessage('success', '처리가 완료되었습니다', `${count}건 삭제했습니다.`)
  } catch (cause) {
    showMessage('error', '오류가 발생했습니다', cause.message)
  } finally {
    saving.value = false
  }
}

onMounted(fn_load)
</script>

<template>
  <div class="train-page operation-page train-edit-page">
    <header class="train-page__intro">
      <h2>열차 정보</h2>
      <p>열차 정보를 조회하고 목록에서 등록·수정·삭제합니다.</p>
    </header>
    <VCard class="train-search-card" elevation="0">
      <AppSearchCondition v-model="draft" :fields="searchFields" @search="fn_search" @reset="fn_reset" />
    </VCard>
    <VCard class="train-list-card" elevation="0">
      <div class="train-list__heading">
        <div>
          <h2>목록</h2>
          <span>총 {{ result.totalElements }}건</span>
        </div>
        <div class="operation-actions">
          <button
            class="train-button"
            type="button"
            :disabled="!selected.length || saving || loading"
            @click="fn_remove"
          >
            삭제
          </button>
          <button class="train-button" type="button" :disabled="saving || loading" @click="fn_add">추가</button>
          <button
            class="train-button train-button--primary"
            type="button"
            :disabled="!hasChanges || saving || loading"
            @click="fn_save"
          >
            저장
          </button>
        </div>
      </div>
      <div class="train-table-wrap operation-table-wrap">
        <AppDataGrid
          v-model="selected"
          :columns="headers"
          :rows="rows"
          :total-items="result.totalElements + rows.filter(row => row._new).length"
          :page="page + 1"
          :page-size="pageSize"
          :sort-by="gridSort"
          :loading="loading"
          show-select
          column-width-key="dtro:train-column-widths:v1"
          item-value="id"
          loading-text="열차 정보를 불러오는 중입니다."
          @update:options="fn_updateGridOptions"
        >
          <template #item.trainNumber="{ item }">{{ item.trainNumber || '저장 시 자동 발급' }}</template>
          <template #item.formationName="{ item }">
            <input
              v-model="item.formationName"
              class="train-cell-input"
              type="text"
              maxlength="100"
              aria-label="편성명"
            />
          </template>
          <template #item.carType="{ item }">
            <input v-model="item.carType" class="train-cell-input" type="text" maxlength="50" aria-label="차량 유형" />
          </template>
          <template #item.carCount="{ item }">
            <input
              v-model.number="item.carCount"
              class="train-cell-input"
              type="number"
              min="1"
              step="1"
              aria-label="차량 수"
            />
          </template>
          <template #item.status="{ item }">
            <select v-model="item.status" class="train-cell-select" aria-label="운영 상태">
              <option value="">선택</option>
              <option v-for="option in TRAIN_STATUSES" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </template>
          <template #item.introducedOn="{ item }">
            <input v-model="item.introducedOn" class="train-cell-input" type="date" aria-label="도입일" />
          </template>
          <template #item.lastInspectedOn="{ item }">
            <input v-model="item.lastInspectedOn" class="train-cell-input" type="date" aria-label="최근 점검일" />
          </template>
          <template #item.createdAt="{ item }">{{
            item.createdAt ? gfn_formatDate(item.createdAt, 'YYYY-MM-DD HH:mm:ss') : '—'
          }}</template>
          <template #item.createdByName="{ item }">{{ item.createdByName || '—' }}</template>
          <template #item.updatedAt="{ item }">{{
            item.updatedAt ? gfn_formatDate(item.updatedAt, 'YYYY-MM-DD HH:mm:ss') : '—'
          }}</template>
          <template #item.updatedByName="{ item }">{{ item.updatedByName || '—' }}</template>
        </AppDataGrid>
      </div>
    </VCard>
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
