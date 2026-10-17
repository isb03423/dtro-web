<script setup>
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import AppStatusTimeline from '@/components/common/AppStatusTimeline.vue'
import { gfn_useMessageDialog } from '@/composables/useMessageDialog'
import { fn_getIncident, fn_getIncidentHistory, fn_processIncident } from '@/features/incident/api/incidentApi'
import { INCIDENT_HISTORY_TITLES, INCIDENT_STATUSES } from '@/features/incident/constants/incidentOptions'
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDateTime } from '@/utils/date'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute } from 'vue-router'

const props = defineProps({
  incidentId: {
    type: Number,
    default: null
  },
  popup: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])
const route = useRoute()

const successMessages = {
  check: '장애 확인을 시작했습니다.',
  start: '조치를 시작했습니다.',
  verify: '복구 확인을 시작했습니다.',
  resume: '추가 조치를 시작했습니다.',
  complete: '조치를 완료했습니다.',
  save: '조치 내용을 저장했습니다.'
}

const {
  dialog,
  finishDialog,
  showMessage,
  askConfirm
} = gfn_useMessageDialog()

const incident = ref(null)
const histories = ref([])
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const historyLoading = ref(false)
const historyError = ref('')
const actionDetail = ref('')
const reason = ref('')
let requestId = 0
let historyRequest = 0
const activeId = computed(() => props.incidentId ?? route.params.incidentId)
const canEditAction = computed(() => ['CHECKING', 'IN_PROGRESS', 'VERIFYING'].includes(incident.value?.status))

const nextAction = computed(() => ({
  RECEIVED: {
    command: 'check',
    label: '확인 시작'
  },
  CHECKING: {
    command: 'start',
    label: '조치 시작'
  },
  IN_PROGRESS: {
    command: 'verify',
    label: '복구 확인 시작'
  },
  VERIFYING: {
    command: 'complete',
    label: '완료 처리'
  }
})[incident.value?.status])

const stageHelp = computed(() => ({
  RECEIVED: '접수 내용을 확인한 뒤 확인 시작을 눌러주세요.',
  CHECKING: '현장 확인 내용을 기록하고 조치 시작을 눌러주세요.',
  IN_PROGRESS: '조치 내용을 기록하고 복구 확인 시작을 눌러주세요.',
  VERIFYING: '복구 결과를 확인한 뒤 완료 처리하세요. 문제가 남아 있으면 추가 조치로 돌아갈 수 있습니다.',
  COMPLETED: '조치가 완료되었습니다. 조치 내용은 조회만 가능합니다.'
})[incident.value?.status] || '')

const dirty = computed(() => Boolean(incident.value) && (actionDetail.value !== (incident.value.actionDetail || '') || Boolean(reason.value.trim())))

// 저장하지 않은 변경사항을 버릴지 확인한다.
const fn_mayDiscard = async () => !saving.value && (!dirty.value || (await askConfirm('변경사항을 버리시겠습니까?', '저장하지 않은 조치 내용과 메모가 사라집니다.')))

// 현재 검색 조건으로 조회하고 최신 요청 결과만 반영한다.
const fn_load = async () => {
  const current = ++requestId

  ++historyRequest
  loading.value = true
  error.value = ''
  try {
    const data = await fn_getIncident(activeId.value)
    if (current !== requestId) {
      return
    }
    incident.value = data
    actionDetail.value = data.actionDetail || ''
    reason.value = ''
    histories.value = []
    await fn_loadHistory()
  } catch (cause) {
    if (current === requestId) {
      incident.value = null
      error.value = cause.message
    }
  } finally {
    if (current === requestId) {
      loading.value = false
    }
  }
}

// 장애의 처리 이력을 조회하고 최신 요청 결과만 반영한다.
const fn_loadHistory = async () => {
  const current = ++historyRequest
  const id = incident.value.id

  historyLoading.value = true
  historyError.value = ''
  try {
    const data = await fn_getIncidentHistory(id)
    if (current === historyRequest) {
      histories.value = data
    }
  } catch (cause) {
    if (current === historyRequest) {
      historyError.value = cause.message
    }
  } finally {
    if (current === historyRequest) {
      historyLoading.value = false
    }
  }
}

