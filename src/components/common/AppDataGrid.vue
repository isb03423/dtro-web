<script setup>
import { DEFAULT_GRID_PAGE_SIZE, GRID_PAGE_SIZES } from '@/config/gridOptions'
import { computed, onBeforeUnmount, onMounted, ref, useSlots, watch } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
  totalItems: { type: Number, required: true },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: DEFAULT_GRID_PAGE_SIZE },

  // 공통 페이지 크기 선택지를 복사해 반환한다.
  pageSizes: { type: Array, default: () => [...GRID_PAGE_SIZES] },

  // 선택된 정렬이 없을 때 빈 목록을 반환한다.
  sortBy: { type: Array, default: () => [] },
  rowProps: { type: Function, default: undefined },
  loading: { type: Boolean, default: false },
  loadingText: { type: String, default: '목록을 불러오는 중입니다.' },
  emptyText: { type: String, default: '검색 결과가 없습니다.' },
  showSelect: { type: Boolean, default: false },
  modelValue: { type: Array, default: () => [] },
  itemValue: { type: String, default: 'id' },
  columnWidthKey: { type: String, default: '' },
})

const emit = defineEmits(['update:options', 'click:row', 'update:modelValue'])

defineOptions({ inheritAttrs: false })

const slots = useSlots()
const grid = ref(null)
const wrapperWidth = ref(0)
const columnWidths = ref({})
const headerMenu = ref(null)
const fonts = ref({ header: '800 13px "Malgun Gothic", sans-serif', body: '15px "Malgun Gothic", sans-serif' })
const textMeasure = document.createElement('canvas').getContext('2d')
let resizing = null
let suppressResizeClick = false
let gridResizeObserver = null
const isResizing = ref(false)

// 최대 표시 문자열과 헤더·셀 여백을 포함한 기본 너비를 구한다.
const fn_defaultColumnWidth = column => {
  if (column.maxText === undefined && !column.autoWidth) {
    return column.width
  }
  textMeasure.font = fonts.value.header

  const headerWidth = textMeasure.measureText(column.title).width + 32 + 10

  textMeasure.font = fonts.value.body

  const samples = [column.maxText || '—'].flat()
  if (column.autoWidth) {
    samples.push(...props.rows.map(row => String(row[column.key] ?? '—')))
  }
  const textWidth = Math.max(0, ...samples.map(value => textMeasure.measureText(value).width))
  const contentWidth = textWidth + 32 + (column.contentPadding || 0)

  return Math.ceil(Math.max(column.width || 80, headerWidth, contentWidth))
}

const gridColumns = computed(() => {
  const columns = props.columns.map(column => {
    const width = props.columnWidthKey && Number.isFinite(columnWidths.value[column.key])
      ? Math.max(80, columnWidths.value[column.key]) : fn_defaultColumnWidth(column)

    return {
      ...column,
      width,
      ...(column.constrainWidth ? { minWidth: width, maxWidth: width } : {}),
    }
  })

  const fillColumn = columns.find(column => column.fillRemaining)
  if (fillColumn && !Number.isFinite(columnWidths.value[fillColumn.key])) {
    const tableWidth = columns.reduce((sum, column) => sum + (Number(column.width) || 150), props.showSelect ? 48 : 0)
    fillColumn.width = (Number(fillColumn.width) || 150) + Math.max(0, wrapperWidth.value - tableWidth)
  }

  return columns
})

const resizableColumns = computed(() => props.columnWidthKey ? gridColumns.value : [])
const hasFillColumn = computed(() => props.columnWidthKey && props.columns.some(column => column.fillRemaining))
const gridWidth = computed(() => `${gridColumns.value.reduce((sum, column) => sum + (Number(column.width) || 150), props.showSelect ? 48 : 0)}px`)
const forwardedSlots = computed(() => Object.keys(slots).filter(name => !resizableColumns.value.some(column => name === `header.${column.key}`)))

// 포인터 이동 거리만큼 열 너비를 변경한다.
const fn_moveResize = event => {
  if (!resizing) {
    return
  }
  columnWidths.value = {
    ...columnWidths.value,
    [resizing.key]: Math.max(80, resizing.width + event.clientX - resizing.startX)
  }
}

