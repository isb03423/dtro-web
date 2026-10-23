<script setup>
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppGridSelectDialog from '@/components/common/AppGridSelectDialog.vue'
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import AppSearchCondition from '@/components/common/AppSearchCondition.vue'
import AppStatusTimeline from '@/components/common/AppStatusTimeline.vue'
import { gfn_useGridState } from '@/composables/useGridState'
import { gfn_useMessageDialog } from '@/composables/useMessageDialog'
import {
  fn_deleteIncidents,
  fn_getIncident,
  fn_getIncidentHistory,
  fn_listIncidents,
  fn_saveIncident,
} from '@/features/incident/api/incidentApi'
import {
  INCIDENT_HISTORY_TITLES,
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
} from '@/features/incident/constants/incidentOptions'
import IncidentActionDetail from '@/features/incident/components/IncidentActionDetail.vue'
import { fn_listOperations } from '@/features/trainoperation/api/trainoperationApi'
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDateTime, gfn_formatDateTimeInput } from '@/utils/date'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'

const props = defineProps({
  mode: {
    type: String,
    default: 'reception',
  },
})

const columns = [
  { title: '상세 · 이력', key: 'actions', width: 164, sortable: false },
  { title: '장애번호', key: 'incidentNumber', maxText: 'INC-99999', autoWidth: true },
  { title: '운행번호', key: 'operationNumber', maxText: 'OPS-99999', autoWidth: true },
  { title: '장애유형', key: 'incidentType', maxText: INCIDENT_TYPES, autoWidth: true },
  { title: '발생일시', key: 'occurredAt', maxText: '9999-12-31 23:59:59' },
  { title: '처리상태', key: 'status', maxText: INCIDENT_STATUSES.map(status => status.label), contentPadding: 20 },
  { title: '등록일시', key: 'createdAt', maxText: '9999-12-31 23:59:59' },
  { title: '등록자', key: 'createdByName', autoWidth: true },
  { title: '수정일시', key: 'updatedAt', maxText: '9999-12-31 23:59:59' },
  { title: '수정자', key: 'updatedByName', autoWidth: true },
]

const operationColumns = [
  { title: '운행번호', key: 'operationNumber' },
  { title: '열차번호', key: 'trainNumber' },
  { title: '노선', key: 'lineCode' },
  { title: '출발역', key: 'departureStationName' },
  { title: '도착역', key: 'arrivalStationName' },
]

const searchFields = [
  { key: 'incidentType', label: '장애유형', type: 'select', options: INCIDENT_TYPES.map(type => ({ value: type, label: type })) },
  { key: 'status', label: '처리상태', type: 'select', options: INCIDENT_STATUSES },
  { key: 'operationLabel', label: '운행번호', type: 'picker', placeholder: '운행번호 선택', wide: true },
]

// 검색 조건의 기본값을 만든다.
const fn_emptyFilters = () => ({
  incidentType: '',
  status: '',
  operationId: null,
  operationLabel: '',
})

const { dialog, finishDialog, showMessage, askConfirm } = gfn_useMessageDialog()

const { page, size, sort, gridSort, setGridOptions, resetGridOptions } = gfn_useGridState({
  defaultSort: '',
})

const draftFilters = ref(fn_emptyFilters())
const filters = ref(fn_emptyFilters())
const rows = ref([])
const selected = ref([])
const total = ref(0)
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const actionIncidentId = ref(null)
let listRequest = 0
let detailRequest = 0
let historyRequest = 0
let pickerRequest = 0
const formOpen = ref(false)
const formLoading = ref(false)
const formError = ref('')
const form = ref({})
const originalForm = ref('')

const picker = ref({
  open: false,
  target: '',
  rows: [],
  loading: false,
})

const history = ref({
  open: false,
  id: null,
  incidentNumber: '',
  rows: [],
  loading: false,
  error: '',
})