// 변경사항을 버릴지 확인하고 상세 정보를 다시 조회한다.
const fn_refresh = async () => {
  if (await fn_mayDiscard()) {
    await fn_load()
  }
}

// 변경사항을 버릴지 확인하고 조치 팝업을 닫는다.
const fn_close = async () => {
  if (await fn_mayDiscard()) {
    emit('close')
  }
}

// 현재 단계의 처리 동작과 조치 내용을 함께 저장한다.
const fn_process = async command => {
  if (saving.value || !incident.value) {
    return
  }
  if (command === 'save' && !canEditAction.value) {
    return
  }
  if (['verify', 'complete'].includes(command) && !actionDetail.value.trim()) {
    showMessage('warning', '입력값을 확인해주세요', '복구 확인 및 완료 처리 전에 조치 내용을 입력해주세요.')

    return
  }
  if (command === 'complete' && !(await askConfirm('조치를 완료하시겠습니까?', '완료 후에는 조치 내용을 변경하거나 장애를 삭제할 수 없습니다.', '조치 완료'))) {
    return
  }
  const id = incident.value.id

  saving.value = true
  try {
    incident.value = await fn_processIncident(id, command, {
      version: incident.value.version,
      actionDetail: actionDetail.value,
      reason: reason.value.trim() || null
    })
    actionDetail.value = incident.value.actionDetail || ''
    if (command !== 'save') {
      reason.value = ''
    }
    await fn_loadHistory()
    showMessage('success', '처리가 완료되었습니다', successMessages[command])
  } catch (cause) {
    showMessage('error', '처리하지 못했습니다', cause.message)
  } finally {
    saving.value = false
  }
}

onBeforeRouteLeave(fn_mayDiscard)

onBeforeRouteUpdate(fn_mayDiscard)

watch(activeId, fn_load, {
  immediate: true
})

onBeforeUnmount(() => {
  ++requestId
  ++historyRequest
})
</script>

