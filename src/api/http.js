// 응답 본문을 읽고 실패한 요청은 오류로 변환한다.
const fn_readJson = async response => {
  // 오류 응답이 JSON이 아니어도 기본 오류 메시지를 표시할 수 있게 한다.
  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error(body?.message || '요청을 처리하지 못했습니다.')

    error.status = response.status
    error.code = body?.code
    error.details = body?.errors ?? []
    throw error
  }
  
  // API 공통 응답의 data만 꺼내되 일반 응답도 그대로 받는다.
  return body?.data ?? body
}

// 변경 요청에 필요한 CSRF 토큰을 서버와 쿠키에서 가져온다.
export const fn_getCsrf = async () => {
  const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' })
  const csrf = await fn_readJson(response)

  // 서버가 쿠키에 저장한 토큰 값을 요청 헤더에 다시 넣어야 한다.
  const cookie = document.cookie.split(';').map(part => part.trim()).find(part => part.startsWith('XSRF-TOKEN='))
  if (!cookie) {
    throw new Error('보안 토큰을 확인하지 못했습니다. 페이지를 새로고침해 주세요.')
  }

  return { ...csrf, token: decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) }
}

// 공통 헤더와 인증 쿠키를 적용해 API 요청을 보낸다.
export const fn_apiRequest = async (path, options = {}) => {
  const method = options.method ?? 'GET'
  const headers = new Headers(options.headers)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  if (options.body && !isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  // 서버 데이터가 바뀌는 요청에만 CSRF 토큰을 붙인다.
  if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
    const csrf = await fn_getCsrf()

    headers.set(csrf.headerName, csrf.token)
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers,
    credentials: 'same-origin',
  })

  // 204 응답에는 읽을 본문이 없다.
  if (response.status === 204) {
    return null
  }
  
  return fn_readJson(response)
}
