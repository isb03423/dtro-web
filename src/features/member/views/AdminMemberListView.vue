<script setup>
import { fn_createAdminMember, fn_listAdminMembers, fn_resetAdminMemberPassword, fn_updateAdminMember } from '@/features/member/api/adminMemberApi'
import AppDataGrid from '@/components/common/AppDataGrid.vue'
import AppMessageDialog from '@/components/common/AppMessageDialog.vue'
import AppSearchCondition from '@/components/common/AppSearchCondition.vue'
import { gfn_useGridState } from '@/composables/useGridState'
import { gfn_useMessageDialog } from '@/composables/useMessageDialog'
import { MEMBER_ROLES } from '@/features/member/constants/memberOptions'
import { useAuthStore } from '@/stores/auth'
import { computed, onMounted, ref } from 'vue'

const authStore = useAuthStore()
const { dialog, finishDialog, showMessage, askConfirm } = gfn_useMessageDialog()

const searchFields = [
  { key: 'role', label: '권한', type: 'select', options: MEMBER_ROLES },
  {
    key: 'enabled',
    label: '사용 상태',
    type: 'select',
    options: [{ value: 'true', label: '사용' }, { value: 'false', label: '중지' }],
  },
  { key: 'keyword', label: '검색어', type: 'search', placeholder: '아이디, 이름 또는 이메일', wide: true },
]

const fn_emptyFilters = () => ({ role: '', enabled: '', keyword: '' })
const draftFilters = ref(fn_emptyFilters())
const filters = ref(fn_emptyFilters())
const rows = ref([])
const original = ref(new Map())
const result = ref({ totalElements: 0 })
const { page, size: pageSize, sort, gridSort, setGridOptions } = gfn_useGridState({ defaultSort: 'id,desc' })
const loading = ref(false)
const saving = ref(false)
const resettingId = ref(null)
const resetResult = ref(null)
const copyStatus = ref('')
let requestId = 0
let nextDraftId = 0

const columns = [
  { title: '아이디', key: 'userid', maxText: 'train_manager_dev', autoWidth: true },
  { title: '이름', key: 'name', autoWidth: true, contentPadding: 60 },
  { title: '이메일', key: 'email', sortable: false, width: 245 },
  { title: '전화번호', key: 'phone', sortable: false, width: 170 },
  { title: '권한', key: 'role', maxText: '열차 운영자', contentPadding: 55 },
  { title: '사용 상태', key: 'enabled', maxText: '사용 중지', contentPadding: 55 },
  { title: '비밀번호', key: 'passwordReset', sortable: false, width: 148 },
  { title: '가입일시', key: 'createdAt', maxText: '9999-12-31 23:59:59' },
  { title: '수정일시', key: 'updatedAt', maxText: '9999-12-31 23:59:59' },
]

const fn_payload = row => ({
  name: row.name.trim(),
  email: row.email?.trim() || '',
  phone: row.phone?.trim() || '',
  role: row.role,
  enabled: row.enabled,
})

const hasChanges = computed(() => rows.value.some(row => row._new || JSON.stringify(fn_payload(row)) !== original.value.get(row.id)))
const fn_isSelf = row => row.userid === authStore.username
const fn_date = value => value ? value.replace('T', ' ').slice(0, 19) : '—'

const fn_load = async () => {
  const current = ++requestId

  loading.value = true
  try {
    const data = await fn_listAdminMembers({
      ...filters.value,
      page: page.value,
      size: pageSize.value,
      sort: sort.value,
    })

    if (current !== requestId) {
      return
    }
    rows.value = data.content.map(row => ({ ...row, email: row.email ?? '', phone: row.phone ?? '' }))
    result.value = data
    original.value = new Map(rows.value.map(row => [row.id, JSON.stringify(fn_payload(row))]))
  } catch (cause) {
    if (current === requestId) {
      showMessage('error', '조회 오류', cause.message)
    }
  } finally {
    if (current === requestId) {
      loading.value = false
    }
  }
}

const fn_mayDiscard = async () => !hasChanges.value || await askConfirm('변경사항을 버리시겠습니까?', '저장하지 않은 사용자 정보가 사라집니다.')

const fn_add = () => {
  if (rows.value.some(row => row._new)) {
    showMessage('info', '입력 중인 계정이 있습니다', '새 계정을 저장한 뒤 다음 계정을 추가해주세요.')

    return
  }
  rows.value.unshift({
    id: `new-${++nextDraftId}`,
    _new: true,
    userid: '',
    name: '',
    email: '',
    phone: '',
    role: 'USER',
    enabled: true,
  })
}

