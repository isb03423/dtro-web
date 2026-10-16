<script setup>
import { gfn_formatDate } from '@/utils/date'
import { gfn_validateRequiredFields } from '@/utils/validation'

const route = useRoute()
const router = useRouter()

// 경로에 열차 ID가 있으면 수정 화면으로 판단한다.
const isEdit = computed(() => Boolean(route.params.trainId))

const form = ref({
  formationName: '',
  carType: '',
  carCount: '',
  status: '',
  introducedOn: '',
  lastInspectedOn: '',
})

const requiredFields = ['formationName', 'carType', 'status', 'introducedOn', 'lastInspectedOn']

const errors = ref({})
const pageError = ref('')
const loading = ref(false)
const saving = ref(false)
const listTo = '/trains'

// 등록·수정 상태에 맞는 취소 이동 경로를 구한다.
const cancelTo = computed(() => (isEdit.value ? `/trains/${route.params.trainId}` : listTo))

// 수정 화면일 때 기존 열차 정보를 양식에 불러온다.
const fn_load = async () => {
  if (!isEdit.value) {
    return
  }

  loading.value = true
  pageError.value = ''
  try {
    form.value = await fn_getTrain(route.params.trainId)
  } catch (requestError) {
    pageError.value = requestError.message
  } finally {
    loading.value = false
  }
}

watch(() => route.params.trainId, fn_load, { immediate: true })

// 필수 입력값과 차량 수를 검사해 오류를 기록한다.
const fn_validate = () => {
  const next = gfn_validateRequiredFields(form.value, requiredFields)

  if (!Number.isInteger(Number(form.value.carCount)) || Number(form.value.carCount) < 1) {
    next.carCount = '차량 수는 1 이상의 정수로 입력하세요.'
  }

  errors.value = next

  return Object.keys(next).length === 0
}

// 양식을 검증한 뒤 열차를 등록하거나 수정한다.
const fn_save = async () => {
  if (!fn_validate()) {
    return
  }

  saving.value = true
  pageError.value = ''

  const payload = {
    formationName: form.value.formationName.trim(),
    carType: form.value.carType.trim(),
    carCount: Number(form.value.carCount),
    status: form.value.status,
    introducedOn: form.value.introducedOn,
    lastInspectedOn: form.value.lastInspectedOn,
  }

  try {
    const saved = isEdit.value ? await fn_updateTrain(route.params.trainId, payload) : await fn_createTrain(payload)

    await router.push(`/trains/${saved.id}`)
  } catch (requestError) {
    pageError.value = requestError.message
    for (const detail of requestError.details ?? []) {
      const [field, message] = detail.split(': ', 2)
      if (field in form.value) {
        errors.value[field] = message
      }
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="train-page">
    <header class="train-page__intro">
      <h2>{{ isEdit ? '열차 정보 수정' : '열차 정보 등록' }}</h2>
      <p>필수 항목을 확인한 뒤 저장하세요. * 필수 입력</p>
    </header>

    <VCard v-if="loading" class="train-card train-card__state" elevation="0"> 열차 정보를 불러오는 중입니다. </VCard>
    <VCard v-else class="train-card" elevation="0" tag="form" novalidate @submit.prevent="fn_save">
      <div class="train-field-grid train-field-grid--form">
        <div class="train-field-grid__full">
          <label>
            <span>열차 번호</span>
            <input :value="form.trainNumber || '저장 시 자동 발급'" type="text" disabled />
          </label>
        </div>
        <label>
          <span>편성명 *</span>
          <input
            v-model.trim="form.formationName"
            type="text"
            maxlength="100"
            :aria-invalid="Boolean(errors.formationName)"
          />
          <small v-if="errors.formationName">{{ errors.formationName }}</small>
        </label>
        <label>
          <span>운영 상태 *</span>
          <select v-model="form.status" :aria-invalid="Boolean(errors.status)">
            <option value="">상태를 선택하세요</option>
            <option v-for="item in TRAIN_STATUSES" :key="item.value" :value="item.value">{{ item.label }}</option>
          </select>
          <small v-if="errors.status">{{ errors.status }}</small>
        </label>
        <label>
          <span>차량 유형 *</span>
          <input v-model.trim="form.carType" type="text" maxlength="50" :aria-invalid="Boolean(errors.carType)" />
          <small v-if="errors.carType">{{ errors.carType }}</small>
        </label>
        <label>
          <span>차량 수 *</span>
          <input v-model="form.carCount" type="number" min="1" step="1" :aria-invalid="Boolean(errors.carCount)" />
          <small v-if="errors.carCount">{{ errors.carCount }}</small>
        </label>
        <label>
          <span>도입일 *</span>
          <input v-model="form.introducedOn" type="date" :aria-invalid="Boolean(errors.introducedOn)" />
          <small v-if="errors.introducedOn">{{ errors.introducedOn }}</small>
        </label>
        <label>
          <span>최근 점검일 *</span>
          <input v-model="form.lastInspectedOn" type="date" :aria-invalid="Boolean(errors.lastInspectedOn)" />
          <small v-if="errors.lastInspectedOn">{{ errors.lastInspectedOn }}</small>
        </label>
        <label v-if="form.createdAt">
          <span>등록일</span>
          <input :value="gfn_formatDate(form.createdAt, 'YYYY-MM-DD HH:mm:ss')" type="text" disabled />
        </label>
        <label v-if="form.createdByName">
          <span>등록자</span>
          <input :value="form.createdByName" type="text" disabled />
        </label>
        <label v-if="form.updatedAt">
          <span>수정일</span>
          <input :value="gfn_formatDate(form.updatedAt, 'YYYY-MM-DD HH:mm:ss')" type="text" disabled />
        </label>
        <label v-if="form.updatedByName">
          <span>수정자</span>
          <input :value="form.updatedByName" type="text" disabled />
        </label>
      </div>
    </VCard>

    <p v-if="pageError" class="train-inline-error" role="alert">
      {{ pageError }}
    </p>
    <div class="train-actions">
      <RouterLink class="train-button" :to="listTo"> 목록 </RouterLink>
      <RouterLink class="train-button" :to="cancelTo"> 취소 </RouterLink>
      <button class="train-button train-button--primary" type="button" :disabled="loading || saving" @click="fn_save">
        {{ saving ? '저장 중...' : '저장' }}
      </button>
    </div>
  </div>
</template>
