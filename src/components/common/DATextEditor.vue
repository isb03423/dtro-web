<script setup>
import TinyMCEEditor from '@core/components/TinyMCEEditor.vue'
import { computed, shallowRef } from 'vue'
import { gfn_getEditorTextLength } from '@/utils/editorText'

const props = defineProps({
  modelValue: { type: String, required: true },
  placeholder: { type: String, default: '' },
  editable: { type: Boolean, default: true },
  focusable: { type: Boolean, default: true },
  showToolbar: { type: Boolean, default: true },
  minHeight: { type: String, default: null },
  maxHeight: { type: String, default: null },
  maxlength: { type: Number, default: 65000 },
})

const emit = defineEmits(['update:modelValue'])
const editorRef = shallowRef(null)
const currentLength = computed(() => gfn_getEditorTextLength(props.modelValue))
const isOverLimit = computed(() => props.maxlength != null && currentLength.value > props.maxlength)

defineExpose({
  editor: computed(() => editorRef.value?.editor),
  getContentForSave: () => editorRef.value?.getContentForSave?.() ?? props.modelValue,
  insertContent: content => editorRef.value?.insertContent?.(content),
  insertText: text => editorRef.value?.insertText?.(text),
  isOverLimit,
  currentLength,
})
</script>

<template>
  <TinyMCEEditor
    ref="editorRef"
    :model-value="modelValue"
    :placeholder="placeholder"
    :editable="editable"
    :focusable="focusable"
    :show-toolbar="editable && showToolbar"
    :min-height="minHeight"
    :max-height="maxHeight"
    :maxlength="maxlength"
    @update:model-value="emit('update:modelValue', $event)"
  />
  <div v-if="editable" class="d-flex justify-end mt-1 me-1 text-caption" :class="isOverLimit ? 'text-error' : 'text-grey'">
    {{ currentLength.toLocaleString() }}<template v-if="maxlength != null"> / {{ maxlength.toLocaleString() }}</template>
  </div>
</template>
