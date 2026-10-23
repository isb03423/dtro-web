import { fn_apiRequest } from '@/api/http'

const BASE = '/api/complaints'

export const fn_listComplaints = async filters => {
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== '' && value != null),
  )
  const response = await fn_apiRequest(`${BASE}?${params}`)

  // 민원 API의 totalPage를 공통 목록 화면의 totalPages로 맞춘다.
  return { ...response, totalPages: response.totalPage ?? response.totalPages ?? 0 }
}

export const fn_getComplaint = id => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`)

export const fn_createComplaint = payload => fn_apiRequest(BASE, {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const fn_deleteComplaint = id => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
  method: 'DELETE',
})

export const fn_answerComplaint = (id, payload) => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
})

export const fn_updateComplaint = (id, payload) => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
})

export const fn_updateComplaintAnswer = (id, payload) => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}/answer`, {
  method: 'PATCH',
  body: JSON.stringify(payload),
})
