import { fn_apiRequest } from '@/api/http'

const BASE = '/api/trains'

// 검색·페이지·정렬 조건으로 열차 목록을 조회한다.
export const fn_listTrains = filters => {
  // 빈 문자열 조건은 전송하지 않아 서버가 전체 검색으로 처리하게 한다.
  const body = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''))

  return fn_apiRequest(`${BASE}/search`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

// 목록에서 추가하거나 수정한 열차 행을 일괄 저장한다.
export const fn_saveTrains = rows => fn_apiRequest(BASE, {
  method: 'PUT',
  body: JSON.stringify({ rows }),
})

// 목록에서 선택한 열차 ID를 일괄 삭제한다.
export const fn_deleteTrains = ids => fn_apiRequest(BASE, {
  method: 'DELETE',
  body: JSON.stringify(ids),
})
