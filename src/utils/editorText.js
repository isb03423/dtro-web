// HTML 마크업과 엔티티를 제외하고 화면에 입력된 문자만 센다.
export const gfn_getEditorTextLength = html => {
  if (!html) {
    return 0
  }

  const document = new DOMParser().parseFromString(html, 'text/html')

  return Array.from(document.body.textContent || '').length
}

// 이전 서식 편집기로 저장한 답변은 줄바꿈을 보존해 일반 텍스트로 읽는다.
export const gfn_getEditorPlainText = value => {
  if (!value) {
    return ''
  }

  if (!/<\/?(?:p|div|br|li|ul|ol|h[1-6]|blockquote|pre|span|strong|em|[biua]|table|tr|td|th|img)\b[^>]*>/i.test(value)) {
    return value
  }

  const document = new DOMParser().parseFromString(value, 'text/html')

  document.querySelectorAll('script, style, template, noscript').forEach(node => node.remove())
  document.querySelectorAll('br').forEach(node => node.replaceWith(document.createTextNode('\n')))
  document.querySelectorAll('img').forEach(node => {
    const alt = node.getAttribute('alt')

    node.replaceWith(document.createTextNode(alt ? `[이미지: ${alt}]` : '[이미지]'))
  })
  document.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre, tr').forEach(node => {
    node.appendChild(document.createTextNode('\n'))
  })

  return (document.body.textContent || '').replaceAll('\u00a0', ' ').replace(/\n{3,}/g, '\n\n').trimEnd()
}
