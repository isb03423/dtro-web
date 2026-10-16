<script setup>
import { gfn_getLabel } from '@/utils/common'

const route = useRoute()
const router = useRouter()
const train = ref(null)
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
const listTo = '/trains'

// 주소의 열차 ID에 해당하는 상세 정보를 불러온다.
const fn_load = async () => {
  loading.value = true
  error.value = ''

  try {
    train.value = await fn_getTrain(route.params.trainId)
  } catch (requestError) {
    error.value = requestError.message
    train.value = null
  } finally {
    loading.value = false
  }
}

watch(() => route.params.trainId, fn_load, { immediate: true })

// 삭제 확인 후 열차를 지우고 목록으로 이동한다.
const fn_remove = async () => {
  if (!window.confirm('이 열차 정보를 삭제하시겠습니까?')) {
    return
  }

  deleting.value = true
  error.value = ''
  try {
    await fn_deleteTrain(route.params.trainId)
    await router.push(listTo)
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="train-page">
    <header class="train-page__intro">
      <h2>열차 정보 상세</h2>
      <p>열차 정보의 기본 정보와 처리 내역을 확인하세요.</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0"> 열차 정보를 불러오는 중입니다. </VCard>
    <VCard v-else-if="error && !train" class="train-card train-card__state" elevation="0" role="alert">
      {{ error }}
      <button type="button" @click="fn_load">다시 시도</button>
    </VCard>
    <VCard v-else-if="train" class="train-card" elevation="0" tag="section" aria-labelledby="train-detail-heading">
      <dl class="train-field-grid">
        <div>
          <dt>열차 번호</dt>
          <dd>{{ train.trainNumber }}</dd>
        </div>
        <div></div>
        <div>
          <dt>편성명</dt>
          <dd>{{ train.formationName }}</dd>
        </div>
        <div>
          <dt>운영 상태</dt>
          <dd>{{ gfn_getLabel(TRAIN_STATUSES, train.status) }}</dd>
        </div>
        <div>
          <dt>차량 유형</dt>
          <dd>{{ train.carType }}</dd>
        </div>
        <div>
          <dt>차량 수</dt>
          <dd>{{ train.carCount }}량</dd>
        </div>
        <div>
          <dt>도입일</dt>
          <dd>{{ train.introducedOn }}</dd>
        </div>
        <div>
          <dt>최근 점검일</dt>
          <dd>{{ train.lastInspectedOn }}</dd>
        </div>
        <div>
          <dt>등록일</dt>
          <dd>{{ gfn_formatDate(train.createdAt, 'YYYY-MM-DD HH:mm:ss') }}</dd>
        </div>
        <div>
          <dt>등록자</dt>
          <dd>{{ train.createdByName }}</dd>
        </div>
        <div v-if="train.updatedAt">
          <dt>수정일</dt>
          <dd>{{ gfn_formatDate(train.updatedAt, 'YYYY-MM-DD HH:mm:ss') }}</dd>
        </div>
        <div v-if="train.updatedByName">
          <dt>수정자</dt>
          <dd>{{ train.updatedByName }}</dd>
        </div>
      </dl>
    </VCard>

    <p v-if="error && train" class="train-inline-error" role="alert">
      {{ error }}
    </p>
    <div class="train-actions">
      <RouterLink class="train-button" :to="listTo"> 목록 </RouterLink>
      <button v-if="train" class="train-button" type="button" :disabled="deleting" @click="fn_remove">삭제</button>
      <RouterLink v-if="train" class="train-button train-button--primary" :to="`/trains/${train.id}/edit`">
        수정
      </RouterLink>
    </div>
  </div>
</template>