const isAction = computed(() => props.mode === 'action')
const formDirty = computed(() => formOpen.value && !formLoading.value && fn_formSnapshot() !== originalForm.value)

// 접수 양식의 수정 가능한 값으로 변경 비교값을 만든다.
const fn_formSnapshot = () =>
  JSON.stringify([form.value.operationId, form.value.incidentType, form.value.occurredAt, form.value.impactDetail])

// 현재 검색 조건으로 조회하고 최신 요청 결과만 반영한다.
const fn_load = async () => {
  const current = ++listRequest

  loading.value = true
  loadError.value = ''
  try {
    const data = await fn_listIncidents({
      incidentType: filters.value.incidentType,
      status: filters.value.status,
      operationId: filters.value.operationId,
      page: page.value,
      size: size.value,
      sort: sort.value,
    })

    if (current !== listRequest) {
      return
    }
    rows.value = data.content
    total.value = data.totalElements
    selected.value = []
  } catch (cause) {
    if (current === listRequest) {
      rows.value = []
      total.value = 0
      loadError.value = cause.message
    }
  } finally {
    if (current === listRequest) {
      loading.value = false
    }
  }
}

// 입력한 검색 조건을 반영하고 목록을 다시 조회한다.
const fn_search = () => {
  filters.value = {
    ...draftFilters.value,
  }
  page.value = 0
  fn_load()
}

// 검색 조건을 초기화하고 전체 목록을 조회한다.
const fn_reset = () => {
  filters.value = fn_emptyFilters()
  draftFilters.value = fn_emptyFilters()
  resetGridOptions()
  fn_load()
}

// 그리드의 페이지·정렬 변경을 저장하고 목록을 갱신한다.
const fn_updateGridOptions = options => {
  if (setGridOptions(options)) {
    fn_load()
  }
}

// 저장하지 않은 접수 내용을 확인하고 팝업을 닫는다.
const fn_closeForm = async () => {
  if (saving.value) {
    return false
  }

  if (formDirty.value && !(await askConfirm('변경사항을 버리시겠습니까?', '저장하지 않은 접수 내용이 사라집니다.'))) {
    return false
  }

  ++detailRequest
  formOpen.value = false

  return true
}

// 장애 접수 양식을 초기화하거나 기존 내용을 불러온다.
const fn_openForm = async row => {
  const current = ++detailRequest

  formError.value = ''
  formLoading.value = Boolean(row)
  form.value = {
    id: null,
    operationId: null,
    operationLabel: '',
    incidentType: '',
    occurredAt: gfn_formatDateTimeInput(new Date().toISOString()),
    impactDetail: '',
    actionDetail: '',
    status: 'RECEIVED',
  }

  originalForm.value = fn_formSnapshot()
  formOpen.value = true
  if (!row) {
    return
  }

  try {
    const data = await fn_getIncident(row.id)
    if (current !== detailRequest) {
      return
    }
    form.value = {
      ...data,
      occurredAt: gfn_formatDateTimeInput(data.occurredAt),
      operationLabel: data.operationNumber,
    }
    originalForm.value = fn_formSnapshot()
  } catch (cause) {
    if (current === detailRequest) {
      formError.value = cause.message
    }
  } finally {
    if (current === detailRequest) {
      formLoading.value = false
    }
  }
}

// 입력값을 확인한 뒤 장애 접수 내용을 저장한다.
const fn_saveForm = async () => {
  if (saving.value || formLoading.value || formError.value) {
    return
  }
  if (
    !form.value.operationId ||
    !form.value.incidentType?.trim() ||
    !form.value.occurredAt ||
    !form.value.impactDetail?.trim()
  ) {
    showMessage('warning', '입력값을 확인해주세요', '운행번호, 장애유형, 발생일시, 영향범위를 모두 입력해주세요.')

    return
  }
  saving.value = true
  try {
    await fn_saveIncident(form.value.id, {
      operationId: form.value.operationId,
      incidentType: form.value.incidentType.trim(),
      occurredAt: `${form.value.occurredAt}:00+09:00`,
      impactDetail: form.value.impactDetail.trim(),
      version: form.value.version ?? null,
    })
    formOpen.value = false
    await fn_load()
    showMessage('success', '처리가 완료되었습니다', '장애 접수 내용을 저장했습니다.')
  } catch (cause) {
    showMessage('error', '저장하지 못했습니다', cause.message)
  } finally {
    saving.value = false
  }
}

