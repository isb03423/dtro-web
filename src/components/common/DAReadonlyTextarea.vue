<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
})

// 편집기로 저장한 HTML을 실행하거나 노출하지 않고 읽을 수 있는 텍스트로 표시한다.
const text = computed(() => {
  const document = new DOMParser().parseFromString(props.modelValue || '', 'text/html')

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
})
</script>

<template>
  <textarea
    class="da-readonly-textarea"
    :value="text"
    :aria-label="label"
    rows="10"
    readonly
  />
</template>

<style scoped>
.da-readonly-textarea {
  display: block;
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 0;
  min-block-size: 250px;
  padding: 12px;
  border: 1px solid #d7deea;
  border-radius: 4px;
  background: #f0f2f6;
  color: #263241;
  font: inherit;
  line-height: 1.7;
  resize: vertical;
}
.da-readonly-textarea:focus-visible { outline: 3px solid #79b8f4; outline-offset: 2px; }
@media (max-width: 600px) {
  .da-readonly-textarea { font-size: 16px; }
}
</style>
