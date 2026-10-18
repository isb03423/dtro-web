import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { fn_fetchCurrentUser, fn_loginUser, fn_logoutUser } from '@/api/authApi'
import { APP_ROLES } from '@/config/sideMenu'

// 로그인 사용자와 인증 상태를 앱 전체에서 공유한다.
export const useAuthStore = defineStore('auth', () => {
  const account = ref(null)
  const hasRestored = ref(false)

  // 사용자 정보에서 현재 권한을 구한다.
  const role = computed(() => account.value?.role ?? APP_ROLES.GUEST)

  // 사용자 정보에서 로그인 아이디를 구한다.
  const username = computed(() => account.value?.userid ?? '')

  // 사용자 정보에서 화면에 표시할 이름을 구한다.
  const displayName = computed(() => account.value?.name ?? '')

  // 현재 계정의 로그인 여부를 판단한다.
  const isAuthenticated = computed(() => role.value !== APP_ROLES.GUEST)

  // 서버 세션을 확인해 현재 사용자를 복원한다.
  const fn_restore = async (force = false) => {
    // 이미 세션을 확인했다면 같은 요청을 반복하지 않는다.
    if (hasRestored.value && !force) {
      return
    }

    try {
      account.value = await fn_fetchCurrentUser()
    } catch (error) {
      if (error.status !== 401) {
        throw error
      }
      account.value = null
    }
    hasRestored.value = true
  }

  // 로그인 결과를 사용자 상태에 반영한다.
  const fn_login = async (userid, password) => {
    account.value = await fn_loginUser(userid.trim(), password)
    hasRestored.value = true
  }

  // 로그아웃하고 저장된 사용자 상태를 비운다.
  const fn_logout = async () => {
    await fn_logoutUser()
    account.value = null
    hasRestored.value = true
  }

  const fn_setAccount = member => {
    account.value = member
    hasRestored.value = true
  }

  const fn_expire = () => {
    account.value = null
    hasRestored.value = true
  }

  return {
    role,
    username,
    displayName,
    isAuthenticated,
    restore: fn_restore,
    login: fn_login,
    logout: fn_logout,
    setAccount: fn_setAccount,
    expire: fn_expire,
  }
})
