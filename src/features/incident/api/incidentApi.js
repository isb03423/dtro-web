import { fn_apiRequest } from '@/api/http'

const BASE = '/api/incidents'

// 검색·페이지·정렬 조건으로 운행 장애 목록을 조회한다.
export const fn_listIncidents = filters => {
  // 비어 있는 조건은 제외해 서버가 전체 검색으로 처리하게 한다.
  const params = new URLSearchParams(
    Object.entries(filters).filter(([, value]) => value !== '' && value != null),
  )

  return fn_apiRequest(`${BASE}/search?${params}`, { cache: 'no-store' })
}

// 장애 ID로 접수 및 조치 내용을 조회한다.
export const fn_getIncident = id => fn_apiRequest(`${BASE}/${id}`)

// 장애 ID에 해당하는 처리 이력을 조회한다.
export const fn_getIncidentHistory = id => fn_apiRequest(`${BASE}/${id}/history`)

// 장애 ID가 없으면 등록하고, 있으면 기존 접수 내용을 수정한다.
export const fn_saveIncident = (id, payload) => fn_apiRequest(id ? `${BASE}/${id}` : BASE, {
  method: id ? 'PUT' : 'POST',
  body: JSON.stringify(payload),
})

// 선택한 장애와 조회 당시 버전을 보내 일괄 삭제한다.
export const fn_deleteIncidents = rows => fn_apiRequest(BASE, {
  method: 'DELETE',
  body: JSON.stringify(rows.map(({ id, version }) => ({ id, version }))),
})

// 처리 동작에 맞게 조치 내용을 저장하거나 다음 단계로 전환한다.
export const fn_processIncident = (id, command, payload) => fn_apiRequest(`${BASE}/${id}/${command === 'save' ? 'action' : command}`, {
  method: command === 'save' ? 'PUT' : 'POST',
  body: JSON.stringify(payload),
})
