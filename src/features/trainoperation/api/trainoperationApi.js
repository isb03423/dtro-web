import { fn_apiRequest } from '@/api/http'

const BASE = '/api/train-operations'

// 검색·페이지·정렬 조건으로 열차 목록을 조회한다.
export const fn_listOperations = filters => {
  // 빈 문자열 조건은 전송하지 않아 서버가 전체 검색으로 처리하게 한다.
  const body = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))

  return fn_apiRequest(`${BASE}/search`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// 열차 ID로 상세 정보를 조회한다.
export const fn_saveOperations = rows => fn_apiRequest(BASE, {
  method: 'PUT',
  body: JSON.stringify({ rows }),
})

export const fn_deleteOperations = ids => fn_apiRequest(BASE, {
  method: 'DELETE',
  body: JSON.stringify(ids),
})

export const fn_listLines = () => fn_apiRequest(`${BASE}/lines`)

export const fn_listStations = (lineCode, direction) => fn_apiRequest(
  `${BASE}/stations?lineCode=${encodeURIComponent(lineCode)}&direction=${encodeURIComponent(direction)}`,
)
