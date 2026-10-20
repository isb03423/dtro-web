import { fn_apiRequest } from '@/api/http'

const BASE = '/api/admin/members'

export const fn_listAdminMembers = ({ keyword, role, enabled, page, size, sort }) => {
  const query = new URLSearchParams({ page: String(page), size: String(size), sort })
  if (keyword) {
    query.set('keyword', keyword)
  }
  if (role) {
    query.set('role', role)
  }
  if (enabled !== '') {
    query.set('enabled', enabled)
  }

  return fn_apiRequest(`${BASE}?${query}`)
}

export const fn_updateAdminMember = (id, payload) => fn_apiRequest(`${BASE}/${id}`, {
  method: 'PUT',
  body: JSON.stringify(payload),
})

export const fn_createAdminMember = payload => fn_apiRequest(BASE, {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const fn_resetAdminMemberPassword = id => fn_apiRequest(`${BASE}/${id}/password-reset`, {
  method: 'POST',
})
