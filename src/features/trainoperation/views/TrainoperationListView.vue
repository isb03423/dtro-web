<script setup>
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppGridSelectDialog from '@/components/common/AppGridSelectDialog.vue'
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import { gfn_useGridState } from '@/composables/useGridState'
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const directions = OPERATION_DIRECTIONS

const columns = [
  { title: '운행번호', key: 'operationNumber', width: 125 },
  { title: '열차번호', key: 'trainNumber', width: 150 },
  { title: '노선', key: 'lineCode', width: 135 },
  { title: '방향', key: 'direction', width: 105 },
  { title: '출발역', key: 'departureStationName', width: 195 },
  { title: '도착역', key: 'arrivalStationName', width: 195 },
  { title: '출발시각', key: 'firstTrainTime', width: 175 },
  { title: '도착시각', key: 'lastTrainTime', width: 175 },
  { title: '등록일시', key: 'createdAt', width: 185 },
  { title: '등록자', key: 'createdByName', width: 125 },
  { title: '수정일시', key: 'updatedAt', width: 185 },
  { title: '수정자', key: 'updatedByName', width: 125 },
]

const columnWidthKey = 'dtro:train-operation-column-widths:v4'
const columnWidths = ref({})
try {
  const stored = JSON.parse(localStorage.getItem(columnWidthKey) || '{}')
  if (stored && typeof stored === 'object' && !Array.isArray(stored)) columnWidths.value = stored
} catch {
  // 저장된 설정이 손상된 경우 기본 너비를 사용한다.
}

const gridColumns = computed(() => columns.map(column => ({
  ...column,
  width: Number.isFinite(columnWidths.value[column.key])
    ? Math.max(80, columnWidths.value[column.key])
    : column.width,
})))

const gridWidth = computed(() => `${gridColumns.value.reduce((sum, column) => sum + column.width, 48)}px`)
const headerMenu = ref(null)

let resizing = null

const stopResize = () => {
  if (resizing) localStorage.setItem(columnWidthKey, JSON.stringify(columnWidths.value))
  resizing = null
  window.removeEventListener('pointermove', moveResize)
  window.removeEventListener('pointerup', stopResize)
}

const moveResize = event => {
  if (!resizing) return
  columnWidths.value = {
    ...columnWidths.value,
    [resizing.key]: Math.max(80, resizing.width + event.clientX - resizing.startX),
  }
}

const startResize = (event, column) => {
  event.preventDefault()
  resizing = { key: column.key, width: column.width, startX: event.clientX }
  window.addEventListener('pointermove', moveResize)
  window.addEventListener('pointerup', stopResize)
}

const resizeByKeyboard = (event, column) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  columnWidths.value = {
    ...columnWidths.value,
    [column.key]: Math.max(80, column.width + (event.key === 'ArrowRight' ? 10 : -10)),
  }
  localStorage.setItem(columnWidthKey, JSON.stringify(columnWidths.value))
}

const resetColumnWidths = () => {
  stopResize()
  columnWidths.value = {}
  localStorage.removeItem(columnWidthKey)
  headerMenu.value = null
}

const openHeaderMenu = event => {
  if (!event.target.closest('.v-data-table__th')) return
  event.preventDefault()
  headerMenu.value = {
    left: Math.min(event.clientX, window.innerWidth - 150),
    top: Math.min(event.clientY, window.innerHeight - 48),
  }
}

const closeHeaderMenu = () => { headerMenu.value = null }

const closeHeaderMenuOnEscape = event => {
  if (event.key === 'Escape') closeHeaderMenu()
}

onMounted(() => {
  window.addEventListener('pointerdown', closeHeaderMenu)
  window.addEventListener('keydown', closeHeaderMenuOnEscape)
})
onBeforeUnmount(() => {
  stopResize()
  window.removeEventListener('pointerdown', closeHeaderMenu)
  window.removeEventListener('keydown', closeHeaderMenuOnEscape)
})

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

