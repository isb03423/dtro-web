<script setup>
const props = defineProps({
  fields: { type: Array, required: true },
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue', 'search', 'reset', 'pick'])

// 입력값을 해당 검색 필드에 반영한다.
const fn_updateValue = (field, value) => {
  // 기존 필드는 유지하고 현재 필드의 값만 바꿔 v-model로 전달한다.
  emit('update:modelValue', {
    ...props.modelValue,
    [field.key]: field.trim ? String(value).trim() : value,
  })
}

// HTML select 값은 문자열이므로 options에 정의된 원래 타입(예: boolean)으로 복원한다.
const fn_updateSelectValue = (field, value) => {
  const option = (field.options ?? []).find(item => String(item.value) === value)

  fn_updateValue(field, option ? option.value : value)
}

// 부모 화면에 검색 요청을 전달한다.
const fn_search = () => emit('search')

// 부모 화면에 검색 조건 초기화를 요청한다.
const fn_reset = () => emit('reset')
</script>

<template>
  <!-- fields 설정에 따라 선택 상자와 입력창을 공통으로 그린다. -->
  <form
    class="app-search-condition"
    :class="{
      'app-search-condition--two-fields': fields.length === 2,
      'app-search-condition--three-fields': fields.length === 3,
    }"
    :style="{ '--field-count': fields.length }"
    @submit.prevent="fn_search"
  >
    <label
      v-for="field in fields"
      :key="field.key"
      :class="{ 'app-search-condition__wide': field.wide }"
    >
      <span>{{ field.label }}</span>
      <select
        v-if="field.type === 'select'"
        :value="modelValue[field.key] == null ? '' : String(modelValue[field.key])"
        @change="fn_updateSelectValue(field, $event.target.value)"
      >
        <option value="">{{ field.emptyLabel ?? '전체' }}</option>
        <option v-for="option in field.options ?? []" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
      <button
        v-else-if="field.type === 'picker'"
        class="app-search-condition__picker"
        type="button"
        :aria-label="`${field.label}: ${modelValue[field.key] || field.placeholder || '선택'}`"
        @click="emit('pick', field.key)"
      >
        <span :class="{ 'app-search-condition__placeholder': !modelValue[field.key] }">
          {{ modelValue[field.key] || field.placeholder || '선택' }}
        </span>
        <VIcon icon="bx-search" aria-hidden="true" />
      </button>
      <input
        v-else
        :type="field.type ?? 'text'"
        :value="modelValue[field.key] ?? ''"
        :placeholder="field.placeholder"
        @input="fn_updateValue(field, $event.target.value)"
      >
    </label>
    <button class="app-search-condition__button app-search-condition__button--primary" type="submit">검색</button>
    <button class="app-search-condition__button" type="button" @click="fn_reset">초기화</button>
  </form>
</template>

<style scoped>
.app-search-condition {
  display: grid;
  align-items: end;
  gap: 12px;
  grid-template-columns: repeat(var(--field-count), minmax(120px, 1fr)) auto auto;
}
.app-search-condition--two-fields {
  grid-template-columns: minmax(120px, 1fr) minmax(180px, 2fr) auto auto;
}
.app-search-condition--three-fields {
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) minmax(200px, 1.6fr) auto auto;
}
.app-search-condition label { display: flex; min-inline-size: 0; flex-direction: column; gap: 8px; }
.app-search-condition label > span { color: #263241; font-size: 15px; font-weight: 400; }
.app-search-condition input,
.app-search-condition select,
.app-search-condition__picker {
  box-sizing: border-box;
  inline-size: 100%;
  min-inline-size: 0;
  block-size: 40px;
  padding: 6px 10px;
  border: 1px solid #d7deea;
  border-radius: 4px;
  background: #fff;
  color: #263241;
  font: inherit;
  font-size: 15px;
}
.app-search-condition__picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  text-align: start;
}
.app-search-condition__picker span {
  min-inline-size: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.app-search-condition__picker .v-icon { flex: none; color: #064984; }
.app-search-condition__placeholder { color: #738092; }
.app-search-condition input::placeholder { color: #738092; }
.app-search-condition__button {
  display: inline-flex;
  min-inline-size: 110px;
  block-size: 40px;
  align-items: center;
  justify-content: center;
  padding-inline: 16px;
  border: 1px solid #d7deea;
  border-radius: 4px;
  background: #fff;
  color: #243041;
  cursor: pointer;
  font: inherit;
  font-size: 15px;
  font-weight: 400;
}

.app-search-condition__button--primary { border-color: #064984; background: #064984; color: #fff; }
.app-search-condition__button:hover:not(:disabled) { filter: brightness(.95); }
.app-search-condition :is(button, input, select):focus-visible { outline: 3px solid #79b8f4; outline-offset: 2px; }

@media (max-width: 900px) {
  .app-search-condition,
  .app-search-condition--two-fields,
  .app-search-condition--three-fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .app-search-condition__wide { grid-column: 1 / -1; }
}

@media (max-width: 600px) {
  .app-search-condition,
  .app-search-condition--two-fields,
  .app-search-condition--three-fields { grid-template-columns: 1fr; }
  .app-search-condition__wide { grid-column: auto; }
  .app-search-condition :is(input, select, .app-search-condition__picker) { block-size: 44px; font-size: 16px; }
  .app-search-condition__button { inline-size: 100%; block-size: 44px; }
}
</style>
