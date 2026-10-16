// 지정한 필수 필드의 빈 값을 검사해 필드별 오류를 반환한다.
export const gfn_validateRequiredFields = (values, fields) =>
  Object.fromEntries(
    fields
      .filter(field => !String(values[field] ?? '').trim())
      .map(field => [field, '필수 항목입니다.']),
  )
