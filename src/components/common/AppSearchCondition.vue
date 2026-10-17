<script setup>
const props = defineProps({
  fields: { type: Array, required: true },
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue', 'search', 'reset'])

// 입력값을 해당 검색 필드에 반영한다.
const fn_updateValue = (field, value) => {
  // 기존 필드는 유지하고 현재 필드의 값만 바꿔 v-model로 전달한다.
  emit('update:modelValue', {
    ...props.modelValue,
    [field.key]: field.trim ? String(value).trim() : value,
  })
}

// 부모 화면에 검색 요청을 전달한다.
const fn_search = () => emit('search')

// 부모 화면에 검색 조건 초기화를 요청한다.
const fn_reset = () => emit('reset')
</script>

<template>
  <!-- fields 설정에 따라 선택 상자와 입력창을 공통으로 그린다. -->
  <form class="app-search-condition" :style="{ '--field-count': fields.length }" @submit.prevent="fn_search">
    <label v-for="field in fields" :key="field.key" :class="{ 'app-search-condition__wide': field.wide }">
      <span>{{ field.label }}</span>
      <select
        v-if="field.type === 'select'"
        :value="modelValue[field.key] ?? ''"
        @change="fn_updateValue(field, $event.target.value)"
      >
        <option value="">{{ field.emptyLabel ?? '전체' }}</option>
        <option v-for="option in field.options ?? []" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
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
  padding: 20px;
  border-radius: 6px;
  background: #fff;
  gap: 16px;
  grid-template-columns: repeat(var(--field-count), minmax(170px, 1fr)) repeat(2, minmax(110px, 150px));
}

.app-search-condition label { display: flex; min-inline-size: 0; flex-direction: column; gap: 8px; }
.app-search-condition label span { color: #263241; font-size: 15px; font-weight: 700; }
.app-search-condition input,
.app-search-condition select {
  inline-size: 100%;
  min-inline-size: 0;
  block-size: 44px;
  padding-inline: 12px;
  border: 1px solid #d7deea;
  border-radius: 4px;
  background: #fff;
  color: #263241;
  font: inherit;
  font-size: 15px;
}

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
  font-weight: 700;
}

.app-search-condition__button--primary { border-color: #064984; background: #064984; color: #fff; }
.app-search-condition__button:hover:not(:disabled) { filter: brightness(.95); }
.app-search-condition :is(button, input, select):focus-visible { outline: 3px solid #79b8f4; outline-offset: 2px; }

@media (max-width: 1300px) {
  .app-search-condition { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .app-search-condition__wide { grid-column: 1 / -1; }
}

@media (max-width: 600px) {
  .app-search-condition { grid-template-columns: 1fr; padding: 16px; gap: 14px; }
  .app-search-condition__wide { grid-column: auto; }
  .app-search-condition :is(input, select) { block-size: 48px; font-size: 16px; }
  .app-search-condition__button { inline-size: 100%; block-size: 44px; }
}
</style>
