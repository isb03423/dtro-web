<script setup>
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppDonutChart from '@/components/common/AppDonutChart.vue'
import { COMPLAINT_STATUSES } from '@/features/complaint/constants/complaintOptions'
import { fn_getCustomerServiceOverview } from '@/features/customerservice/api/customerServiceOverviewApi'
import {
    CUSTOMER_SERVICE_STATUS_COLORS,
    CUSTOMER_SERVICE_TYPES,
} from '@/features/customerservice/constants/customerServiceOptions'
import { QNA_STATUSES } from '@/features/qna/constants/qnaOptions'
import { gfn_getLabel } from '@/utils/common'
import { gfn_formatDateTime } from '@/utils/date'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import '../styles/customer-service-overview.scss'

const router = useRouter()
const overview = ref(null)
const loading = ref(false)
const error = ref('')
let latestRequestId = 0

const recentColumns = [
    { title: '서비스 구분', key: 'serviceType', maxText: '서비스 구분', sortable: false },
    { title: '번호', key: 'id', maxText: '999999', sortable: false },
    { title: '제목', key: 'title', width: 320, sortable: false },
    { title: '관련 역', key: 'station', autoWidth: true, sortable: false },
    { title: '접수 시각', key: 'createdAt', maxText: '9999-12-31 23:59:59', sortable: false },
    { title: '처리 상태', key: 'status', maxText: COMPLAINT_STATUSES.map(item => item.label), sortable: false },
]

const complaintRows = computed(() => COMPLAINT_STATUSES.map(item => ({
    ...item,
    count: overview.value?.complaintByStatus?.[item.value] ?? 0,
    color: CUSTOMER_SERVICE_STATUS_COLORS[item.value],
})))

const qnaRows = computed(() => QNA_STATUSES.map(item => ({
    ...item,
    count: overview.value?.qnaByStatus?.[item.value] ?? 0,
    color: CUSTOMER_SERVICE_STATUS_COLORS[item.value],
})))

// 민원과 질문의 숫자 ID가 같아도 그리드에서 서로 다른 행으로 처리한다.
const recentRows = computed(() => (overview.value?.recentRequests ?? []).map(item => ({
    ...item,
    rowKey: `${item.serviceType}:${item.id}`,
})))

const fn_number = value => new Intl.NumberFormat('ko-KR').format(value ?? 0)

const fn_detailTo = item => {
    const serviceType = CUSTOMER_SERVICE_TYPES.find(option => option.value === item.serviceType)

    return serviceType ? `${serviceType.path}/${encodeURIComponent(item.id)}` : null
}

// 최근 접수 내역을 해당 기능의 상세 화면으로 연결한다.
const fn_openRequest = (_event, { item }) => {
    const destination = fn_detailTo(item)

    if (destination) {
        router.push(destination)
    }
}

const fn_rowProps = ({ item }) => ({
    class: 'train-grid__row',
    tabindex: 0,
    'aria-label': `${gfn_getLabel(CUSTOMER_SERVICE_TYPES, item.serviceType)} ${item.title}, Enter 키로 상세 보기`,
    onKeydown: event => {
        if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) {
            return
        }
        event.preventDefault()
        fn_openRequest(event, { item })
    },
})

// 갱신 실패 시 마지막 조회 결과를 유지하고 재시도 안내를 표시한다.
const fn_load = async () => {
    if (loading.value) {
        return
    }
    const requestId = ++latestRequestId

    loading.value = true
    error.value = ''
    try {
        const response = await fn_getCustomerServiceOverview()

        if (requestId === latestRequestId) {
            overview.value = response
        }
    } catch (cause) {
        if (requestId === latestRequestId) {
            error.value = cause.message
        }
    } finally {
        if (requestId === latestRequestId) {
            loading.value = false
        }
    }
}

onMounted(fn_load)
onBeforeUnmount(() => {
    latestRequestId += 1
})
</script>