// 삭제 가능 여부와 선택 항목을 확인한 뒤 삭제한다.
const fn_remove = async () => {
  const targets = rows.value.filter(row => selected.value.includes(row.id))
  if (!targets.length || saving.value) {
    return
  }
  if (targets.some(row => row.status === 'COMPLETED')) {
    showMessage('warning', '삭제할 수 없습니다', '조치 완료된 장애가 포함되어 있습니다. 선택에서 제외해주세요.')

    return
  }
  if (
    !(await askConfirm(
      '장애를 삭제하시겠습니까?',
      `선택한 ${targets.length}건과 해당 상태 이력이 함께 삭제됩니다.`,
      '삭제'
    ))
  ) {
    return
  }
  saving.value = true
  try {
    await fn_deleteIncidents(targets)
    if (page.value > 0 && targets.length === rows.value.length) {
      page.value--
    }
    await fn_load()
    showMessage('success', '처리가 완료되었습니다', `${targets.length}건 삭제했습니다.`)
  } catch (cause) {
    showMessage('error', '삭제하지 못했습니다', cause.message)
  } finally {
    saving.value = false
  }
}

// 선택할 운행정보 목록을 페이지별로 불러온다.
const fn_openOperationPicker = async target => {
  const current = ++pickerRequest

  picker.value = {
    open: true,
    target,
    rows: [],
    loading: true,
  }
  try {
    const options = []
    let operationPage = 0
    let data
    do {
      data = await fn_listOperations({
        page: operationPage++,
        size: 100,
        sort: 'id,desc',
      })
      if (current !== pickerRequest) {
        return
      }
      options.push(...data.content)
    } while (operationPage < data.totalPages)
    picker.value.rows = options
  } catch (cause) {
    if (current === pickerRequest) {
      picker.value.open = false
      showMessage('error', '운행정보를 불러오지 못했습니다', cause.message)
    }
  } finally {
    if (current === pickerRequest) {
      picker.value.loading = false
    }
  }
}

// 선택한 운행정보를 검색 조건 또는 접수 양식에 반영한다.
const fn_selectOperation = operation => {
  const target = picker.value.target === 'form' ? form.value : draftFilters.value

  target.operationId = operation.id
  target.operationLabel = operation.operationNumber
}

// 장애의 처리 이력을 조회하고 최신 요청 결과만 반영한다.
const fn_loadHistory = async () => {
  const current = ++historyRequest

  history.value.loading = true
  history.value.error = ''
  try {
    const data = await fn_getIncidentHistory(history.value.id)
    if (current === historyRequest) {
      history.value.rows = data
    }
  } catch (cause) {
    if (current === historyRequest) {
      history.value.error = cause.message
    }
  } finally {
    if (current === historyRequest) {
      history.value.loading = false
    }
  }
}

// 선택한 장애의 처리 이력 팝업을 연다.
const fn_openHistory = row => {
  history.value = {
    open: true,
    id: row.id,
    incidentNumber: row.incidentNumber,
    rows: [],
    loading: true,
    error: '',
  }
  fn_loadHistory()
}

// 조치 팝업을 닫고 목록을 갱신한다.
const fn_closeAction = () => {
  actionIncidentId.value = null
  fn_load()
}

// 저장 중이거나 접수 내용이 변경된 경우 화면 이동을 확인한다.
const fn_mayLeave = async () => !saving.value && (await fn_closeForm())

onBeforeRouteLeave(fn_mayLeave)

onBeforeRouteUpdate(fn_mayLeave)

