import { ref } from 'vue'
import { gfn_useGridState } from '@/composables/useGridState'

// 검색 필드의 key로 기본 검색 조건과 공통 목록 상태를 만든다.
export const gfn_useListState = (searchFields, gridOptions) => {
  const gfn_emptyFilters = () => Object.fromEntries(searchFields.map(({ key }) => [key, '']))
  const filters = ref(gfn_emptyFilters())
  const { page, size, sort, gridSort, setGridOptions, resetGridOptions } = gfn_useGridState(gridOptions)

  const applyFilters = next => {
    filters.value = { ...next }
    page.value = 0
  }

  const reset = () => {
    filters.value = gfn_emptyFilters()
    resetGridOptions()
  }

  return { filters, page, size, sort, gridSort, applyFilters, setGridOptions, reset }
}
