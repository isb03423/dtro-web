<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  itemKey: { type: String, required: true },
  searchable: { type: Boolean, default: true },
  disabledRow: { type: Function, default: () => false },
  loading: { type: Boolean, default: false },
  context: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'select'])
const keyword = ref('')
const selected = ref([])

watch(() => props.modelValue, open => {
  if (open) {
    keyword.value = ''
    selected.value = []
  }
})

const visibleRows = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return props.rows
  
  return props.rows.filter(row => props.columns.some(column => String(row[column.key] ?? '').toLowerCase().includes(query)))
})

const toggleRow = row => {
  if (props.disabledRow(row)) return

  const key = row[props.itemKey]

  selected.value = selected.value[0] === key ? [] : [key]
}

const rowProps = ({ item }) => ({
  class: {
    'app-grid-select-dialog__row': true,
    'app-grid-select-dialog__row--selected': selected.value.includes(item[props.itemKey]),
    'app-grid-select-dialog__row--disabled': props.disabledRow(item),
  },
  tabindex: props.disabledRow(item) ? -1 : 0,
  'aria-selected': selected.value.includes(item[props.itemKey]),
  onClick: event => {
    if (event.target.closest('.v-selection-control')) return

    toggleRow(item)
  },
  onKeydown: event => {
    if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return

    event.preventDefault()
    toggleRow(item)
  },
})

const choose = row => {
  if (props.disabledRow(row)) return
  emit('select', row)
  emit('update:modelValue', false)
}

const confirm = () => {
  const row = props.rows.find(item => item[props.itemKey] === selected.value[0])
  if (row) choose(row)
}
</script>

<template>
  <VDialog :model-value="modelValue" width="850" max-width="calc(100vw - 32px)" @update:model-value="value => emit('update:modelValue', value)">
    <VCard class="app-grid-select-dialog" rounded="lg" elevation="0">
      <header class="app-grid-select-dialog__header">
        <div>
          <h2>{{ title }}</h2>
          <p>{{ context || '목록에서 항목을 선택해주세요.' }}</p>
        </div>
        <button class="app-grid-select-dialog__close" type="button" aria-label="팝업 닫기" @click="emit('update:modelValue', false)">×</button>
      </header>
      <VCardText class="app-grid-select-dialog__body">
        <label v-if="searchable" class="app-grid-select-dialog__search">
          <span>검색어</span>
          <input v-model="keyword" type="search" placeholder="번호 또는 이름으로 검색" />
        </label>
        <div class="app-grid-select-dialog__table-wrap">
          <VDataTable
            v-model="selected"
            class="app-grid-select-dialog__table"
            :headers="columns"
            :items="visibleRows"
            :item-value="itemKey"
            :items-per-page="-1"
            :loading="loading"
            show-select
            select-strategy="single"
            :row-props="rowProps"
            hide-default-footer
            no-data-text="선택 가능한 데이터가 없습니다."
          >
            <template #header.data-table-select></template>
            <template #item.data-table-select="{ item, internalItem, isSelected, toggleSelect }">
              <VCheckboxBtn
                :model-value="isSelected(internalItem)"
                :disabled="disabledRow(item)"
                :aria-label="`${item[columns[0].key]} 선택`"
                @click.stop
                @update:model-value="toggleSelect(internalItem)"
              />
            </template>
          </VDataTable>
        </div>
      </VCardText>
      <footer class="app-grid-select-dialog__footer">
        <span>{{ selected.length ? '1건 선택됨' : '항목을 선택해주세요.' }}</span>
        <div>
          <button class="app-grid-select-dialog__button" type="button" @click="emit('update:modelValue', false)">취소</button>
          <button class="app-grid-select-dialog__button app-grid-select-dialog__button--primary" type="button" :disabled="!selected.length" @click="confirm">선택</button>
        </div>
      </footer>
    </VCard>
  </VDialog>
</template>

