import { fn_apiRequest } from '@/api/http'

const BASE = '/api/v1/resources'

export const fn_listResources = async filters => {
  const params = new URLSearchParams(
    Object.entries(filters || {}).filter(([, value]) => value !== '' && value != null),
  )
  const query = params.toString()
  const response = await fn_apiRequest(`${BASE}${query ? `?${query}` : ''}`, { cache: 'no-store' })

  return {
    ...response,
    totalPages: response.totalPage ?? response.totalPages ?? 0,
  }
}

export const fn_getResource = id => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`)

export const fn_createResource = (payload, files = []) => {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  for (const file of files) formData.append('files', file)
  return fn_apiRequest(BASE, { method: 'POST', body: formData })
}

export const fn_updateResource = (id, payload, files = []) => {
  const formData = new FormData()
  formData.append('data', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
  for (const file of files) formData.append('files', file)
  return fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`, { method: 'PUT', body: formData })
}

export const fn_deleteResource = id => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
  method: 'DELETE',
})

export const fn_deleteResources = async ids => {
  // 배포된 API가 bulk 삭제 경로를 제공하지 않아도 기존 단건 삭제 API로 처리한다.
  for (const id of ids) {
    await fn_deleteResource(id)
  }
  return ids.length
}

export const fn_updateResourcesPublicYn = async (ids, publicYn) => {
  try {
    return await fn_apiRequest(`${BASE}/bulk-public`, {
      method: 'PATCH',
      body: JSON.stringify({ ids, publicYn }),
    })
  } catch (error) {
    // 구버전 API 서버에는 일괄 변경 경로가 없으므로 기존 상세·수정 API로 처리한다.
    if (![404, 405].includes(error.status)) throw error
    for (const id of ids) {
      const resource = await fn_getResource(id)
      await fn_updateResource(id, {
        title: resource.title,
        content: resource.content,
        publicYn,
      })
    }
    return ids.length
  }
}
