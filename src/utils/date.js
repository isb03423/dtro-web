import dayjs from 'dayjs'

/**
 * 날짜를 지정한 형식으로 반환
 *
 * @param {string|Date} value - 날짜
 * @param {string} format - 출력 형식
 */
export const gfn_formatDate = (value, format = 'YYYY-MM-DD') => {
  if (!value) return '-'

  const date = dayjs(value)

  return date.isValid() ? date.format(format) : ''
}