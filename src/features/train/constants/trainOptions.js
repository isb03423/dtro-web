export const TRAIN_LINES = Object.freeze([
  { value: '1호선', label: '1호선' },
  { value: '2호선', label: '2호선' },
  { value: '3호선', label: '3호선' },
])

export const TRAIN_STATUSES = Object.freeze([
  { value: 'AVAILABLE', label: '운행 가능' },
  { value: 'RUNNING', label: '운행 중' },
  { value: 'INSPECTION', label: '점검 중' },
])

// 상태 코드에 대응하는 화면 표시 이름을 반환한다.
export const fn_statusLabel = status => TRAIN_STATUSES.find(item => item.value === status)?.label ?? status