<style scoped>
.app-grid-select-dialog { display: flex; width: 850px; min-width: 850px; max-width: 850px; height: 640px; min-height: 640px; max-height: 640px; flex-direction: column; border: 1px solid #d7deea; background: #fff; color: #263241; font-family: 'Malgun Gothic', 'Noto Sans KR', sans-serif; }
.app-grid-select-dialog__header { display: flex; flex-shrink: 0; align-items: flex-start; justify-content: space-between; padding: 24px 28px 20px; border-bottom: 1px solid #e6eaf0; }
.app-grid-select-dialog__header h2 { margin: 0; color: #212b39; font-size: 20px; font-weight: 800; }
.app-grid-select-dialog__header p { margin: 8px 0 0; color: #75808f; font-size: 14px; }
.app-grid-select-dialog__close { width: 32px; height: 32px; border: 0; border-radius: 4px; background: transparent; color: #75808f; cursor: pointer; font-size: 26px; line-height: 1; }
.app-grid-select-dialog__close:hover { background: #f2f4f8; }
.app-grid-select-dialog__body { display: flex; min-height: 0; flex: 1; flex-direction: column; overflow: hidden; padding: 20px 28px 24px; }
.app-grid-select-dialog__search { display: grid; gap: 8px; margin-bottom: 20px; color: #263241; font-size: 14px; font-weight: 700; }
.app-grid-select-dialog__search input { width: 100%; height: 42px; padding: 0 12px; border: 1px solid #d7deea; border-radius: 4px; background: #fff; color: #263241; font: inherit; font-weight: 400; }
.app-grid-select-dialog__search input::placeholder { color: #75808f; }
.app-grid-select-dialog__table-wrap { height: 350px; flex: 0 0 350px; overflow: auto; border: 1px solid #d7deea; border-radius: 5px; scrollbar-gutter: stable; }
.app-grid-select-dialog__table { min-width: 500px; }
.app-grid-select-dialog__table :deep(table) { table-layout: fixed; }
.app-grid-select-dialog__table :deep(.v-table__wrapper) { overflow: visible; }
.app-grid-select-dialog__table :deep(.v-data-table__th) { position: sticky; top: 0; z-index: 1; height: 48px; padding: 10px 16px !important; border-bottom: 1px solid #d7deea; background: #eaf1f9 !important; color: #263241; font-size: 13px; font-weight: 800; }
.app-grid-select-dialog__table :deep(.v-data-table__td) { height: 48px; border-bottom-color: #e6eaf0; color: #4a586b; font-size: 14px; }
.app-grid-select-dialog__table :deep(.v-data-table__th),
.app-grid-select-dialog__table :deep(.v-data-table__td) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.app-grid-select-dialog__table :deep(.v-data-table-header__content) { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.app-grid-select-dialog__table :deep(.v-data-table__th:first-child),
.app-grid-select-dialog__table :deep(.v-data-table__td:first-child) { width: 66px; }
.app-grid-select-dialog__table :deep(.app-grid-select-dialog__row) { cursor: pointer; }
.app-grid-select-dialog__table :deep(.app-grid-select-dialog__row:hover .v-data-table__td) { background: #f7faff; }
.app-grid-select-dialog__table :deep(.app-grid-select-dialog__row--selected .v-data-table__td) { background: #edf5ff; }
.app-grid-select-dialog__table :deep(.app-grid-select-dialog__row--disabled) { opacity: .45; cursor: not-allowed; }
.app-grid-select-dialog__table :deep(.app-grid-select-dialog__row:focus-visible) { outline: 3px solid #79b8f4; outline-offset: -3px; }
.app-grid-select-dialog__footer { display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 28px 20px; border-top: 1px solid #e6eaf0; color: #75808f; font-size: 13px; }
.app-grid-select-dialog__footer > div { display: flex; gap: 8px; }
.app-grid-select-dialog__button { min-width: 88px; height: 40px; padding: 0 16px; border: 1px solid #d7deea; border-radius: 4px; background: #fff; color: #243041; cursor: pointer; font: inherit; font-size: 14px; font-weight: 700; }
.app-grid-select-dialog__button--primary { border-color: #064984; background: #064984; color: #fff; }
.app-grid-select-dialog__button:disabled { cursor: default; opacity: .45; }
.app-grid-select-dialog__button:focus-visible, .app-grid-select-dialog__search input:focus-visible, .app-grid-select-dialog__close:focus-visible { outline: 3px solid #79b8f4; outline-offset: 2px; }
@media (max-width: 600px) { .app-grid-select-dialog__header, .app-grid-select-dialog__body, .app-grid-select-dialog__footer { padding-right: 16px; padding-left: 16px; } .app-grid-select-dialog__footer { align-items: stretch; flex-direction: column; } .app-grid-select-dialog__footer > div { display: flex; } .app-grid-select-dialog__button { flex: 1; } }
@media (max-width: 881px), (max-height: 671px) {
  .app-grid-select-dialog { width: min(850px, calc(100vw - 32px)); min-width: 0; max-width: min(850px, calc(100vw - 32px)); height: min(640px, calc(100dvh - 32px)); min-height: 0; max-height: min(640px, calc(100dvh - 32px)); }
  .app-grid-select-dialog__table-wrap { height: auto; min-height: 0; flex: 1; }
}
</style>
