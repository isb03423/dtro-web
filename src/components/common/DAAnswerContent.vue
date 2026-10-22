<script setup>
import { computed } from 'vue'
import { gfn_getEditorPlainText } from '@/utils/editorText'

const props = defineProps({
  modelValue: { type: String, default: '' },
})

const text = computed(() => gfn_getEditorPlainText(props.modelValue))
</script>

<template>
  <div class="da-answer-content" role="note" aria-label="답변 내용">{{ text }}</div>
</template>

<style scoped>
.da-answer-content {
  padding: 16px 18px;
  border-radius: 8px;
  background: #edf4fb;
  color: #263241;
  line-height: 1.8;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

@media (max-width: 600px) {
  .da-answer-content { padding: 14px 16px; }
}
</style>