const emptyFilters = () => ({ trainId: null, trainNumber: '', lineCode: '', direction: '' })
const draftFilters = ref(emptyFilters())
const filters = ref(emptyFilters())
const rows = ref([])
const original = ref(new Map())
const selected = ref([])
const result = ref({ totalElements: 0, totalPages: 0 })
const { page, size: pageSize, sort, gridSort, setGridOptions } = gfn_useGridState({ defaultSort: 'id,desc' })
const lines = ref([])
const loading = ref(false)
const saving = ref(false)
const dialog = ref({ open: false, type: 'info', title: '', message: '', showCancel: false, confirmText: '확인' })
let confirmDialog = null

const showMessage = (type, title, detail) => {
  dialog.value = { open: true, type, title, message: detail, showCancel: false, confirmText: '확인' }
}

const askConfirm = (title, detail, confirmText = '진행') =>
  new Promise(resolve => {
    confirmDialog = resolve
    dialog.value = { open: true, type: 'confirm', title, message: detail, showCancel: true, confirmText }
  })

const finishDialog = accepted => {
  dialog.value.open = false
  if (confirmDialog) {
    confirmDialog(accepted)
    confirmDialog = null
  }
}

const popup = ref({ open: false, kind: '', target: null, field: '', rows: [], loading: false })
let nextDraftId = 0
let requestId = 0

const payload = row => ({
  id: row._new ? null : row.id,
  trainId: row.trainId,
  lineCode: row.lineCode,
  departureStationCode: row.departureStationCode,
  arrivalStationCode: row.arrivalStationCode,
  firstTrainTime: row.firstTrainTime?.slice(0, 5) || '',
  lastTrainTime: row.lastTrainTime?.slice(0, 5) || '',
})

const hasChanges = computed(() =>
  rows.value.some(row => row._new || JSON.stringify(payload(row)) !== original.value.get(row.id))
)

const popupTitle = computed(
  () => ({ train: '열차번호 선택', line: '노선 선택', station: '역 선택' })[popup.value.kind] || ''
)

const popupKey = computed(() => ({ train: 'id', line: 'lineCode', station: 'stationCode' })[popup.value.kind] || 'id')

const popupContext = computed(() => {
  if (popup.value.kind !== 'station') return ''
  const row = popup.value.target

  return `${row.lineCode}호선 · ${row.direction === 'UP' ? '상행' : '하행'}${popup.value.field === 'arrival' ? ` · 출발역 ${row.departureStationName}` : ''}`
})

const formatDate = value => (value ? value.replace('T', ' ').slice(0, 19) : '—')

const load = async () => {
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

    if (current !== requestId) return
    rows.value = data.content.map(row => ({
      ...row,
      firstTrainTime: row.firstTrainTime?.slice(0, 5) || '',
      lastTrainTime: row.lastTrainTime?.slice(0, 5) || '',
    }))
    result.value = data
    original.value = new Map(rows.value.map(row => [row.id, JSON.stringify(payload(row))]))
    selected.value = []
  } catch (cause) {
    if (current === requestId) showMessage('error', '오류가 발생했습니다', cause.message)
  } finally {
    if (current === requestId) loading.value = false
  }
}

const mayDiscard = async () =>
  !hasChanges.value || (await askConfirm('계속 진행하시겠습니까?', '저장하지 않은 변경사항이 사라집니다.'))

const search = async () => {
  if (!(await mayDiscard())) return
  filters.value = { ...draftFilters.value }
  page.value = 0
  load()
}

const reset = async () => {
  if (!(await mayDiscard())) return
  filters.value = emptyFilters()
  draftFilters.value = emptyFilters()
  page.value = 0
  load()
}

const updateOptions = async options => {
  const nextSort = options.sortBy[0]
    ? `${options.sortBy[0].key},${options.sortBy[0].order}`
    : 'id,desc'

  const nextPage = options.itemsPerPage === pageSize.value ? options.page - 1 : 0
  if (nextPage === page.value && options.itemsPerPage === pageSize.value && nextSort === sort.value) return
  if (!(await mayDiscard())) return
  if (setGridOptions(options)) load()
}

