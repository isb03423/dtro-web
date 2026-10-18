<script setup>
import { computed, onMounted, ref } from 'vue'
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppDonutChart from '@/components/common/AppDonutChart.vue'
import { fn_getAdminDashboard } from '@/features/admin/api/adminDashboardApi'
import { fn_getTrainOverview } from '@/features/trainmanagement/api/trainOverviewApi'
import { MEMBER_ROLES } from '@/features/member/constants/memberOptions'

const members = ref(null)
const trains = ref(null)
const loading = ref(false)
const memberError = ref('')
const trainError = ref('')
const refreshedAt = ref(null)

const fn_number = value => value == null ? '—' : new Intl.NumberFormat('ko-KR').format(value)

const fn_date = value => value instanceof Date
  ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'medium' }).format(value)
  : value ? value.replace('T', ' ').slice(0, 19) : '—'

const fn_roleLabel = role => MEMBER_ROLES.find(option => option.value === role)?.label ?? role
const roleColors = { ADMIN: '#3d8bcf', TRAIN_MANAGER: '#36a37b', USER: '#7e72c4' }

const recentColumns = [
  { title: '아이디', key: 'userid', maxText: 'train_manager_dev', autoWidth: true, sortable: false },
  { title: '이름', key: 'name', autoWidth: true, sortable: false },
  { title: '권한', key: 'role', maxText: '열차 운영자', sortable: false },
  { title: '사용 상태', key: 'enabled', maxText: '사용 중지', sortable: false },
  { title: '가입일시', key: 'createdAt', maxText: '9999-12-31 23:59:59', sortable: false },
]

const roleRows = computed(() => MEMBER_ROLES.map(option => ({
  ...option,
  count: members.value?.membersByRole?.[option.value] ?? 0,
  color: roleColors[option.value],
})))

const activeIncidents = computed(() => trains.value
  ? trains.value.incidentTotal - (trains.value.incidentByStatus?.COMPLETED ?? 0)
  : null)

const fn_load = async () => {
  loading.value = true
  memberError.value = ''
  trainError.value = ''

  const [memberResult, trainResult] = await Promise.allSettled([
    fn_getAdminDashboard(),
    fn_getTrainOverview(),
  ])

  if (memberResult.status === 'fulfilled') {
    members.value = memberResult.value
  } else {
    memberError.value = memberResult.reason?.message ?? '사용자 현황을 불러오지 못했습니다.'
  }

  if (trainResult.status === 'fulfilled') {
    trains.value = trainResult.value
  } else {
    trainError.value = trainResult.reason?.message ?? '열차 현황을 불러오지 못했습니다.'
  }

  if (memberResult.status === 'fulfilled' || trainResult.status === 'fulfilled') {
    refreshedAt.value = new Date()
  }
  loading.value = false
}

onMounted(fn_load)
</script>

