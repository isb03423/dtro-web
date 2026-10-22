import { fn_apiRequest } from '@/api/http'

const BASE = '/api/v1/notices'

export const fn_listNotices = async filters => {
  const params = new URLSearchParams(
    Object.entries(filters || {}).filter(([, value]) => value !== '' && value != null),
  )
  const queryString = params.toString()
  const url = `${BASE}${queryString ? `?${queryString}` : ''}`
  
  const response = await fn_apiRequest(url, { cache: 'no-store' })

  if (!response) {
    return { content: [], page: 0, totalElements: 0, totalPages: 0 }
  }

  return {
    ...response,
    totalPages: response.totalPage ?? response.totalPages ?? 0,
  }
}

export const fn_getNoticeDetail = id => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`)

export const fn_createNotice = payload => fn_apiRequest(BASE, {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const fn_updateNotice = (id, payload) => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
})

export const fn_saveNotice = async (form, isEditMode, id) => {
  if (isEditMode) {
    return await fn_updateNotice(id, form)
  } else {
    return await fn_createNotice(form)
  }
}

export const fn_deleteNotice = id => fn_apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
  method: 'DELETE',
})

export const fn_deleteNotices = async ids => {
  // 배포된 API가 bulk 삭제 경로를 제공하지 않아도 기존 단건 삭제 API로 처리한다.
  for (const id of ids) {
    await fn_deleteNotice(id)
  }
  return ids.length
}

export const fn_updateNoticesPublicYn = async (ids, publicYn) => {
  try {
    return await fn_apiRequest(`${BASE}/bulk-public`, {
      method: 'PATCH',
      body: JSON.stringify({ ids, publicYn }),
    })
  } catch (error) {
    // 구버전 API 서버에는 일괄 변경 경로가 없으므로 기존 상세·수정 API로 처리한다.
    if (![404, 405].includes(error.status)) throw error
    for (const id of ids) {
      const notice = await fn_getNoticeDetail(id)
      await fn_updateNotice(id, {
        title: notice.title,
        content: notice.content,
        importantYn: notice.importantYn,
        publicYn,
      })
    }
    return ids.length
  }
}