// 열 너비를 저장하고 크기 조절 이벤트를 해제한다.
const fn_stopResize = () => {
  if (resizing) {
    localStorage.setItem(resizing.storageKey, JSON.stringify(columnWidths.value))
  }
  resizing = null
  isResizing.value = false
  window.removeEventListener('pointermove', fn_moveResize)
  window.removeEventListener('pointerup', fn_stopResize)
  window.removeEventListener('pointercancel', fn_stopResize)
}

// 선택한 열의 너비 조절을 시작한다.
const fn_startResize = (event, column) => {
  if (event.button !== 0) {
    return
  }
  event.preventDefault()
  event.currentTarget.setPointerCapture(event.pointerId)
  headerMenu.value = null
  suppressResizeClick = true
  resizing = {
    key: column.key,
    width: Number(column.width) || 150,
    startX: event.clientX,
    storageKey: props.columnWidthKey
  }
  isResizing.value = true
  window.addEventListener('pointermove', fn_moveResize)
  window.addEventListener('pointerup', fn_stopResize)
  window.addEventListener('pointercancel', fn_stopResize)
}

// 손잡이 밖에서 놓아도 드래그 뒤에 발생한 클릭이 헤더 정렬로 전달되지 않게 한다.
const fn_blockResizeClick = event => {
  if (!suppressResizeClick || event.detail === 0) {
    return
  }
  suppressResizeClick = false
  event.preventDefault()
  event.stopImmediatePropagation()
}

const fn_clearResizeClick = () => {
  suppressResizeClick = false
}

// 방향키로 열 너비를 조절한다.
const fn_resizeByKeyboard = (event, column) => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
    return
  }
  event.preventDefault()
  event.stopPropagation()
  columnWidths.value = {
    ...columnWidths.value,
    [column.key]: Math.max(80, (Number(column.width) || 150) + (event.key === 'ArrowRight' ? 10 : -10))
  }
  localStorage.setItem(props.columnWidthKey, JSON.stringify(columnWidths.value))
}

// 저장된 열 너비를 기본값으로 초기화한다.
const fn_resetColumnWidths = () => {
  fn_stopResize()
  columnWidths.value = {}
  localStorage.removeItem(props.columnWidthKey)
  headerMenu.value = null
}

// 그리드 헤더의 열 너비 메뉴를 연다.
const fn_openHeaderMenu = event => {
  if (!props.columnWidthKey || !event.target.closest('.v-data-table__th')) {
    return
  }
  event.preventDefault()
  headerMenu.value = {
    left: Math.min(event.clientX, window.innerWidth - 150),
    top: Math.min(event.clientY, window.innerHeight - 48)
  }
}

// 열 너비 메뉴를 닫는다.
const fn_closeHeaderMenu = () => {
  headerMenu.value = null
}

// Escape 키를 누르면 열 너비 메뉴를 닫는다.
const fn_closeHeaderMenuOnEscape = event => {
  if (event.key === 'Escape') {
    fn_closeHeaderMenu()
  }
}

// 화면별로 저장된 열 너비를 불러온다.
watch(() => props.columnWidthKey, key => {
  fn_stopResize()
  columnWidths.value = {}
  headerMenu.value = null
  if (!key) {
    return
  }
  try {
    const stored = JSON.parse(localStorage.getItem(key) || '{}')
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      columnWidths.value = stored
    }
  } catch {
    // 저장된 설정이 손상된 경우 기본 너비를 사용한다.
  }
}, { immediate: true })

// 실제 표시 글꼴을 캔버스에서도 사용할 수 있는 font 형식으로 읽는다.
const fn_updateFonts = () => {
  if (!grid.value) {
    return
  }
  const header = grid.value.$el.querySelector('.v-data-table__th')
  const cell = !props.loading && props.rows.length ? grid.value.$el.querySelector('tbody .v-data-table__td') : null
  const headerStyle = header ? getComputedStyle(header) : null
  const cellStyle = cell ? getComputedStyle(cell) : null

  fonts.value = {
    header: headerStyle ? `${headerStyle.fontWeight} ${headerStyle.fontSize} ${headerStyle.fontFamily}` : fonts.value.header,
    body: cellStyle ? `${cellStyle.fontWeight} ${cellStyle.fontSize} ${cellStyle.fontFamily}` : fonts.value.body
  }
}

