import { fn_apiRequest } from './http'

const BASE = '/api/members'

export const fn_registerMember = payload => fn_apiRequest(BASE, {
  method: 'POST',
  body: JSON.stringify(payload),
})

export const fn_fetchMemberProfile = () => fn_apiRequest(`${BASE}/me`)

export const fn_updateMemberProfile = payload => fn_apiRequest(`${BASE}/me`, {
  method: 'PUT',
  body: JSON.stringify(payload),
})

export const fn_changeMemberPassword = payload => fn_apiRequest(`${BASE}/me/password`, {
  method: 'PUT',
  body: JSON.stringify(payload),
})
