export const TRAIN_LINES = Object.freeze([
  { value: '제목', label: '제목' },
  { value: '내용', label: '내용' },
  { value: '제목+내용', label: '제목+내용' },
])

export const NOTICE_STATUSES = Object.freeze([
  { value: 'AVAILABLE', label: '관리자' },
  { value: 'RUNNING', label: '운영자' },
  { value: 'INSPECTION', label: '사용자' },
])

// 상태 코드에 대응하는 화면 표시 이름을 반환한다.
export const fn_statusLabel = status => NOTICE_STATUSES.find(item => item.value === status)?.label ?? status
