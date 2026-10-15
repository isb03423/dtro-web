<script setup>
import { DEFAULT_GRID_PAGE_SIZE, GRID_PAGE_SIZES } from '@/config/gridOptions'

defineProps({
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
})

const emit = defineEmits(['update:options', 'click:row'])
</script>

<template>
  <VDataTableServer
    class="app-data-grid"
    :headers="columns"
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
    items-per-page-text="페이지당 항목"
    first-page-label="첫 페이지"
    prev-page-label="이전 페이지"
    next-page-label="다음 페이지"
    last-page-label="마지막 페이지"
    show-current-page
    @update:options="options => emit('update:options', options)"
    @click:row="(event, row) => emit('click:row', event, row)"
  >
    <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
      <slot :name="slotName" v-bind="slotProps ?? {}" />
    </template>
  </VDataTableServer>
</template>

<style lang="scss">
.app-data-grid .v-table__wrapper table { min-inline-size: 900px; table-layout: fixed; }
.app-data-grid .v-data-table__th,
.app-data-grid .v-data-table__td { block-size: 50px; padding: 8px 16px !important; border-bottom: 1px solid #e6eaf0 !important; }
.app-data-grid .v-data-table__th { background: #f2f4f8; color: #263241 !important; font-size: 13px; font-weight: 800; }
.app-data-grid .v-data-table__td { color: #727e8e; font-size: 15px; }
.app-data-grid .v-data-table-footer { border-top: 1px solid #e6eaf0; }
</style>