const add = () =>
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

const clearStations = row => {
  row.departureStationCode = ''
  row.departureStationName = ''
  row.arrivalStationCode = ''
  row.arrivalStationName = ''
}

const changeDirection = (row, value) => {
  if (row.direction === value) return
  row.direction = value
  clearStations(row)
}

const openPopup = async (kind, target = null, field = '') => {
  if (kind === 'station' && !target.lineCode) {
    showMessage('info', '안내 사항', '먼저 노선을 선택해주세요.')

    return
  }
  if (kind === 'station' && field === 'arrival' && !target.departureStationCode) {
    showMessage('info', '안내 사항', '먼저 출발역을 선택해주세요.')

    return
  }
  popup.value = { open: true, kind, target, field, rows: [], loading: true }
  try {
    let options
    if (kind === 'train') {
      options = []
      let trainPage = 0
      let response
      do {
        response = await fn_listTrains({ page: trainPage++, size: 100, sort: 'id,asc' })
        options.push(...response.content.map(train => ({
          ...train,
          statusLabel: TRAIN_STATUSES.find(option => option.value === train.status)?.label ?? train.status,
        })))
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
    } else options = await fn_listStations(target.lineCode, target.direction)
    popup.value = { ...popup.value, rows: options, loading: false }
  } catch (cause) {
    showMessage('error', '오류가 발생했습니다', cause.message)
    popup.value = { ...popup.value, open: false, loading: false }
  }
}

const stationDisabled = station => {
  if (popup.value.kind !== 'station' || popup.value.field !== 'arrival') return false
  const departure = popup.value.rows.find(item => item.stationCode === popup.value.target.departureStationCode)
  if (!departure) return false

  return popup.value.target.direction === 'DOWN'
    ? station.stationOrder <= departure.stationOrder
    : station.stationOrder >= departure.stationOrder
}

const selectPopup = item => {
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
      clearStations(row)
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

const save = async () => {
  const changed = rows.value.filter(row => row._new || JSON.stringify(payload(row)) !== original.value.get(row.id))
  if (!changed.length) return
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
    await fn_saveOperations(changed.map(payload))
    await load()
    showMessage('success', '처리가 완료되었습니다', `${changed.length}건 저장했습니다.`)
  } catch (cause) {
    showMessage('error', '오류가 발생했습니다', cause.message)
  } finally {
    saving.value = false
  }
}

const remove = async () => {
  if (
    !selected.value.length ||
    !(await askConfirm('계속 진행하시겠습니까?', `선택한 ${selected.value.length}건을 삭제하시겠습니까?`, '삭제'))
  )
    return
  const count = selected.value.length
  const ids = selected.value.filter(id => typeof id === 'number')

  const unsavedSurvivors = rows.value.some(
    row => !selected.value.includes(row.id) && (row._new || JSON.stringify(payload(row)) !== original.value.get(row.id))
  )

  if (
    ids.length &&
    unsavedSurvivors &&
    !(await askConfirm(
      '변경사항을 버리시겠습니까?',
      '삭제 후 목록을 다시 조회하면 다른 행의 저장하지 않은 변경사항이 사라집니다.'
    ))
  )
    return

  saving.value = true
  try {
    if (ids.length) await fn_deleteOperations(ids)
    rows.value = rows.value.filter(row => !selected.value.includes(row.id))
    selected.value = []
    if (ids.length) await load()
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
  } catch (cause) {
    showMessage('error', '오류가 발생했습니다', cause.message)
  }
  await load()
})
</script>

