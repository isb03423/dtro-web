<script setup>
import Editor from '@tinymce/tinymce-vue'
import { computed, ref, watch } from 'vue'
import { gfn_getEditorTextLength } from '@/utils/editorText'
import 'tinymce/tinymce'
import 'tinymce/models/dom'
import 'tinymce/icons/default'
import 'tinymce/themes/silver'
import 'tinymce/plugins/autolink'
import 'tinymce/plugins/link'
import 'tinymce/plugins/lists'
import 'tinymce/plugins/table'
import 'tinymce/plugins/code'
import 'tinymce/skins/ui/oxide/skin.min.css'
import 'tinymce-i18n/langs7/ko_KR'

const props = defineProps({
  modelValue: { type: String, required: true },
  placeholder: { type: String, default: '' },
  editable: { type: Boolean, default: true },
  showToolbar: { type: Boolean, default: true },
  minHeight: { type: String, default: null },
  maxHeight: { type: String, default: null },
  maxlength: { type: Number, default: 65000 },
})
const emit = defineEmits(['update:modelValue'])
const editor = ref(null)
const lastAcceptedHtml = ref(props.modelValue)

const updateContent = html => {
  if (props.maxlength != null && gfn_getEditorTextLength(html) > props.maxlength) {
    editor.value?.setContent(lastAcceptedHtml.value)
    return
  }

  lastAcceptedHtml.value = html
  emit('update:modelValue', html)
}

watch(() => props.modelValue, value => {
  lastAcceptedHtml.value = value
})
const height = computed(() => Number.parseInt(props.minHeight, 10) || 300)
const init = computed(() => ({
  height: height.value,
  menubar: false,
  branding: false,
  promotion: false,
  license_key: 'gpl',
  skin: false,
  language: 'ko_KR',
  plugins: 'autolink link lists table code',
  toolbar: props.showToolbar && props.editable
    ? 'undo redo | blocks | bold italic underline | alignleft aligncenter alignright | bullist numlist | link table | code'
    : false,
  readonly: !props.editable,
  placeholder: props.placeholder,
  content_css: false,
  content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; color: #223047; }',
  resize: true,
  min_height: height.value,
  max_height: Number.parseInt(props.maxHeight, 10) || undefined,
  setup: instance => { editor.value = instance },
}))

defineExpose({
  editor,
  getContentForSave: () => editor.value?.getContent() || props.modelValue,
  insertContent: content => editor.value?.insertContent(content),
  insertText: text => editor.value?.insertContent(editor.value.dom.encode(text)),
})
</script>

<template>
  <Editor
    :model-value="modelValue"
    :init="init"
    :disabled="!editable"
    @update:model-value="updateContent"
  />
</template>
