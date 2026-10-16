<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  type: { type: String, default: 'info' },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  confirmText: { type: String, default: '확인' },
  cancelText: { type: String, default: '취소' },
  showCancel: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])
const icon = computed(() => ({ confirm: '?', error: '×', info: 'i', success: '✓', warning: '!' })[props.type] || 'i')
const close = () => { emit('cancel'); emit('update:modelValue', false) }
const confirm = () => { emit('confirm'); emit('update:modelValue', false) }
</script>

<template>
  <VDialog :model-value="modelValue" max-width="350" @update:model-value="value => { if (!value) close() }">
    <VCard class="app-message-dialog" rounded="lg" elevation="0">
      <div class="app-message-dialog__icon" :class="`app-message-dialog__icon--${type}`" aria-hidden="true">{{ icon }}</div>
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="app-message-dialog__actions">
        <button v-if="showCancel" type="button" class="app-message-dialog__button app-message-dialog__button--cancel" @click="close">{{ cancelText }}</button>
        <button type="button" class="app-message-dialog__button app-message-dialog__button--confirm" @click="confirm">{{ confirmText }}</button>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped>
.app-message-dialog { box-sizing: border-box; padding: 32px 22px 22px; border: 1px solid #d9e4f0; background: #fff; color: #1d3453; text-align: center; }
.app-message-dialog__icon { display: grid; width: 44px; height: 44px; place-items: center; margin: 0 auto 12px; border-radius: 50%; font-size: 27px; font-weight: 500; line-height: 1; }
.app-message-dialog__icon--confirm { background: #edf5ff; color: #0877d8; }
.app-message-dialog__icon--error { background: #fff0f0; color: #ef4b50; }
.app-message-dialog__icon--info { background: #eaf5ff; color: #178bde; }
.app-message-dialog__icon--success { background: #eaf8f2; color: #00a773; }
.app-message-dialog__icon--warning { background: #fff5e6; color: #ec9900; }
.app-message-dialog h2 { margin: 0; font-size: 16px; font-weight: 800; }
.app-message-dialog p { min-height: 22px; margin: 10px 0 25px; color: #7c8ba0; font-size: 12px; line-height: 1.5; }
.app-message-dialog__actions { display: flex; gap: 10px; }
.app-message-dialog__button { min-height: 38px; flex: 1; border: 1px solid transparent; border-radius: 6px; cursor: pointer; font: inherit; font-size: 12px; font-weight: 700; }
.app-message-dialog__button--cancel { border-color: #dce5ef; background: #f1f4f8; color: #4b5e72; }
.app-message-dialog__button--confirm { background: #0868b8; color: #fff; }
.app-message-dialog__button:focus-visible { outline: 3px solid #7ab9f4; outline-offset: 2px; }
</style>