<template>
  <div class="train-page operation-page">
    <header class="train-page__intro">
      <h2>열차 운행 정보 목록</h2>
      <p>운행 정보를 조회하고 목록에서 등록·수정·삭제합니다.</p>
    </header>
    <VCard class="train-search-card" elevation="0">
      <form class="operation-search" @submit.prevent="search">
        <label>
          노선
          <select v-model="draftFilters.lineCode">
            <option value="">전체</option>
            <option v-for="line in lines" :key="line" :value="line">{{ line }}호선</option>
          </select>
        </label>
        <label>
          방향
          <select v-model="draftFilters.direction">
            <option value="">전체</option>
            <option v-for="option in directions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          열차번호
          <button type="button" class="operation-picker" @click="openPopup('train')">
            <span class="operation-picker__text">{{ draftFilters.trainNumber || '열차번호 선택' }}</span><VIcon class="operation-picker__icon" icon="bx-search" aria-hidden="true" />
          </button>
        </label>
        <button class="train-button train-button--primary" type="submit">검색</button>
        <button class="train-button" type="button" @click="reset">초기화</button>
      </form>
    </VCard>
    <VCard class="train-list-card" elevation="0">
      <div class="train-list__heading">
        <div>
          <h2>운행 정보 목록</h2>
          <span>총 {{ result.totalElements }}건</span>
        </div>
        <div class="operation-actions">
          <button class="train-button" type="button" :disabled="!selected.length || saving" @click="remove">삭제</button>
          <button class="train-button" type="button" :disabled="saving" @click="add">추가</button>
          <button
            class="train-button train-button--primary"
            type="button"
            :disabled="!hasChanges || saving"
            @click="save"
          >
            저장
          </button>
        </div>
      </div>
      <div class="train-table-wrap operation-table-wrap" :style="{ '--operation-grid-width': gridWidth }" @contextmenu="openHeaderMenu">
        <AppDataGrid
          v-model="selected"
          :columns="gridColumns"
          :rows="rows"
          :total-items="result.totalElements + rows.filter(row => row._new).length"
          :page="page + 1"
          :page-size="pageSize"
          :sort-by="gridSort"
          :loading="loading"
          show-select
          item-value="id"
          @update:options="updateOptions"
        >
          <template v-for="column in gridColumns" #[`header.${column.key}`]="{ getSortIcon }" :key="column.key">
            <div class="v-data-table-header__content">
              <span class="operation-header-text">{{ column.title }}</span>
              <VIcon class="v-data-table-header__sort-icon" :icon="getSortIcon(column)" />
            </div>
            <span
              class="operation-column-resize"
              role="separator"
              tabindex="0"
              aria-orientation="vertical"
              :aria-label="`${column.title} 열 너비 조절`"
              @pointerdown.stop="startResize($event, column)"
              @click.stop
              @keydown="resizeByKeyboard($event, column)"
            />
          </template>
          <template #item.operationNumber="{ item }">{{ item.operationNumber || '—' }}</template>
          <template #item.trainNumber="{ item }">
            <button class="operation-picker" type="button" @click="openPopup('train', item)">
              <span class="operation-picker__text">{{ item.trainNumber || '선택' }}</span><VIcon class="operation-picker__icon" icon="bx-search" aria-hidden="true" />
            </button>
          </template>
          <template #item.lineCode="{ item }">
            <button class="operation-picker" type="button" @click="openPopup('line', item)">
              <span class="operation-picker__text">{{ item.lineCode ? `${item.lineCode}호선` : '선택' }}</span><VIcon class="operation-picker__icon" icon="bx-search" aria-hidden="true" />
            </button>
          </template>
          <template #item.direction="{ item }">
            <select
              class="operation-cell-select"
              :value="item.direction"
              @change="changeDirection(item, $event.target.value)"
            >
              <option v-for="option in directions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </template>
          <template #item.departureStationName="{ item }">
            <button class="operation-picker" type="button" @click="openPopup('station', item, 'departure')">
              <span class="operation-picker__text">{{ item.departureStationName || '선택' }}</span><VIcon class="operation-picker__icon" icon="bx-search" aria-hidden="true" />
            </button>
          </template>
          <template #item.arrivalStationName="{ item }">
            <button class="operation-picker" type="button" @click="openPopup('station', item, 'arrival')">
              <span class="operation-picker__text">{{ item.arrivalStationName || '선택' }}</span><VIcon class="operation-picker__icon" icon="bx-search" aria-hidden="true" />
            </button>
          </template>
          <template #item.firstTrainTime="{ item }">
            <input v-model="item.firstTrainTime" class="operation-time" type="time" aria-label="출발시각" />
          </template>
          <template #item.lastTrainTime="{ item }">
            <input v-model="item.lastTrainTime" class="operation-time" type="time" aria-label="도착시각" />
          </template>
          <template #item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>
          <template #item.createdByName="{ item }">{{ item.createdByName || '—' }}</template>
          <template #item.updatedAt="{ item }">{{ formatDate(item.updatedAt) }}</template>
          <template #item.updatedByName="{ item }">{{ item.updatedByName || '—' }}</template>
        </AppDataGrid>
      </div>
      <div
        v-if="headerMenu"
        class="operation-header-menu"
        :style="{ left: `${headerMenu.left}px`, top: `${headerMenu.top}px` }"
        @pointerdown.stop
      >
        <button type="button" @click="resetColumnWidths">열 너비 초기화</button>
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
      :disabled-row="stationDisabled"
      @select="selectPopup"
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

