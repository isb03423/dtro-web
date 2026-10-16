// HTML 마크업과 엔티티를 제외하고 화면에 입력된 문자만 센다.
export const gfn_getEditorTextLength = html => {
  if (!html) return 0

  const document = new DOMParser().parseFromString(html, 'text/html')
  return Array.from(document.body.textContent || '').length
}
