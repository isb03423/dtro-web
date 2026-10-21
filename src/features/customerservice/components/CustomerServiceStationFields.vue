<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import { fn_apiRequest } from '@/api/http'
import { gfn_useMessageDialog } from '@/composables/useMessageDialog'

const props = defineProps({
  modelValue: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  required: { type: Boolean, default: true },
  error: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const { dialog, showMessage, finishDialog } = gfn_useMessageDialog()
const lines = ref([])
const line = ref('')
const stations = ref([])
const loading = ref(false)
const loadError = ref('')
let requestId = 0
const base = '/api/customer-service-options'
const fn_stations = code => fn_apiRequest(`${base}/stations?lineCode=${encodeURIComponent(code)}`)

// 노선 변경 즉시 이전 역을 지우고 늦게 도착한 응답은 무시한다.
const fn_changeLine = async () => {
  const id = ++requestId
  emit('update:modelValue', '')
  stations.value = []
  loadError.value = ''
  loading.value = Boolean(line.value)
  if (!line.value) return
  try {
    const rows = await fn_stations(line.value)

    if (id === requestId) stations.value = rows
  } catch (cause) {
    if (id === requestId) loadError.value = cause.message
  } finally {
    if (id === requestId) loading.value = false
  }
}

const fn_guardStation = event => {
  if (props.disabled || line.value) return
  if (event.type === 'keydown' && ![' ', 'Enter', 'ArrowDown', 'ArrowUp', 'Home', 'End', 'F4'].includes(event.key) && event.key.length !== 1) return
  event.preventDefault()
  showMessage('info', '안내 사항', '먼저 노선을 선택해주세요.')
}

// 기존 글은 저장된 역 이름으로 노선을 찾아 수정 폼에 표시한다.
const fn_load = async () => {
  const id = ++requestId
  const station = props.modelValue

  loading.value = true
  loadError.value = ''
  try {
    const codes = await fn_apiRequest(`${base}/lines`)
    if (id !== requestId) return
    lines.value = codes
    if (station) {
      const options = await Promise.all(codes.map(async code => ({ code, rows: await fn_stations(code) })))
      if (id !== requestId || props.modelValue !== station) return
      const match = options.find(option => option.rows.some(row => row.stationName === station))

      line.value = match?.code ?? ''
      stations.value = match?.rows ?? []
      // 기존 자유 입력 역 이름도 수정 화면에서 확인할 수 있게 보존한다.
      if (!match) stations.value = [{ stationCode: 'legacy', stationName: station }]
    }
  } catch (cause) {
    if (id === requestId) loadError.value = cause.message
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(() => props.modelValue, (value, previous) => {
  if (value && value !== previous && !stations.value.some(row => row.stationName === value)) fn_load()
})
onMounted(fn_load)
onBeforeUnmount(() => { requestId += 1 })
</script>

<template>
  <label>
    <span>노선<template v-if="required"> *</template></span>
    <select v-model="line" :disabled="disabled || loading" aria-label="노선" @change="fn_changeLine">
      <option value="">노선을 선택하세요</option>
      <option v-for="code in lines" :key="code" :value="code">{{ code }}호선</option>
    </select>
    <small v-if="loadError" role="alert">{{ loadError }} <button type="button" :disabled="disabled || loading" @click="line ? fn_changeLine() : fn_load()">다시 시도</button></small>
  </label>
  <label>
    <span>역 이름<template v-if="required"> *</template></span>
    <select
      :value="modelValue"
      :disabled="disabled || loading"
      :aria-invalid="Boolean(error)"
      aria-label="역 이름"
      @pointerdown="fn_guardStation"
      @click="fn_guardStation"
      @keydown="fn_guardStation"
      @change="event => emit('update:modelValue', line ? event.target.value : '')"
    >
      <option value="">{{ loading ? '불러오는 중...' : '역을 선택하세요' }}</option>
      <option v-for="station in stations" :key="station.stationCode" :value="station.stationName">{{ station.stationName }}</option>
    </select>
    <small v-if="error" role="alert">{{ error }}</small>
  </label>
  <AppMessageDialog
    :model-value="dialog.open"
    :type="dialog.type"
    :title="dialog.title"
    :message="dialog.message"
    @confirm="finishDialog(true)"
    @cancel="finishDialog(false)"
  />
</template>