watch(
  () => props.mode,
  () => {
    filters.value = fn_emptyFilters()
    draftFilters.value = fn_emptyFilters()
    resetGridOptions()
    fn_load()
  },
  {
    immediate: true,
  }
)

onBeforeUnmount(() => {
  ++listRequest
  ++detailRequest
  ++historyRequest
  ++pickerRequest
})
</script>

<template>
  <div class="train-page incident-page">
    <header class="train-page__intro">
      <h2>{{ isAction ? '운행 장애 조치' : '운행 장애 접수' }}</h2>
      <p>
        {{
          isAction
            ? '접수된 장애의 내용을 확인하고 조치 진행 상황을 관리합니다.'
            : '운행 장애를 접수하고 등록 내용을 조회·수정·삭제합니다.'
        }}
      </p>
    </header>
    <VCard class="train-search-card" elevation="0">
      <AppSearchCondition
        v-model="draftFilters"
        :fields="searchFields"
        @search="fn_search"
        @reset="fn_reset"
        @pick="fn_openOperationPicker('filter')"
      />
    </VCard>
    <VCard class="train-list-card" elevation="0">
      <div class="train-list__heading">
        <div>
          <h2>{{ isAction ? '조치' : '접수' }} 목록</h2>
          <span>총 {{ total }}건</span>
        </div>
        <div v-if="!isAction" class="incident-actions">
          <button type="button" class="train-button" :disabled="!selected.length || saving" @click="fn_remove">
            삭제
          </button>
          <button
            type="button"
            class="train-button train-button--primary"
            :disabled="saving"
            @click="fn_openForm(null)"
          >
            장애 접수
          </button>
        </div>
      </div>
      <p v-if="loadError" class="incident-error" role="alert">
        {{ loadError }}
        <button type="button" @click="fn_load">다시 시도</button>
      </p>
      <div class="train-table-wrap incident-table-wrap">
        <AppDataGrid
          v-model="selected"
          :columns="columns"
          :column-width-key="
            isAction ? 'dtro:incident-action-column-widths:v2' : 'dtro:incident-reception-column-widths:v2'
          "
          :rows="rows"
          :total-items="total"
          :page="page + 1"
          :page-size="size"
          :sort-by="gridSort"
          :loading="loading"
          :show-select="!isAction"
          @update:options="fn_updateGridOptions"
        >
          <template #item.actions="{ item }">
            <div class="incident-row-actions">
              <button v-if="isAction" type="button" @click="actionIncidentId = item.id">조치하기</button>
              <button v-else type="button" @click="fn_openForm(item)">상세내용</button>
              <button type="button" @click="fn_openHistory(item)">이력</button>
            </div>
          </template>
          <template #item.operationNumber="{ item }">
            <span :title="item.operationNumber">
              {{ item.operationNumber }}
            </span>
          </template>
          <template #item.status="{ item }">
            <span class="app-status-badge" :class="`app-status-badge--${item.status}`">
              {{ gfn_getLabel(INCIDENT_STATUSES, item.status) }}
            </span>
          </template>
          <template #item.occurredAt="{ item }">{{ gfn_formatDateTime(item.occurredAt) }}</template>
          <template #item.createdAt="{ item }">{{ gfn_formatDateTime(item.createdAt) }}</template>
          <template #item.updatedAt="{ item }">{{ gfn_formatDateTime(item.updatedAt) }}</template>
          <template #item.createdByName="{ item }">{{ item.createdByName || '—' }}</template>
          <template #item.updatedByName="{ item }">{{ item.updatedByName || '—' }}</template>
        </AppDataGrid>
      </div>
    </VCard>
    <VDialog
      :model-value="formOpen"
      max-width="760"
      :persistent="saving || formDirty"
      @update:model-value="
        value => {
          if (!value) {
            fn_closeForm()
          }
        }
      "
    >
      <VCard class="incident-dialog" elevation="0">
        <header class="incident-panel-heading">
          <h2>{{ form.id ? `장애 ${form.incidentNumber} 접수 내용` : '운행 장애 접수' }}</h2>
          <button
            type="button"
            class="incident-close"
            aria-label="접수 팝업 닫기"
            :disabled="saving"
            @click="fn_closeForm"
          >
            ×
          </button>
        </header>
        <p v-if="formLoading" class="incident-dialog-state" role="status">접수 내용을 불러오는 중입니다.</p>
        <p v-else-if="formError" class="incident-error incident-dialog-state" role="alert">{{ formError }}</p>
        <form v-else class="incident-form" @submit.prevent="fn_saveForm">
          <fieldset :disabled="saving">
            <div class="incident-field-grid">
              <label>
                <span class="incident-required-label">운행번호 <span aria-hidden="true">*</span></span>
                <button type="button" class="incident-picker" aria-label="운행번호 선택" @click="fn_openOperationPicker('form')">
                  {{ form.operationLabel }}
                  <VIcon icon="bx-search" aria-hidden="true" />
                </button>
              </label>
              <label>
                <span class="incident-required-label">장애유형 <span aria-hidden="true">*</span></span>
                <select v-model="form.incidentType" required>
                  <option value="" disabled>선택하세요</option>
                  <option v-for="type in INCIDENT_TYPES" :key="type" :value="type">{{ type }}</option>
                </select>
              </label>
              <label>
                <span class="incident-required-label">발생일시 <span aria-hidden="true">*</span></span>
                <input v-model="form.occurredAt" type="datetime-local" required />
              </label>
              <label>
                처리상태
                <input :value="gfn_getLabel(INCIDENT_STATUSES, form.status)" readonly />
              </label>
            </div>
            <label>
              <span class="incident-required-label">영향범위 <span aria-hidden="true">*</span></span>
              <textarea v-model="form.impactDetail" rows="4" required />
            </label>
            <label v-if="form.id">
              현재 조치내용 · 조회
              <textarea :value="form.actionDetail || '아직 조치 내용이 없습니다.'" rows="3" readonly />
            </label>
          </fieldset>
          <footer class="incident-form-actions">
            <button type="button" class="train-button" :disabled="saving" @click="fn_closeForm">취소</button>
            <button
              type="submit"
              class="train-button train-button--primary"
              :disabled="saving || (!formDirty && Boolean(form.id))"
            >
              {{ saving ? '저장 중' : '저장' }}
            </button>
          </footer>
        </form>
      </VCard>
    </VDialog>
    <AppGridSelectDialog
      v-model="picker.open"
      title="운행번호 선택"
      :columns="operationColumns"
      :rows="picker.rows"
      item-key="id"
      :loading="picker.loading"
      @select="fn_selectOperation"
    />
    <VDialog :model-value="actionIncidentId !== null" max-width="1280" persistent>
      <VCard class="incident-action-dialog" elevation="0">
        <IncidentActionDetail
          v-if="actionIncidentId !== null"
          :incident-id="actionIncidentId"
          @close="fn_closeAction"
        />
      </VCard>
    </VDialog>
    <VDialog v-model="history.open" max-width="640">
      <VCard class="incident-dialog incident-dialog--history" elevation="0">
        <header class="incident-panel-heading">
          <h2>장애 {{ history.incidentNumber }} 처리 이력</h2>
          <button class="incident-close" type="button" aria-label="이력 팝업 닫기" @click="history.open = false">
            ×
          </button>
        </header>
        <div class="incident-history-body">
          <AppStatusTimeline
            :statuses="INCIDENT_STATUSES"
            :titles="INCIDENT_HISTORY_TITLES"
            initial-title="장애 접수"
            :record-label="`장애번호 ${history.incidentNumber}`"
            :histories="history.rows"
            :loading="history.loading"
            :error="history.error"
            @retry="fn_loadHistory"
          />
        </div>
      </VCard>
    </VDialog>
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