<template>
  <div class="train-page incident-page" :class="{ 'incident-action-popup': popup }">
    <header class="incident-intro train-page__intro">
      <div>
        <h2>운행 장애 조치 상세</h2>
        <p>접수 내용과 처리 이력을 확인하고 조치를 진행합니다.</p>
      </div>
      <div class="incident-actions">
        <button type="button" class="train-button" :disabled="loading || saving" @click="fn_refresh">새로 조회</button>
        <button v-if="popup" type="button" class="train-button" :disabled="saving" @click="fn_close">닫기</button>
        <RouterLink
          v-else
          to="/incidents/actions"
          class="train-button"
          :aria-disabled="saving"
          @click="event => {
            if (saving) {
              event.preventDefault()
            }
          }"
        >
          목록
        </RouterLink>
      </div>
    </header>
    <div v-if="loading" class="incident-state" role="status">장애 내용을 불러오는 중입니다.</div>
    <div v-else-if="error" class="incident-state incident-error" role="alert">
      {{ error }}
      <button type="button" @click="fn_load">다시 시도</button>
    </div>
    <div v-else-if="incident" class="incident-detail-layout">
      <div class="incident-detail-main">
        <VCard class="incident-detail-card" elevation="0">
          <header class="incident-panel-heading">
            <h2>장애 접수 내용</h2>
            <span class="incident-muted">읽기 전용</span>
          </header>
          <div class="incident-detail-body">
            <div class="incident-reception-title">
              <span>장애번호 {{ incident.incidentNumber }}</span>
              <h3>{{ incident.incidentType }}</h3>
            </div>
            <dl class="incident-reception-facts">
              <div>
                <dt>운행번호</dt>
                <dd>{{ incident.operationNumber }}</dd>
              </div>
              <div>
                <dt>노선 / 열차</dt>
                <dd>{{ incident.lineCode }}호선 · {{ incident.trainNumber }}</dd>
              </div>
              <div>
                <dt>발생일시</dt>
                <dd>{{ gfn_formatDateTime(incident.occurredAt) }}</dd>
              </div>
              <div>
                <dt>접수자</dt>
                <dd>{{ incident.createdByName || '—' }}</dd>
              </div>
            </dl>
            <section class="incident-impact">
              <h3>영향범위</h3>
              <p class="incident-content">{{ incident.impactDetail }}</p>
            </section>
            <details class="incident-audit">
              <summary>등록·수정 정보</summary>
              <dl>
                <div>
                  <dt>등록자</dt>
                  <dd>{{ incident.createdByName || '—' }}</dd>
                </div>
                <div>
                  <dt>등록일시</dt>
                  <dd>{{ gfn_formatDateTime(incident.createdAt) }}</dd>
                </div>
                <div>
                  <dt>수정자</dt>
                  <dd>{{ incident.updatedByName || '—' }}</dd>
                </div>
                <div>
                  <dt>수정일시</dt>
                  <dd>{{ gfn_formatDateTime(incident.updatedAt) }}</dd>
                </div>
              </dl>
            </details>
          </div>
        </VCard>
        <VCard class="incident-detail-card" elevation="0">
          <header class="incident-panel-heading">
            <h2>조치 내용</h2>
          </header>
          <form class="incident-form" @submit.prevent="fn_process('save')">
            <p class="incident-stage-help">{{ stageHelp }}</p>
            <fieldset :disabled="saving">
              <label>
                진행 내용 / 처리 결과
                <textarea
                  v-model="actionDetail"
                  rows="6"
                  :readonly="!canEditAction"
                  :placeholder="incident.status === 'RECEIVED' ? '확인을 시작한 후 입력할 수 있습니다.' : '확인 내용과 조치 결과를 입력해주세요.'"
                />
              </label>
              <label v-if="nextAction">
                상태 변경 메모 · 선택
                <input v-model="reason" maxlength="500" placeholder="필요한 경우에만 입력하세요" />
                <span class="incident-muted">단계 변경 시 이력에 남습니다. 비워두면 처리 동작이 자동으로 기록됩니다.</span>
              </label>
            </fieldset>
            <footer class="incident-form-actions">
              <button
                v-if="canEditAction"
                type="submit"
                class="train-button"
                :disabled="saving || actionDetail === (incident.actionDetail || '')"
              >
                내용 저장
              </button>
              <button
                v-if="incident.status === 'VERIFYING'"
                type="button"
                class="train-button"
                :disabled="saving"
                @click="fn_process('resume')"
              >
                추가 조치
              </button>
              <button
                v-if="nextAction"
                type="button"
                class="train-button train-button--primary"
                :disabled="saving"
                @click="fn_process(nextAction.command)"
              >
                {{ nextAction.label }}
              </button>
            </footer>
          </form>
        </VCard>
      </div>
      <aside class="incident-detail-aside">
        <VCard class="incident-detail-card" elevation="0">
          <div class="incident-detail-body">
            <h3>현재 상태</h3>
            <span class="incident-status" :class="`incident-status--${incident.status}`">
              {{ gfn_getLabel(INCIDENT_STATUSES, incident.status) }}
            </span>
            <ol class="incident-steps" aria-label="장애 처리 단계">
              <li
                v-for="status in INCIDENT_STATUSES"
                :key="status.value"
                :aria-current="status.value === incident.status ? 'step' : undefined"
              >
                {{ status.label }}
              </li>
            </ol>
          </div>
        </VCard>
        <VCard class="incident-detail-card" elevation="0">
          <div class="incident-detail-body">
            <AppStatusTimeline
              :statuses="INCIDENT_STATUSES"
              :titles="INCIDENT_HISTORY_TITLES"
              initial-title="장애 접수"
              :record-label="`장애번호 ${incident.incidentNumber}`"
              :histories="histories"
              :loading="historyLoading"
              :error="historyError"
              @retry="fn_loadHistory"
            />
          </div>
        </VCard>
      </aside>
    </div>
    <AppMessageDialog
      :model-value="dialog.open"
      :type="dialog.type"
      :title="dialog.title"
      :message="dialog.message"
      :show-cancel="dialog.showCancel"
      :confirm-text="dialog.confirmText"
      @confirm="finishDialog(true)"
      @cancel="finishDialog(false)"
    />
  </div>
</template>
