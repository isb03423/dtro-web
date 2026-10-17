export const INCIDENT_TYPES = Object.freeze(['신호 이상', '차량 이상', '출입문 이상', '운행 지연'])

export const INCIDENT_STATUSES = Object.freeze([
  { value: 'RECEIVED', label: '접수' },
  { value: 'CHECKING', label: '확인 중' },
  { value: 'IN_PROGRESS', label: '조치 중' },
  { value: 'VERIFYING', label: '복구 확인 중' },
  { value: 'COMPLETED', label: '조치 완료' },
])

export const INCIDENT_HISTORY_TITLES = Object.freeze({
  CHECKING: '확인 시작',
  IN_PROGRESS: '조치 시작',
  VERIFYING: '복구 확인 시작',
  COMPLETED: '조치 완료',
  'VERIFYING->IN_PROGRESS': '추가 조치',
})
