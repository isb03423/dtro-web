<script setup>
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppGridSelectDialog from '@/components/common/AppGridSelectDialog.vue'
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import AppSearchCondition from '@/components/common/AppSearchCondition.vue'
import { gfn_useGridState } from '@/composables/useGridState'
import { gfn_useMessageDialog } from '@/composables/useMessageDialog'
import { fn_listTrains } from '@/features/train/api/trainApi'
import { TRAIN_STATUSES } from '@/features/train/constants/trainOptions'
import {
  fn_deleteOperations,
  fn_listLines,
  fn_listOperations,
  fn_listStations,
  fn_saveOperations,
} from '@/features/trainoperation/api/trainoperationApi'
import { OPERATION_DIRECTIONS } from '@/features/trainoperation/constants/trainoperationOptions'
import { gfn_formatDate } from '@/utils/date'
import { computed, onMounted, ref } from 'vue'

const directions = OPERATION_DIRECTIONS
const stationNames = ref([])

const columns = computed(() => [
  { title: '운행번호', key: 'operationNumber', maxText: 'OPS-99999', autoWidth: true },
  { title: '열차번호', key: 'trainNumber', maxText: 'TRN-9999', autoWidth: true, contentPadding: 48 },
  { title: '노선', key: 'lineCode', maxText: lines.value.map(line => `${line}호선`), contentPadding: 48 },
  { title: '방향', key: 'direction', maxText: '하행', contentPadding: 40 },
  { title: '출발역', key: 'departureStationName', maxText: stationNames.value, autoWidth: true, contentPadding: 50 },
  { title: '도착역', key: 'arrivalStationName', maxText: stationNames.value, autoWidth: true, contentPadding: 50 },
  { title: '출발시각', key: 'firstTrainTime', width: 175 },
  { title: '도착시각', key: 'lastTrainTime', width: 175 },
  { title: '등록일시', key: 'createdAt', maxText: '9999-12-31 23:59:59' },
  { title: '등록자', key: 'createdByName', autoWidth: true },
  { title: '수정일시', key: 'updatedAt', maxText: '9999-12-31 23:59:59' },
  { title: '수정자', key: 'updatedByName', autoWidth: true },
])

const popupColumns = {
  train: [
    { title: '열차번호', key: 'trainNumber' },
    { title: '편성명', key: 'formationName' },
    { title: '운영 상태', key: 'statusLabel' },
  ],
  line: [
    { title: '노선', key: 'lineLabel' },
    { title: '기점', key: 'firstStation' },
    { title: '종점', key: 'lastStation' },
  ],
  station: [
    { title: '역 코드', key: 'stationCode' },
    { title: '역 이름', key: 'stationName' },
  ],
}

// 검색 조건의 기본값을 만든다.
const fn_emptyFilters = () => ({
  trainId: null,
  trainNumber: '',
  lineCode: '',
  direction: '',
})

const { dialog, finishDialog, showMessage, askConfirm } = gfn_useMessageDialog()
const draftFilters = ref(fn_emptyFilters())
const filters = ref(fn_emptyFilters())
const rows = ref([])
const original = ref(new Map())
const selected = ref([])

const result = ref({
  totalElements: 0,
  totalPages: 0,
})

const {
  page,
  size: pageSize,
  sort,
  gridSort,
  setGridOptions,
} = gfn_useGridState({
  defaultSort: 'id,desc',
})

const lines = ref([])
const loading = ref(false)
const saving = ref(false)

const searchFields = computed(() => [
  { key: 'lineCode', label: '노선', type: 'select', options: lines.value.map(code => ({ value: code, label: `${code}호선` })) },
  { key: 'direction', label: '방향', type: 'select', options: directions },
  { key: 'trainNumber', label: '열차번호', type: 'picker', placeholder: '열차번호 선택', wide: true },
])

const popup = ref({
  open: false,
  kind: '',
  target: null,
  field: '',
  rows: [],
  loading: false,
})

let nextDraftId = 0
let requestId = 0

const hasChanges = computed(() =>
  rows.value.some(row => row._new || JSON.stringify(fn_payload(row)) !== original.value.get(row.id))
)

const popupTitle = computed(
  () =>
    ({
      train: '열차번호 선택',
      line: '노선 선택',
      station: '역 선택',
    })[popup.value.kind] || ''
)

const popupKey = computed(
  () =>
    ({
      train: 'id',
      line: 'lineCode',
      station: 'stationCode',
    })[popup.value.kind] || 'id'
)

