import dayjs from 'dayjs'

/**
 * 날짜를 지정한 형식으로 반환
 *
 * @param {string|Date} value - 날짜
 * @param {string} format - 출력 형식
 */
export const gfn_formatDate = (value, format = 'YYYY-MM-DD') => {
  if (!value) {
    return '-'
  }

  const date = dayjs(value)

  return date.isValid() ? date.format(format) : ''
}

// 시간대가 포함된 일시를 지정한 시간대의 초 단위 문자열로 표시한다.
export const gfn_formatDateTime = (value, timeZone = 'Asia/Seoul') => {
  if (!value) {
    return '—'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(date)
}

// 일시를 datetime-local 입력에서 사용하는 분 단위 값으로 바꾼다.
export const gfn_formatDateTimeInput = (value, timeZone = 'Asia/Seoul') =>
  gfn_formatDateTime(value, timeZone).replace(' ', 'T').slice(0, 16)
