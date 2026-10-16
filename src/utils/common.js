/**
 * 상수 목록에서 value에 대응하는 label 반환
 *
 * @param {Array} options - 상수 목록
 * @param {*} value - 조회할 값
 */
export const gfn_getLabel = (options, value = '-') =>
  options.find(item => item.value === value)?.label ?? value