const popupContext = computed(() => {
  if (popup.value.kind !== 'station') {
    return ''
  }
  const row = popup.value.target

  return `${row.lineCode}호선 · ${row.direction === 'UP' ? '상행' : '하행'}${popup.value.field === 'arrival' ? ` · 출발역 ${row.departureStationName}` : ''}`
})

// 그리드 행을 저장 요청 데이터로 변환한다.
const fn_payload = row => ({
  id: row._new ? null : row.id,
  trainId: row.trainId,
  lineCode: row.lineCode,
  departureStationCode: row.departureStationCode,
  arrivalStationCode: row.arrivalStationCode,
  firstTrainTime: row.firstTrainTime?.slice(0, 5) || '',
  lastTrainTime: row.lastTrainTime?.slice(0, 5) || '',
})

// 현재 검색 조건으로 조회하고 최신 요청 결과만 반영한다.
const fn_load = async () => {
  const current = ++requestId

  loading.value = true
  try {
    const data = await fn_listOperations({
      trainId: filters.value.trainId,
      lineCode: filters.value.lineCode,
      direction: filters.value.direction,
      page: page.value,
      size: pageSize.value,
      sort: sort.value,
    })

    if (current !== requestId) {
      return
    }
    rows.value = data.content.map(row => ({
      ...row,
      firstTrainTime: row.firstTrainTime?.slice(0, 5) || '',
      lastTrainTime: row.lastTrainTime?.slice(0, 5) || '',
    }))
    result.value = data
    original.value = new Map(rows.value.map(row => [row.id, JSON.stringify(fn_payload(row))]))
    selected.value = []
  } catch (cause) {
    if (current === requestId) {
      showMessage('error', '오류가 발생했습니다', cause.message)
    }
  } finally {
    if (current === requestId) {
      loading.value = false
    }
  }
}

// 저장하지 않은 변경사항을 버릴지 확인한다.
const fn_mayDiscard = async () =>
  !hasChanges.value || (await askConfirm('계속 진행하시겠습니까?', '저장하지 않은 변경사항이 사라집니다.'))

// 입력한 검색 조건을 반영하고 목록을 다시 조회한다.
const fn_search = async () => {
  if (!(await fn_mayDiscard())) {
    return
  }
  filters.value = {
    ...draftFilters.value,
  }
  page.value = 0
  fn_load()
}

// 검색 조건을 초기화하고 전체 목록을 조회한다.
const fn_reset = async () => {
  if (!(await fn_mayDiscard())) {
    return
  }
  filters.value = fn_emptyFilters()
  draftFilters.value = fn_emptyFilters()
  page.value = 0
  fn_load()
}

