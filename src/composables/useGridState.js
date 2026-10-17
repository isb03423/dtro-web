import { computed, ref } from 'vue'
import { DEFAULT_GRID_PAGE_SIZE } from '@/config/gridOptions'

// 목록 화면에서 공통으로 쓰는 페이지·크기·정렬 상태를 만든다.
export const gfn_useGridState = ({ defaultSize = DEFAULT_GRID_PAGE_SIZE, defaultSort = 'id,asc' } = {}) => {
  const page = ref(0)
  const size = ref(defaultSize)
  const sort = ref(defaultSort)

  // API 정렬 문자열을 그리드가 사용하는 배열로 바꾼다.
  const gridSort = computed(() => {
    if (!sort.value) {
      return []
    }

    const [key, order] = sort.value.split(',')

    return [{ key, order }]
  })

  // 그리드 변경값을 저장하고 실제로 달라졌는지 반환한다.
  const fn_setGridOptions = ({ page: gridPage, itemsPerPage, sortBy }) => {
    // 그리드는 1부터, API는 0부터 페이지 번호를 센다.
    const nextPage = size.value === itemsPerPage ? gridPage - 1 : 0
    const selected = sortBy[0]
    const nextSort = selected ? `${selected.key},${selected.order}` : defaultSort
    if (page.value === nextPage && size.value === itemsPerPage && sort.value === nextSort) {
      return false
    }

    page.value = nextPage
    size.value = itemsPerPage
    sort.value = nextSort

    return true
  }

  // 페이지·크기·정렬을 처음 상태로 되돌린다.
  const fn_resetGridOptions = () => {
    page.value = 0
    size.value = defaultSize
    sort.value = defaultSort
  }

  return { page, size, sort, gridSort, setGridOptions: fn_setGridOptions, resetGridOptions: fn_resetGridOptions }
}
