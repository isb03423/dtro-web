<script setup>
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppDonutChart from '@/components/common/AppDonutChart.vue'
import { fn_getTrainOverview } from '@/features/trainmanagement/api/trainOverviewApi'
import { TRAIN_STATUSES } from '@/features/train/constants/trainOptions'
import { INCIDENT_STATUSES } from '@/features/incident/constants/incidentOptions'
import IncidentActionDetail from '@/features/incident/components/IncidentActionDetail.vue'
import { computed, onMounted, ref } from 'vue'

const overview = ref(null)
const loading = ref(true)
const error = ref('')
const actionIncidentId = ref(null)

const recentColumns = [
  { title: '장애번호', key: 'incidentNumber', maxText: 'INC-99999', autoWidth: true, sortable: false },
  { title: '열차번호', key: 'trainNumber', maxText: 'TRN-9999', autoWidth: true, sortable: false },
  { title: '장애 유형', key: 'incidentType', autoWidth: true, sortable: false },
  { title: '발생 시각', key: 'occurredAt', maxText: '9999-12-31 23:59:59', sortable: false },
  { title: '처리 상태', key: 'status', maxText: INCIDENT_STATUSES.map(status => status.label), sortable: false },
]

const trainStatusColors = { AVAILABLE: '#36a37b', RUNNING: '#3d8bcf', INSPECTION: '#e0a136' }

const incidentStatusColors = {
  RECEIVED: '#e0a136',
  CHECKING: '#3d8bcf',
  IN_PROGRESS: '#d7704c',
  VERIFYING: '#7e72c4',
  COMPLETED: '#36a37b',
}

const trainRows = computed(() => TRAIN_STATUSES.map(option => ({
  ...option,
  count: overview.value?.trainByStatus?.[option.value] ?? 0,
  color: trainStatusColors[option.value],
})))

const incidentRows = computed(() => INCIDENT_STATUSES.map(option => ({
  ...option,
  count: overview.value?.incidentByStatus?.[option.value] ?? 0,
  color: incidentStatusColors[option.value],
})))

const activeIncidentCount = computed(() =>
  (overview.value?.incidentTotal ?? 0) - (overview.value?.incidentByStatus?.COMPLETED ?? 0))

const number = value => new Intl.NumberFormat('ko-KR').format(value ?? 0)

const dateTime = value => value ? new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
}).format(new Date(value)) : '—'

const incidentLabel = status => INCIDENT_STATUSES.find(option => option.value === status)?.label ?? status

// 현황 그리드에서 선택한 장애의 조치 상세를 팝업으로 연다.
const fn_openIncident = (_event, { item }) => {
  actionIncidentId.value = item.id
}

// 키보드로도 행을 선택할 수 있게 한다.
const fn_rowProps = ({ item }) => ({
  class: 'train-grid__row',
  tabindex: 0,
  'aria-label': `${item.incidentNumber} ${item.incidentType}, Enter 키로 상세 보기`,
  onKeydown: event => {
    if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) {
      return
    }
    event.preventDefault()
    actionIncidentId.value = item.id
  },
})

const fn_load = async () => {
  loading.value = true
  error.value = ''
  try {
    overview.value = await fn_getTrainOverview()
  } catch (cause) {
    error.value = cause.message
  } finally {
    loading.value = false
  }
}

// 팝업에서 변경된 처리 상태를 현황에 반영한다.
const fn_closeIncident = () => {
  actionIncidentId.value = null
  fn_load()
}

onMounted(fn_load)
</script>

