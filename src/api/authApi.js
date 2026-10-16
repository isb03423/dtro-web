import { fn_apiRequest } from './http'

// 현재 로그인한 사용자 정보를 조회한다.
export const fn_fetchCurrentUser = () => fn_apiRequest('/api/auth/me')

// 아이디와 비밀번호로 로그인한 뒤 사용자 정보를 가져온다.
export const fn_loginUser = async (userid, password) => {
  // Spring Security의 로그인 주소는 JSON 대신 폼 형식 값을 받는다.
  const body = new URLSearchParams({ userid, password })

  await fn_apiRequest('/api/auth/login', {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  
  // 로그인 성공 응답에는 사용자 정보가 없으므로 별도로 조회한다.
  return fn_fetchCurrentUser()
}

// 서버의 로그인 세션을 종료한다.
export const fn_logoutUser = () => fn_apiRequest('/api/auth/logout', { method: 'POST' })