const fn_search = async () => {
  if (!(await fn_mayDiscard())) {
    return
  }
  filters.value = { ...draftFilters.value, keyword: draftFilters.value.keyword.trim() }
  page.value = 0
  fn_load()
}

const fn_reset = async () => {
  if (!(await fn_mayDiscard())) {
    return
  }
  filters.value = fn_emptyFilters()
  draftFilters.value = fn_emptyFilters()
  page.value = 0
  fn_load()
}

const fn_updateGridOptions = async options => {
  const nextSort = options.sortBy[0] ? `${options.sortBy[0].key},${options.sortBy[0].order}` : 'id,desc'
  const nextPage = options.itemsPerPage === pageSize.value ? options.page - 1 : 0
  if (nextPage === page.value && options.itemsPerPage === pageSize.value && nextSort === sort.value) {
    return
  }
  if (!(await fn_mayDiscard())) {
    return
  }
  if (setGridOptions(options)) {
    fn_load()
  }
}

const fn_save = async () => {
  const changed = rows.value.filter(row => row._new || JSON.stringify(fn_payload(row)) !== original.value.get(row.id))
  if (!changed.length) {
    return
  }
  if (changed.some(row => !row.name.trim() || row.name.length > 50 || row.email.length > 254 || row.phone.length > 30
    || (row._new && (row.userid.trim().length < 4 || row.userid.trim().length > 50)))) {
    showMessage('warning', '입력값을 확인해주세요', '아이디는 4~50자, 이름은 필수입니다. 이름·이메일·전화번호의 길이도 확인해주세요.')

    return
  }
  saving.value = true
  let saved = 0
  let newAccount = null
  try {
    for (const row of changed.filter(item => !item._new)) {
      const updated = await fn_updateAdminMember(row.id, fn_payload(row))

      original.value.set(row.id, JSON.stringify(fn_payload(updated)))
      if (fn_isSelf(row)) {
        authStore.setAccount(updated)
      }
      saved++
    }
    const draft = changed.find(row => row._new)
    if (draft) {
      const created = await fn_createAdminMember({ userid: draft.userid.trim(), ...fn_payload(draft) })

      newAccount = { userid: created.member.userid, password: created.temporaryPassword, created: true }
      rows.value = rows.value.filter(row => row !== draft)
      saved++
    }
    await fn_load()
    if (newAccount) {
      resetResult.value = newAccount
      copyStatus.value = ''
    } else {
      showMessage('success', '저장 완료', `${saved}명의 사용자 정보를 저장했습니다.`)
    }
  } catch (cause) {
    showMessage('error', '저장 오류', `${saved}명 저장 후 중단되었습니다. ${cause.details?.join(', ') || cause.message}`)
  } finally {
    saving.value = false
  }
}

const fn_resetPassword = async row => {
  if (!(await askConfirm('비밀번호를 초기화하시겠습니까?', `${row.userid} 계정의 기존 비밀번호로 로그인할 수 없게 됩니다.`, '초기화'))) {
    return
  }
  resettingId.value = row.id
  try {
    const response = await fn_resetAdminMemberPassword(row.id)

    resetResult.value = { userid: row.userid, password: response.temporaryPassword }
    copyStatus.value = ''
  } catch (cause) {
    showMessage('error', '초기화 오류', cause.message)
  } finally {
    resettingId.value = null
  }
}

const fn_copyPassword = async () => {
  try {
    await navigator.clipboard.writeText(resetResult.value.password)
    copyStatus.value = '임시 비밀번호를 복사했습니다.'
  } catch {
    copyStatus.value = '복사하지 못했습니다. 비밀번호를 직접 선택해 복사해주세요.'
  }
}

const fn_closeResetResult = () => {
  resetResult.value = null
  copyStatus.value = ''
}

onMounted(fn_load)
</script>

