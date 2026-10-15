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

// 열차 ID로 상세 정보를 조회한다.
export const fn_getTrain = id => fn_apiRequest(`${BASE}/${id}`)

// 입력한 열차 정보를 서버에 등록한다.
export const fn_createTrain = payload => fn_apiRequest(BASE, {
  method: 'POST',
  body: JSON.stringify(payload),
})

// 열차 ID에 해당하는 정보를 수정한다.
export const fn_updateTrain = (id, payload) => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
})

// 열차 ID에 해당하는 정보를 삭제한다.
export const fn_deleteTrain = id => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
  method: 'DELETE',
})