<template>
  <main class="train-page admin-dashboard">
    <header class="train-page__intro admin-dashboard__intro">
      <div>
        <h2>관리자 대시보드</h2>
        <p>사용자와 열차 운영 현황을 한눈에 확인합니다.</p>
      </div>
      <div class="admin-dashboard__refresh">
        <span v-if="refreshedAt">조회 시각 {{ fn_date(refreshedAt) }}</span>
        <button class="train-button" type="button" :disabled="loading" @click="fn_load">새로 조회</button>
      </div>
    </header>

    <p v-if="loading && !members && !trains" class="admin-dashboard__state" role="status">대시보드를 불러오는 중입니다.</p>
    <template v-else>
      <p v-if="memberError || trainError" class="admin-dashboard__error" role="alert">
        {{ [memberError, trainError].filter(Boolean).join(' ') }}
        <span v-if="members || trains">조회된 항목은 마지막 결과를 표시합니다.</span>
      </p>

      <section class="admin-dashboard__metrics" aria-label="주요 현황">
        <RouterLink class="admin-dashboard__metric" to="/admin/members">
          <span class="admin-dashboard__metric-label">사용자</span>
          <strong>{{ fn_number(members?.totalMembers) }}<small>명</small></strong>
          <span class="admin-dashboard__member-status">
            <span class="admin-dashboard__member-status--enabled">사용 중 <b>{{ fn_number(members?.enabledMembers) }}</b></span>
            <span class="admin-dashboard__member-status--disabled">사용 중지 <b>{{ fn_number(members?.disabledMembers) }}</b></span>
          </span>
          <span class="admin-dashboard__metric-detail">사용자 관리 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></span>
        </RouterLink>
        <RouterLink class="admin-dashboard__metric" to="/trains">
          <span class="admin-dashboard__metric-label">등록 열차</span>
          <strong>{{ fn_number(trains?.trainTotal) }}<small>편성</small></strong>
          <span class="admin-dashboard__metric-detail">열차 정보 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></span>
        </RouterLink>
        <RouterLink class="admin-dashboard__metric" to="/trainoperations">
          <span class="admin-dashboard__metric-label">등록 운행 정보</span>
          <strong>{{ fn_number(trains?.operationTotal) }}<small>건</small></strong>
          <span class="admin-dashboard__metric-detail">운행 정보 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></span>
        </RouterLink>
        <RouterLink class="admin-dashboard__metric admin-dashboard__metric--attention" to="/incidents/actions">
          <span class="admin-dashboard__metric-label">처리 중 장애</span>
          <strong>{{ fn_number(activeIncidents) }}<small>건</small></strong>
          <span class="admin-dashboard__metric-detail">운행 장애 조치 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></span>
        </RouterLink>
      </section>

      <div class="admin-dashboard__panels">
        <section class="admin-dashboard__panel" aria-labelledby="admin-roles-title">
          <div class="admin-dashboard__panel-heading">
            <div><h3 id="admin-roles-title">권한별 사용자 현황</h3><p>현재 등록된 계정 기준</p></div>
            <RouterLink to="/admin/members">사용자 관리</RouterLink>
          </div>
          <p v-if="!members" class="admin-dashboard__empty">사용자 현황을 조회할 수 없습니다.</p>
          <AppDonutChart v-else :items="roleRows" :total="members.totalMembers" unit="명" />
        </section>

        <section class="admin-dashboard__panel" aria-labelledby="admin-trains-title">
          <div class="admin-dashboard__panel-heading">
            <div><h3 id="admin-trains-title">열차 운영 요약</h3><p>등록 및 장애 처리 건수</p></div>
            <RouterLink to="/train-overview">열차 현황</RouterLink>
          </div>
          <p v-if="!trains" class="admin-dashboard__empty">열차 현황을 조회할 수 없습니다.</p>
          <div v-else class="admin-dashboard__train-list">
            <RouterLink to="/trains"><span>등록 열차</span><strong>{{ fn_number(trains.trainTotal) }}<small>편성</small></strong><VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></RouterLink>
            <RouterLink to="/trainoperations"><span>등록 운행 정보</span><strong>{{ fn_number(trains.operationTotal) }}<small>건</small></strong><VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></RouterLink>
            <RouterLink to="/incidents"><span>전체 운행 장애</span><strong>{{ fn_number(trains.incidentTotal) }}<small>건</small></strong><VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></RouterLink>
          </div>
        </section>
      </div>

      <section class="admin-dashboard__panel admin-dashboard__recent" aria-labelledby="admin-recent-title">
        <div class="admin-dashboard__panel-heading">
          <div><h3 id="admin-recent-title">최근 가입 사용자</h3><p>가입일시 기준 최근 5명</p></div>
          <RouterLink to="/admin/members">전체 보기</RouterLink>
        </div>
        <p v-if="!members" class="admin-dashboard__empty">사용자 현황을 조회할 수 없습니다.</p>
        <p v-else-if="!members.recentMembers.length" class="admin-dashboard__empty">등록된 사용자가 없습니다.</p>
        <div v-else class="train-table-wrap operation-table-wrap">
          <AppDataGrid
            :columns="recentColumns"
            :rows="members.recentMembers"
            :total-items="members.recentMembers.length"
            :page-size="5"
            column-width-key="dtro:admin-dashboard-recent-column-widths:v1"
            hide-default-footer
          >
            <template #item.role="{ item }">{{ fn_roleLabel(item.role) }}</template>
            <template #item.enabled="{ item }">
              <span class="admin-dashboard__status" :class="{ 'admin-dashboard__status--disabled': !item.enabled }">{{ item.enabled ? '사용 중' : '사용 중지' }}</span>
            </template>
            <template #item.createdAt="{ item }">{{ fn_date(item.createdAt) }}</template>
          </AppDataGrid>
        </div>
      </section>
    </template>
  </main>
</template>