<template>
  <div class="train-page operation-page admin-member-page">
    <header class="train-page__intro">
      <h2>사용자 관리</h2>
      <p>사용자를 조회하고 목록에서 계정 정보와 권한, 사용 상태를 수정합니다.</p>
    </header>
    <VCard class="train-search-card" elevation="0">
      <AppSearchCondition v-model="draftFilters" :fields="searchFields" @search="fn_search" @reset="fn_reset" />
    </VCard>
    <VCard class="train-list-card" elevation="0">
      <div class="train-list__heading">
        <div><h2>사용자 목록</h2><span>총 {{ result.totalElements }}명</span></div>
        <div class="operation-actions">
          <button class="train-button" type="button" :disabled="saving" @click="fn_add">추가</button>
          <button class="train-button train-button--primary" type="button" :disabled="!hasChanges || saving" @click="fn_save">저장</button>
        </div>
      </div>
      <div class="train-table-wrap operation-table-wrap">
        <AppDataGrid
          :columns="columns"
          :rows="rows"
          :total-items="result.totalElements + rows.filter(row => row._new).length"
          :page="page + 1"
          :page-size="pageSize"
          :sort-by="gridSort"
          :loading="loading"
          column-width-key="dtro:admin-member-column-widths:v1"
          item-value="id"
          loading-text="사용자 목록을 불러오는 중입니다."
          empty-text="검색 결과가 없습니다."
          @update:options="fn_updateGridOptions"
        >
          <template #item.userid="{ item }">
            <input v-if="item._new" v-model="item.userid" class="admin-member-cell" maxlength="50" aria-label="새 사용자 아이디" placeholder="아이디">
            <span v-else>{{ item.userid }}</span>
          </template>
          <template #item.name="{ item }"><input v-model="item.name" class="admin-member-cell" maxlength="50" :aria-label="`${item.userid} 이름`"></template>
          <template #item.email="{ item }"><input v-model="item.email" class="admin-member-cell" type="email" maxlength="254" :aria-label="`${item.userid} 이메일`"></template>
          <template #item.phone="{ item }"><input v-model="item.phone" class="admin-member-cell" type="tel" maxlength="30" :aria-label="`${item.userid} 전화번호`"></template>
          <template #item.role="{ item }">
            <select v-model="item.role" class="operation-cell-select" :disabled="fn_isSelf(item)" :aria-label="`${item.userid} 권한`">
              <option v-for="option in MEMBER_ROLES" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </template>
          <template #item.enabled="{ item }">
            <select v-model="item.enabled" class="operation-cell-select" :disabled="fn_isSelf(item)" :aria-label="`${item.userid} 사용 상태`">
              <option :value="true">사용</option>
              <option :value="false">중지</option>
            </select>
          </template>
          <template #item.createdAt="{ item }">{{ fn_date(item.createdAt) }}</template>
          <template #item.updatedAt="{ item }">{{ fn_date(item.updatedAt) }}</template>
          <template #item.passwordReset="{ item }">
            <button
              class="train-button admin-member-reset-button"
              type="button"
              :disabled="item._new || fn_isSelf(item) || resettingId !== null"
              :aria-label="`${item.userid} 비밀번호 초기화`"
              @click="fn_resetPassword(item)"
            >초기화</button>
          </template>
        </AppDataGrid>
      </div>
      <p class="admin-member-note">본인의 권한·사용 상태·비밀번호는 여기서 변경할 수 없습니다. 본인 비밀번호는 내 정보 화면에서 변경하세요.</p>
    </VCard>
    <AppMessageDialog v-model="dialog.open" v-bind="dialog" @confirm="finishDialog(true)" @cancel="finishDialog(false)" />
    <VDialog :model-value="Boolean(resetResult)" max-width="460" @update:model-value="value => { if (!value) fn_closeResetResult() }">
      <VCard v-if="resetResult" class="admin-member-reset-result" elevation="0">
        <h2>{{ resetResult.created ? '계정 생성 완료' : '비밀번호 초기화 완료' }}</h2>
        <p v-if="resetResult.created"><strong>{{ resetResult.userid }}</strong> 계정이 생성되었습니다.</p>
        <p v-else><strong>{{ resetResult.userid }}</strong> 계정의 기존 비밀번호와 로그인 세션은 사용할 수 없습니다.</p>
        <p>임시 비밀번호는 이 창을 닫으면 다시 볼 수 없습니다. 사용자에게 안전하게 전달하고 로그인 후 변경하도록 안내하세요.</p>
        <label>임시 비밀번호
          <input :value="resetResult.password" readonly aria-label="임시 비밀번호" @focus="$event.target.select()">
        </label>
        <p v-if="copyStatus" role="status">{{ copyStatus }}</p>
        <div class="admin-member-reset-result__actions">
          <button class="train-button" type="button" @click="fn_copyPassword">복사</button>
          <button class="train-button train-button--primary" type="button" @click="fn_closeResetResult">닫기</button>
        </div>
      </VCard>
    </VDialog>
  </div>
</template>