<template>
    <div class="train-page train-overview customer-service-overview" :aria-busy="loading">
        <header class="train-page__intro train-overview__intro">
            <div>
                <h2>고객 서비스 현황</h2>
                <p>민원과 질문 및 답변의 현재 접수·처리 현황을 확인합니다.</p>
            </div>
            <div class="train-overview__refresh">
                <span v-if="overview">조회 시각 {{ gfn_formatDateTime(overview.fetchedAt) }}</span>
                <button class="train-button" type="button" :disabled="loading" @click="fn_load">
                    {{ loading ? '조회 중...' : '새로 조회' }}
                </button>
            </div>
        </header>

        <div v-if="loading && !overview" class="train-overview__state" role="status">
            고객 서비스 현황을 불러오는 중입니다.
        </div>
        <div v-else-if="error && !overview" class="train-overview__state train-overview__state--error" role="alert">
            {{ error }} <button type="button" @click="fn_load">다시 시도</button>
        </div>
        <template v-else-if="overview">
            <p v-if="error" class="train-overview__inline-error" role="alert">
                새로 조회하지 못했습니다. 마지막 조회 결과를 표시합니다. {{ error }}
            </p>

            <section class="train-overview__summary" aria-label="고객 서비스 주요 현황">
                <RouterLink class="train-overview__metric" to="/complaints">
                    <span>전체 민원</span>
                    <strong>{{ fn_number(overview.complaintTotal) }}<small>건</small></strong>
                    <em>민원 목록 보기 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></em>
                </RouterLink>
                <RouterLink class="train-overview__metric" to="/qnas">
                    <span>전체 질문</span>
                    <strong>{{ fn_number(overview.qnaTotal) }}<small>건</small></strong>
                    <em>질문 및 답변 보기 <VIcon icon="bx-right-arrow-alt" aria-hidden="true" /></em>
                </RouterLink>
                <article class="train-overview__metric train-overview__metric--attention">
                    <span>답변 대기</span>
                    <strong>{{ fn_number(overview.pendingTotal) }}<small>건</small></strong>
                    <span class="customer-service-overview__counts">
                        <RouterLink class="customer-service-overview__count customer-service-overview__count--complaint" to="/complaints?complaintStatus=PENDING" aria-label="민원 답변 대기 목록">
                            민원 <b>{{ fn_number(overview.complaintByStatus.PENDING) }}</b> <VIcon icon="bx-right-arrow-alt" aria-hidden="true" />
                        </RouterLink>
                        <RouterLink class="customer-service-overview__count customer-service-overview__count--qna" to="/qnas?qnaStatus=PENDING" aria-label="질문 답변 대기 목록">
                            질문 <b>{{ fn_number(overview.qnaByStatus.PENDING) }}</b> <VIcon icon="bx-right-arrow-alt" aria-hidden="true" />
                        </RouterLink>
                    </span>
                    <em>민원·질문 답변 대기 합계</em>
                </article>
                <article class="train-overview__metric">
                    <span>답변 완료</span>
                    <strong>{{ fn_number(overview.answeredTotal) }}<small>건</small></strong>
                    <span class="customer-service-overview__counts">
                        <RouterLink class="customer-service-overview__count customer-service-overview__count--complaint" to="/complaints?complaintStatus=ANSWERED" aria-label="민원 답변 완료 목록">
                            민원 <b>{{ fn_number(overview.complaintByStatus.ANSWERED) }}</b> <VIcon icon="bx-right-arrow-alt" aria-hidden="true" />
                        </RouterLink>
                        <RouterLink class="customer-service-overview__count customer-service-overview__count--qna" to="/qnas?qnaStatus=ANSWERED" aria-label="질문 답변 완료 목록">
                            질문 <b>{{ fn_number(overview.qnaByStatus.ANSWERED) }}</b> <VIcon icon="bx-right-arrow-alt" aria-hidden="true" />
                        </RouterLink>
                    </span>
                    <em>민원·질문 답변 완료 합계</em>
                </article>
            </section>

            <div class="train-overview__breakdown">
                <section class="train-overview__panel" aria-labelledby="complaint-status-heading">
                    <div class="train-overview__panel-heading">
                        <div><h3 id="complaint-status-heading">민원 처리 상태</h3><p>접수한 민원의 답변 상태별 건수</p></div>
                        <RouterLink to="/complaints">목록 보기</RouterLink>
                    </div>
                    <AppDonutChart :items="complaintRows" :total="overview.complaintTotal" unit="건" />
                </section>
                <section class="train-overview__panel" aria-labelledby="qna-status-heading">
                    <div class="train-overview__panel-heading">
                        <div><h3 id="qna-status-heading">질문 답변 상태</h3><p>접수한 질문의 답변 상태별 건수</p></div>
                        <RouterLink to="/qnas">목록 보기</RouterLink>
                    </div>
                    <AppDonutChart :items="qnaRows" :total="overview.qnaTotal" unit="건" />
                </section>
            </div>

            <section class="train-overview__panel train-overview__recent" aria-labelledby="recent-requests-heading">
                <div class="train-overview__panel-heading">
                    <div><h3 id="recent-requests-heading">최근 고객 서비스 접수</h3><p>민원과 질문을 합쳐 접수 시각 기준 최근 5건</p></div>
                    <div class="customer-service-overview__links">
                        <RouterLink to="/complaints">민원 전체 보기</RouterLink>
                        <RouterLink to="/qnas">질문 전체 보기</RouterLink>
                    </div>
                </div>
                <p v-if="!recentRows.length" class="train-overview__empty">접수된 민원과 질문이 없습니다.</p>
                <div
                    v-else
                    class="train-table-wrap train-overview__grid-wrap"
                    tabindex="0"
                    role="region"
                    aria-label="최근 접수 목록, 좁은 화면에서는 가로로 이동할 수 있습니다"
                >
                    <AppDataGrid
                        :columns="recentColumns"
                        :rows="recentRows"
                        :total-items="recentRows.length"
                        :page-size="5"
                        :row-props="fn_rowProps"
                        item-value="rowKey"
                        column-width-key="dtro:customer-service-overview-recent-column-widths:v1"
                        hide-default-footer
                        @click:row="fn_openRequest"
                    >
                        <template #item.serviceType="{ item }">
                            <span
                                class="customer-service-overview__count"
                                :class="`customer-service-overview__count--${item.serviceType.toLowerCase()}`"
                            >
                                {{ gfn_getLabel(CUSTOMER_SERVICE_TYPES, item.serviceType) }}
                            </span>
                        </template>
                        <template #item.title="{ item }">
                            <RouterLink class="customer-service-overview__title" :to="fn_detailTo(item)" @click.stop>
                                {{ item.title }}
                            </RouterLink>
                        </template>
                        <template #item.createdAt="{ item }">{{ gfn_formatDateTime(item.createdAt) }}</template>
                        <template #item.status="{ item }">
                            <span class="train-overview__badge" :class="`customer-service-overview__badge--${item.status.toLowerCase()}`">
                                {{ gfn_getLabel(COMPLAINT_STATUSES, item.status) }}
                            </span>
                        </template>
                    </AppDataGrid>
                </div>
            </section>
        </template>
    </div>
</template>
