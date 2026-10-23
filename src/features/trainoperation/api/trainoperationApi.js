import { fn_apiRequest } from '@/api/http'

const BASE = '/api/train-operations'

// 검색·페이지·정렬 조건으로 열차 운행 목록을 조회한다.
export const fn_listOperations = filters => {
  // 빈 문자열 조건은 전송하지 않아 서버가 전체 검색으로 처리하게 한다.
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== '' && value != null),
  )

  return fn_apiRequest(`${BASE}/search?${params}`, { cache: 'no-store' })
}

// 추가하거나 수정한 운행정보 행을 일괄 저장한다.
export const fn_saveOperations = rows => fn_apiRequest(BASE, {
  method: 'PUT',
  body: JSON.stringify({ rows }),
})

// 선택한 운행정보 ID에 해당하는 행을 일괄 삭제한다.
export const fn_deleteOperations = ids => fn_apiRequest(BASE, {
  method: 'DELETE',
  body: JSON.stringify(ids),
})

// 운행정보에 사용할 노선 목록을 조회한다.
export const fn_listLines = () => fn_apiRequest(`${BASE}/lines`)

// 노선과 운행 방향에 맞는 역 목록을 조회한다.
export const fn_listStations = (lineCode, direction) => fn_apiRequest(
  `${BASE}/stations?lineCode=${encodeURIComponent(lineCode)}&direction=${encodeURIComponent(direction)}`,
)
