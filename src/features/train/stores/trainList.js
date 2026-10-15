import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fn_useGridState } from '@/composables/useGridState'

// 비어 있는 열차 검색 조건을 만든다.
const fn_emptyFilters = () => ({ lineName: '', status: '', keyword: '' })

// 목록 화면의 검색 조건과 페이지·정렬 상태를 보관한다.
export const useTrainListStore = defineStore('trainList', () => {
  const filters = ref(fn_emptyFilters())
  const { page, size, sort, gridSort, setGridOptions, resetGridOptions } = fn_useGridState()

  // 새 검색 조건을 적용하고 첫 페이지로 이동한다.
  const fn_applyFilters = next => {
    filters.value = { ...next }
    page.value = 0
  }

  // 목록의 검색 조건과 페이지 상태를 초기화한다.
  const fn_reset = () => {
    filters.value = fn_emptyFilters()
    resetGridOptions()
  }

  return { filters, page, size, sort, gridSort, applyFilters: fn_applyFilters, setGridOptions, reset: fn_reset }
})