<style scoped>
.operation-page {
  display: grid;
  gap: 20px;
}
.operation-search {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) minmax(180px, 2fr) auto auto;
  align-items: end;
  gap: 12px;
}
.operation-search label {
  display: grid;
  gap: 8px;
  font-weight: 700;
}
.operation-search select,
.operation-picker,
.operation-cell-select,
.operation-time {
  min-height: 40px;
  padding: 6px 10px;
  border: 1px solid #d7deea;
  border-radius: 4px;
  background: #fff;
  color: #263241;
  font: inherit;
}
.operation-picker {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  min-width: 0;
  white-space: nowrap;
}
.operation-picker__text,
.operation-header-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.operation-picker__icon {
  flex: none;
  color: #064984;
  font-size: 18px;
}
.operation-cell-select {
  width: 100%;
}
.operation-time {
  width: 100%;
  min-width: 0;
}
.operation-actions {
  display: flex;
  gap: 8px;
}
.operation-actions .train-button {
  min-width: 84px;
}
.operation-table-wrap {
  display: block;
}
.operation-table-wrap :deep(.v-table__wrapper table) {
  min-width: var(--operation-grid-width);
}
.operation-table-wrap :deep(.v-data-table__th) {
  position: relative;
}
.operation-column-resize {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 10px;
  cursor: col-resize;
  touch-action: none;
}
.operation-column-resize:hover,
.operation-column-resize:focus-visible {
  border-right: 3px solid #064984;
  outline: none;
}
.operation-header-menu {
  position: fixed;
  z-index: 2500;
  min-width: 140px;
  padding: 4px;
  border: 1px solid #d7deea;
  border-radius: 4px;
  background: #fff;
  box-shadow: 0 4px 12px #26324126;
}
.operation-header-menu button {
  width: 100%;
  padding: 8px 10px;
  border: 0;
  background: transparent;
  color: #263241;
  cursor: pointer;
  text-align: left;
}
.operation-header-menu button:hover,
.operation-header-menu button:focus-visible {
  background: #edf5ff;
}
.operation-table-wrap :deep(.v-data-table__td) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 800px) {
  .operation-search {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .operation-search label:nth-child(3) {
    grid-column: 1 / -1;
  }
}
@media (max-width: 600px) {
  .operation-search {
    grid-template-columns: 1fr;
  }
  .operation-search label:nth-child(3) {
    grid-column: auto;
  }
  .operation-actions {
    width: 100%;
  }
  .operation-actions .train-button {
    flex: 1;
    min-width: 0;
  }
}
</style>
