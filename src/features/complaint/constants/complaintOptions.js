export const COMPLAINT_TYPES = Object.freeze([
  { value: 'OPERATION', label: '열차 운행' },
  { value: 'FACILITY', label: '역사 및 열차 시설' },
  { value: 'STAFF_SERVICE', label: '직원 서비스' },
  { value: 'SAFETY', label: '안전 및 질서' },
  { value: 'FARE_PAYMENT', label: '요금 및 교통카드' },
  { value: 'OTHER', label: '기타' },
])

export const COMPLAINT_STATUSES = Object.freeze([
  { value: 'PENDING', label: '답변 대기' },
  { value: 'ANSWERED', label: '답변 완료' },
])