// 그리드의 페이지·정렬 변경을 저장하고 목록을 갱신한다.
const fn_updateGridOptions = async options => {
  const nextSort = options.sortBy[0] ? `${options.sortBy[0].key},${options.sortBy[0].order}` : 'id,desc'
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

// 새 운행정보를 입력할 행을 추가한다.
const fn_add = () =>
  rows.value.unshift({
    id: `new-${++nextDraftId}`,
    _new: true,
    trainId: null,
    trainNumber: '',
    lineCode: '',
    direction: 'DOWN',
    departureStationCode: '',
    departureStationName: '',
    arrivalStationCode: '',
    arrivalStationName: '',
    firstTrainTime: '',
    lastTrainTime: '',
  })

// 선택한 행의 출발역과 도착역을 초기화한다.
const fn_clearStations = row => {
  row.departureStationCode = ''
  row.departureStationName = ''
  row.arrivalStationCode = ''
  row.arrivalStationName = ''
}

// 운행 방향을 바꾸고 역 선택을 초기화한다.
const fn_changeDirection = (row, value) => {
  if (row.direction === value) {
    return
  }
  row.direction = value
  fn_clearStations(row)
}

// 선택 종류에 맞는 열차·노선·역 목록을 불러온다.
const fn_openPopup = async (kind, target = null, field = '') => {
  if (kind === 'station' && !target.lineCode) {
    showMessage('info', '안내 사항', '먼저 노선을 선택해주세요.')

    return
  }
  if (kind === 'station' && field === 'arrival' && !target.departureStationCode) {
    showMessage('info', '안내 사항', '먼저 출발역을 선택해주세요.')

    return
  }
  popup.value = {
    open: true,
    kind,
    target,
    field,
    rows: [],
    loading: true,
  }
  try {
    let options
    if (kind === 'train') {
      options = []
      let trainPage = 0
      let response
      do {
        response = await fn_listTrains({
          page: trainPage++,
          size: 100,
          sort: 'id,asc',
        })
        options.push(
          ...response.content.map(train => ({
            ...train,
            statusLabel: TRAIN_STATUSES.find(option => option.value === train.status)?.label ?? train.status,
          }))
        )
      } while (trainPage < response.totalPages)
    } else if (kind === 'line') {
      options = await Promise.all(
        lines.value.map(async code => {
          const stations = await fn_listStations(code, 'DOWN')

          return {
            lineCode: code,
            lineLabel: `${code}호선`,
            firstStation: stations[0]?.stationName || '',
            lastStation: stations.at(-1)?.stationName || '',
          }
        })
      )
    } else {
      options = await fn_listStations(target.lineCode, target.direction)
    }
    popup.value = {
      ...popup.value,
      rows: options,
      loading: false,
    }
  } catch (cause) {
    showMessage('error', '오류가 발생했습니다', cause.message)
    popup.value = {
      ...popup.value,
      open: false,
      loading: false,
    }
  }
}

// 운행 방향과 출발역에 맞지 않는 도착역을 비활성화한다.
const fn_stationDisabled = station => {
  if (popup.value.kind !== 'station' || popup.value.field !== 'arrival') {
    return false
  }
  const departure = popup.value.rows.find(item => item.stationCode === popup.value.target.departureStationCode)
  if (!departure) {
    return false
  }

  return popup.value.target.direction === 'DOWN'
    ? station.stationOrder <= departure.stationOrder
    : station.stationOrder >= departure.stationOrder
}

// 선택한 항목을 검색 조건 또는 그리드 행에 반영한다.
const fn_selectPopup = item => {
  const row = popup.value.target
  if (!row) {
    draftFilters.value.trainId = item.id
    draftFilters.value.trainNumber = item.trainNumber
  } else if (popup.value.kind === 'train') {
    row.trainId = item.id
    row.trainNumber = item.trainNumber
  } else if (popup.value.kind === 'line') {
    if (row.lineCode !== item.lineCode) {
      row.lineCode = item.lineCode
      fn_clearStations(row)
    }
  } else if (popup.value.field === 'departure') {
    row.departureStationCode = item.stationCode
    row.departureStationName = item.stationName
    row.arrivalStationCode = ''
    row.arrivalStationName = ''
  } else {
    row.arrivalStationCode = item.stationCode
    row.arrivalStationName = item.stationName
  }
}

// 변경된 행의 입력값을 확인하고 일괄 저장한다.
const fn_save = async () => {
  const changed = rows.value.filter(row => row._new || JSON.stringify(fn_payload(row)) !== original.value.get(row.id))
  if (!changed.length) {
    return
  }
  if (
    changed.some(
      row =>
        !row.trainId ||
        !row.lineCode ||
        !row.departureStationCode ||
        !row.arrivalStationCode ||
        !row.firstTrainTime ||
        !row.lastTrainTime
    )
  ) {
    showMessage(
      'warning',
      '입력값을 확인해주세요',
      '변경된 행의 열차, 노선, 출발역, 도착역, 출발·도착시각을 모두 입력해주세요.'
    )

    return
  }
  saving.value = true
  try {
    await fn_saveOperations(changed.map(fn_payload))
    await fn_load()
    showMessage('success', '처리가 완료되었습니다', `${changed.length}건 저장했습니다.`)
  } catch (cause) {
    showMessage('error', '오류가 발생했습니다', cause.message)
  } finally {
    saving.value = false
  }
}

// 삭제 가능 여부와 선택 항목을 확인한 뒤 삭제한다.
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
      await fn_deleteOperations(ids)
    }

    rows.value = rows.value.filter(row => !selected.value.includes(row.id))
    selected.value = []
    if (ids.length) {
      await fn_load()
    }

    showMessage('success', '처리가 완료되었습니다', `${count}건 삭제했습니다.`)
  } catch (cause) {
    showMessage('error', '오류가 발생했습니다', cause.message)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  try {
    lines.value = await fn_listLines()

    const stations = await Promise.all(lines.value.map(line => fn_listStations(line, 'DOWN')))

    stationNames.value = stations.flat().map(station => station.stationName)
  } catch (cause) {
    showMessage('error', '오류가 발생했습니다', cause.message)
  }
  await fn_load()
})
</script>