<template>
  <div class="train-page train-overview">
    <header class="train-page__intro train-overview__intro">
      <div>
        <h2>열차 현황</h2>
        <p>열차, 운행 정보, 운행 장애의 현재 등록·처리 현황을 확인합니다.</p>
      </div>
      <div class="train-overview__refresh">
        <span v-if="overview">조회 시각 {{ dateTime(overview.fetchedAt) }}</span>
        <button class="train-button" type="button" :disabled="loading" @click="fn_load">새로 조회</button>
      </div>
    </header>

    <div v-if="loading && !overview" class="train-overview__state" role="status">열차 현황을 불러오는 중입니다.</div>
    <div v-else-if="error && !overview" class="train-overview__state train-overview__state--error" role="alert">
      {{ error }} <button type="button" @click="fn_load">다시 시도</button>
    </div>
    <template v-else-if="overview">
      <p v-if="error" class="train-overview__inline-error" role="alert">새로 조회하지 못했습니다. 마지막 조회 결과를 표시합니다. {{ error }}</p>

      <section class="train-overview__summary" aria-label="주요 현황">
        <RouterLink class="train-overview__metric" to="/trains">
          <span>등록 열차</span>
          <strong>{{ number(overview.trainTotal) }}<small>편성</small></strong>
          <em>열차 정보 보기 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></em>
        </RouterLink>
        <RouterLink class="train-overview__metric" to="/trainoperations">
          <span>등록 운행 정보</span>
          <strong>{{ number(overview.operationTotal) }}<small>건</small></strong>
          <em>운행 정보 보기 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></em>
        </RouterLink>
        <RouterLink class="train-overview__metric train-overview__metric--attention" to="/incidents/actions">
          <span>처리 중인 장애</span>
          <strong>{{ number(activeIncidentCount) }}<small>건</small></strong>
          <em>장애 조치 보기 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></em>
        </RouterLink>
        <RouterLink class="train-overview__metric" to="/incidents">
          <span>전체 운행 장애</span>
          <strong>{{ number(overview.incidentTotal) }}<small>건</small></strong>
          <em>장애 접수 보기 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></em>
        </RouterLink>
      </section>

      <div class="train-overview__breakdown">
        <section class="train-overview__panel" aria-labelledby="train-status-heading">
          <div class="train-overview__panel-heading">
            <div><h3 id="train-status-heading">열차 운영 상태</h3><p>등록 열차의 상태별 건수</p></div>
            <RouterLink to="/trains">목록 보기</RouterLink>
          </div>
          <AppDonutChart :items="trainRows" :total="overview.trainTotal" unit="편성" />
        </section>

        <section class="train-overview__panel" aria-labelledby="incident-status-heading">
          <div class="train-overview__panel-heading">
            <div><h3 id="incident-status-heading">운행 장애 처리 상태</h3><p>접수부터 완료까지 단계별 건수</p></div>
            <RouterLink to="/incidents/actions">목록 보기</RouterLink>
          </div>
          <AppDonutChart :items="incidentRows" :total="overview.incidentTotal" unit="건" />
        </section>
      </div>

      <section class="train-overview__panel train-overview__recent" aria-labelledby="recent-incidents-heading">
        <div class="train-overview__panel-heading">
          <div><h3 id="recent-incidents-heading">최근 발생한 운행 장애</h3><p>발생 시각 기준 최근 5건</p></div>
          <RouterLink to="/incidents">전체 보기</RouterLink>
        </div>
        <p v-if="!overview.recentIncidents.length" class="train-overview__empty">등록된 운행 장애가 없습니다.</p>
        <div v-else class="train-table-wrap train-overview__grid-wrap">
          <AppDataGrid
            :columns="recentColumns"
            :rows="overview.recentIncidents"
            :total-items="overview.recentIncidents.length"
            :page-size="5"
            :row-props="fn_rowProps"
            column-width-key="dtro:train-overview-recent-column-widths:v1"
            hide-default-footer
            @click:row="fn_openIncident"
          >
            <template #item.occurredAt="{ item }">{{ dateTime(item.occurredAt) }}</template>
            <template #item.status="{ item }">
              <span class="train-overview__badge" :class="`train-overview__badge--${item.status.toLowerCase()}`">
                {{ incidentLabel(item.status) }}
              </span>
            </template>
          </AppDataGrid>
        </div>
      </section>
    </template>
    <VDialog :model-value="actionIncidentId !== null" max-width="1280" persistent>
      <VCard class="incident-action-dialog" elevation="0">
        <IncidentActionDetail
          v-if="actionIncidentId !== null"
          :incident-id="actionIncidentId"
          @close="fn_closeIncident"
        />
      </VCard>
    </VDialog>
  </div>
</template>