watch([() => props.loading, () => props.rows], fn_updateFonts, { flush: 'post' })

onMounted(() => {
  fn_updateFonts()
  const wrapper = grid.value?.$el.querySelector('.v-table__wrapper')
  if (wrapper && hasFillColumn.value) {
    wrapperWidth.value = wrapper.clientWidth
    if (typeof ResizeObserver !== 'undefined') {
      gridResizeObserver = new ResizeObserver(() => {
        wrapperWidth.value = wrapper.clientWidth
      })
      gridResizeObserver.observe(wrapper)
    }
  }
  window.addEventListener('pointerdown', fn_clearResizeClick, true)
  window.addEventListener('pointerdown', fn_closeHeaderMenu)
  window.addEventListener('keydown', fn_closeHeaderMenuOnEscape)
})

onBeforeUnmount(() => {
  fn_stopResize()
  gridResizeObserver?.disconnect()
  window.removeEventListener('pointerdown', fn_clearResizeClick, true)
  window.removeEventListener('pointerdown', fn_closeHeaderMenu)
  window.removeEventListener('keydown', fn_closeHeaderMenuOnEscape)
})
</script>

<template>
  <VDataTableServer
    ref="grid"
    v-bind="$attrs"
    class="app-data-grid"
    :class="{ 'app-data-grid--resizable': columnWidthKey, 'app-data-grid--fill-column': hasFillColumn, 'app-data-grid--resizing': isResizing }"
    :style="columnWidthKey ? { '--app-grid-width': gridWidth } : undefined"
    :headers="gridColumns"
    :items="rows"
    :items-length="totalItems"
    :items-per-page="pageSize"
    :items-per-page-options="pageSizes"
    :page="page"
    :sort-by="sortBy"
    :row-props="rowProps"
    :loading="loading"
    :loading-text="loadingText"
    :no-data-text="emptyText"
    :show-select="showSelect"
    :model-value="modelValue"
    :item-value="itemValue"
    items-per-page-text="페이지당 항목"
    first-page-label="첫 페이지"
    prev-page-label="이전 페이지"
    next-page-label="다음 페이지"
    last-page-label="마지막 페이지"
    show-current-page
    @contextmenu="fn_openHeaderMenu"
    @click.capture="fn_blockResizeClick"
    @update:options="options => emit('update:options', options)"
    @click:row="(event, row) => emit('click:row', event, row)"
    @update:model-value="value => emit('update:modelValue', value)"
  >
    <template v-for="slotName in forwardedSlots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
    <template v-for="column in resizableColumns" #[`header.${column.key}`]="slotProps" :key="column.key">
      <slot :name="`header.${column.key}`" v-bind="slotProps">
        <div class="v-data-table-header__content app-data-grid__header-content">
          <span class="app-data-grid__header-text">{{ column.title }}</span>
          <VIcon v-if="column.sortable !== false" class="v-data-table-header__sort-icon" :icon="slotProps.getSortIcon(column)" />
        </div>
      </slot>
      <span
        class="app-data-grid__column-resize"
        role="separator"
        tabindex="0"
        aria-orientation="vertical"
        :aria-label="`${column.title} 열 너비 조절`"
        :aria-valuenow="Number(column.width) || 150"
        :aria-valuemin="80"
        @pointerdown.stop="fn_startResize($event, column)"
        @click.stop
        @keydown="fn_resizeByKeyboard($event, column)"
      />
    </template>
  </VDataTableServer>
  <Teleport to="body">
    <div
      v-if="headerMenu"
      class="app-data-grid__header-menu"
      :style="{ left: `${headerMenu.left}px`, top: `${headerMenu.top}px` }"
      @pointerdown.stop
    >
      <button type="button" @click="fn_resetColumnWidths">열 너비 초기화</button>
    </div>
  </Teleport>
</template>