<template>
  <div class="train-page operation-page">
    <header class="train-page__intro">
      <h2>열차 운행 정보</h2>
      <p>운행 정보를 조회하고 목록에서 등록·수정·삭제합니다.</p>
    </header>
    <VCard class="train-search-card" elevation="0">
      <AppSearchCondition
        v-model="draftFilters"
        :fields="searchFields"
        @search="fn_search"
        @reset="fn_reset"
        @pick="fn_openPopup('train')"
      />
    </VCard>
    <VCard class="train-list-card" elevation="0">
      <div class="train-list__heading">
        <div>
          <h2>목록</h2>
          <span>총 {{ result.totalElements }}건</span>
        </div>
        <div class="operation-actions">
          <button class="train-button" type="button" :disabled="!selected.length || saving" @click="fn_remove">
            삭제
          </button>
          <button class="train-button" type="button" :disabled="saving" @click="fn_add">추가</button>
          <button
            class="train-button train-button--primary"
            type="button"
            :disabled="!hasChanges || saving"
            @click="fn_save"
          >
            저장
          </button>
        </div>
      </div>
      <div class="train-table-wrap operation-table-wrap">
        <AppDataGrid
          v-model="selected"
          :columns="columns"
          :rows="rows"
          :total-items="result.totalElements + rows.filter(row => row._new).length"
          :page="page + 1"
          :page-size="pageSize"
          :sort-by="gridSort"
          :loading="loading"
          show-select
          column-width-key="dtro:train-operation-column-widths:v5"
          item-value="id"
          @update:options="fn_updateGridOptions"
        >
          <template #item.operationNumber="{ item }">{{ item.operationNumber || '—' }}</template>
          <template #item.trainNumber="{ item }">
            <button class="operation-picker" type="button" @click="fn_openPopup('train', item)">
              <span class="operation-picker__text">{{ item.trainNumber || '선택' }}</span>
              <VIcon class="operation-picker__icon" icon="bx-search" aria-hidden="true" />
            </button>
          </template>
          <template #item.lineCode="{ item }">
            <button class="operation-picker" type="button" @click="fn_openPopup('line', item)">
              <span class="operation-picker__text">{{ item.lineCode ? `${item.lineCode}호선` : '선택' }}</span>
              <VIcon class="operation-picker__icon" icon="bx-search" aria-hidden="true" />
            </button>
          </template>
          <template #item.direction="{ item }">
            <select
              class="operation-cell-select"
              :value="item.direction"
              @change="fn_changeDirection(item, $event.target.value)"
            >
              <option v-for="option in directions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </template>
          <template #item.departureStationName="{ item }">
            <button class="operation-picker" type="button" @click="fn_openPopup('station', item, 'departure')">
              <span class="operation-picker__text">{{ item.departureStationName || '선택' }}</span>
              <VIcon class="operation-picker__icon" icon="bx-search" aria-hidden="true" />
            </button>
          </template>
          <template #item.arrivalStationName="{ item }">
            <button class="operation-picker" type="button" @click="fn_openPopup('station', item, 'arrival')">
              <span class="operation-picker__text">{{ item.arrivalStationName || '선택' }}</span>
              <VIcon class="operation-picker__icon" icon="bx-search" aria-hidden="true" />
            </button>
          </template>
          <template #item.firstTrainTime="{ item }">
            <input v-model="item.firstTrainTime" class="operation-time" type="time" aria-label="출발시각" />
          </template>
          <template #item.lastTrainTime="{ item }">
            <input v-model="item.lastTrainTime" class="operation-time" type="time" aria-label="도착시각" />
          </template>
          <template #item.createdAt="{ item }">
            {{ item.createdAt ? gfn_formatDate(item.createdAt, 'YYYY-MM-DD HH:mm:ss') : '—' }}
          </template>
          <template #item.createdByName="{ item }">{{ item.createdByName || '—' }}</template>
          <template #item.updatedAt="{ item }">
            {{ item.updatedAt ? gfn_formatDate(item.updatedAt, 'YYYY-MM-DD HH:mm:ss') : '—' }}
          </template>
          <template #item.updatedByName="{ item }">{{ item.updatedByName || '—' }}</template>
        </AppDataGrid>
      </div>
    </VCard>
    <AppGridSelectDialog
      v-model="popup.open"
      :title="popupTitle"
      :columns="popupColumns[popup.kind] || []"
      :rows="popup.rows"
      :item-key="popupKey"
      :loading="popup.loading"
      :context="popupContext"
      :disabled-row="fn_stationDisabled"
      @select="fn_selectPopup"
    />
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
