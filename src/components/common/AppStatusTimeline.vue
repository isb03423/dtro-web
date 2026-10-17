<script setup>
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDateTime } from '@/utils/date'

const props = defineProps({
  histories: { type: Array, default: () => [] },
  statuses: { type: Array, default: () => [] },
  titles: { type: Object, default: () => ({}) },
  initialTitle: { type: String, default: '최초 등록' },
  recordLabel: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['retry'])

// 화면에서 전달한 상태·전환별 문구로 이력 제목을 표시한다.
const fn_historyTitle = history => {
  if (!history.previousStatus) {
    return props.initialTitle
  }

  return props.titles[`${history.previousStatus}->${history.newStatus}`]
    || props.titles[history.newStatus]
    || gfn_getLabel(props.statuses, history.newStatus)
}
</script>

<template>
  <section class="app-status-timeline" aria-label="처리 이력">
    <header>
      <h3>처리 이력</h3>
      <span v-if="!loading && !error">{{ histories.length }}건 · 최신순</span>
    </header>
    <p v-if="loading" class="app-status-timeline__muted" role="status">처리 이력을 불러오는 중입니다.</p>
    <p v-else-if="error" class="app-status-timeline__error" role="alert">
      {{ error }} <button type="button" @click="$emit('retry')">다시 시도</button>
    </p>
    <p v-else-if="!histories.length" class="app-status-timeline__muted">등록된 이력이 없습니다.</p>
    <ol v-else>
      <li v-for="history in histories" :key="history.id">
        <strong>{{ fn_historyTitle(history) }}</strong>
        <p class="app-status-timeline__meta">
          {{ gfn_formatDateTime(history.changedAt) }}<br />{{ history.changedByName || '—' }}
        </p>
        <span class="app-status-timeline__transition">
          {{ history.previousStatus ? gfn_getLabel(statuses, history.previousStatus) : '최초 등록' }}
          → {{ gfn_getLabel(statuses, history.newStatus) }}
        </span>
        <p v-if="history.reason && history.reason !== fn_historyTitle(history)" class="app-status-timeline__reason">
          {{ history.reason }}
        </p>
        <details>
          <summary>내용·기록 정보</summary>
          <p class="app-status-timeline__snapshot">{{ history.actionDetail || '당시 기록된 내용 없음' }}</p>
          <small>이력번호 {{ history.id }}<template v-if="recordLabel"> · {{ recordLabel }}</template></small>
        </details>
      </li>
    </ol>
  </section>
</template>
