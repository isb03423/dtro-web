<script setup>
import { APP_ROLES } from '@/config/sideMenu'
import { useAuthStore } from '@/stores/auth'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DtroLogo from './DtroLogo.vue'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const isUserMenuOpen = ref(false)
const logoutError = ref('')
const userMenuRef = ref(null)

const roleProfiles = {
  [APP_ROLES.USER]: { name: '사용자 님', label: '사용자' },
  [APP_ROLES.TRAIN_MANAGER]: { name: '열차 운영자 님', label: '열차 운영자' },
  [APP_ROLES.ADMIN]: { name: '관리자 님', label: '관리자' },
}

// 현재 권한에 맞는 프로필 표시 정보를 선택한다.
const currentProfile = computed(() => roleProfiles[authStore.role])
// 로그인·회원가입 화면인지 확인한다.
const isAuthPage = computed(() => route.path === '/login' || route.path === '/register')

// 프로필 메뉴를 닫는다.
const fn_closeUserMenu = () => {
  isUserMenuOpen.value = false
}

// 프로필 메뉴 바깥 클릭을 감지해 메뉴를 닫는다.
const fn_handleOutsideClick = event => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target))
    fn_closeUserMenu()
}

// 로그아웃 요청 후 첫 화면으로 이동한다.
const fn_logout = async () => {
  try {
    await authStore.logout()
    fn_closeUserMenu()
    await router.push('/')
  }
  catch (error) {
    logoutError.value = error.message
  }
}

onMounted(() => document.addEventListener('pointerdown', fn_handleOutsideClick))
onBeforeUnmount(() => document.removeEventListener('pointerdown', fn_handleOutsideClick))
</script>

<template>
  <header class="site-header">
    <DtroLogo />

    <nav v-if="!isAuthPage && !authStore.isAuthenticated" class="site-header__actions" aria-label="회원 메뉴">
      <VBtn class="header-button" to="/register" variant="outlined" rounded="pill">회원가입</VBtn>
      <VBtn class="header-button" to="/login" rounded="pill">로그인</VBtn>
    </nav>

    <nav
      v-else-if="!isAuthPage"
      ref="userMenuRef"
      class="site-header__actions user-menu"
      aria-label="사용자 메뉴"
      @keyup.esc="fn_closeUserMenu"
    >
      <button
        class="user-menu__trigger"
        type="button"
        aria-haspopup="menu"
        :aria-label="isUserMenuOpen ? '사용자 메뉴 닫기' : '사용자 메뉴 열기'"
        :aria-expanded="isUserMenuOpen"
        aria-controls="user-profile-menu"
        @click="isUserMenuOpen = !isUserMenuOpen"
      >
        <span class="user-menu__avatar" aria-hidden="true"><i class="bx bx-user" /></span>
        <span class="user-menu__trigger-copy">{{ currentProfile.name }}</span>
        <i class="bx bx-chevron-down user-menu__chevron" aria-hidden="true" />
      </button>

      <div v-if="isUserMenuOpen" id="user-profile-menu" class="user-menu__panel" role="menu">
        <div class="user-menu__identity">
          <span class="user-menu__avatar user-menu__avatar--large" aria-hidden="true"><i class="bx bx-user" /></span>
          <span>
            <strong>{{ currentProfile.name }}</strong>
            <small>{{ currentProfile.label }}</small>
          </span>
        </div>

        <hr>

        <RouterLink class="user-menu__item" to="/profile" role="menuitem" @click="fn_closeUserMenu">
          <i class="bx bx-user-circle" aria-hidden="true" />
          <span>프로필</span>
        </RouterLink>

        <button class="user-menu__item user-menu__item--logout" type="button" role="menuitem" @click="fn_logout">
          <i class="bx bx-log-out" aria-hidden="true" />
          <span>로그아웃</span>
        </button>
        <p v-if="logoutError" role="alert">{{ logoutError }}</p>
      </div>
    </nav>
  </header>
</template>

<style lang="scss" scoped>
@use "@styles/variables/dtro" as dtro;

.site-header {
  display: flex;
  box-sizing: border-box;
  inline-size: 100%;
  block-size: dtro.$header-height;
  align-items: center;
  justify-content: space-between;
  padding-inline: clamp(20px, 3vw, 40px);
  border-block-end: 1px solid rgb(var(--v-theme-primary));
  background: linear-gradient(90deg, rgb(var(--v-theme-surface)) 0%, rgb(var(--v-theme-surface)) 20%, dtro.$brand-deep 90%, dtro.$brand-deep 100%);
}

.site-header__actions { display: flex; gap: 9px; }

.header-button {
  min-inline-size: 80px;
  min-block-size: 40px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: normal;
  text-transform: none;
}

.header-button.v-btn--variant-outlined { background: rgb(var(--v-theme-surface)); }
.header-button:focus-visible { outline: 3px solid dtro.$focus-accent; outline-offset: 2px; }

.user-menu { position: relative; }

.user-menu__trigger {
  display: inline-flex;
  min-block-size: 44px;
  align-items: center;
  padding: 4px 6px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: rgb(var(--v-theme-on-primary));
  cursor: pointer;
  font: inherit;
  gap: 7px;
}

.user-menu__trigger:hover { background: rgba(var(--v-theme-on-primary), 0.12); }
.user-menu__trigger:focus-visible,
.user-menu__item:focus-visible { outline: 3px solid dtro.$focus-accent; outline-offset: 2px; }

.user-menu__avatar {
  display: grid;
  inline-size: 32px;
  block-size: 32px;
  flex: 0 0 auto;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface));
  color: dtro.$brand-deep;
  font-size: 18px;
  place-items: center;
}

.user-menu__trigger-copy { font-size: 14px; font-weight: 700; white-space: nowrap; }
.user-menu__chevron { font-size: 16px; transition: transform .18s ease; }
.user-menu__trigger[aria-expanded='true'] .user-menu__chevron { transform: rotate(180deg); }

.user-menu__panel {
  @include dtro.surface-card;

  position: absolute;
  z-index: 50;
  inset-block-start: calc(100% + 10px);
  inset-inline-end: 0;
  inline-size: 250px;
  overflow: hidden;
  padding-block: 10px;
  box-shadow: 0 14px 35px rgb(25 48 81 / 18%);
  color: rgb(var(--v-theme-on-surface));
}

.user-menu__panel::before {
  position: absolute;
  inset: -7px 20px auto auto;
  inline-size: 14px;
  block-size: 14px;
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-inline-start: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  content: '';
  transform: rotate(45deg);
}

.user-menu__identity { display: flex; align-items: center; padding: 6px 18px 14px; gap: 12px; }
.user-menu__avatar--large { inline-size: 44px; block-size: 44px; border: 2px solid rgba(var(--v-theme-primary), 0.16); background: rgba(var(--v-theme-primary), 0.08); font-size: 24px; }
.user-menu__identity > span:last-child { display: flex; min-inline-size: 0; flex-direction: column; }
.user-menu__identity strong { overflow: hidden; color: rgb(var(--v-theme-on-surface)); font-size: 14px; text-overflow: ellipsis; white-space: nowrap; }
.user-menu__identity small { margin-block-start: 3px; color: rgba(var(--v-theme-on-surface), 0.55); font-size: 12px; }
.user-menu__panel hr { block-size: 1px; margin: 0; border: 0; background: rgba(var(--v-theme-on-surface), 0.1); }

.user-menu__item {
  display: flex;
  min-block-size: 48px;
  align-items: center;
  padding-inline: 18px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 14px;
  gap: 12px;
  text-decoration: none;
  inline-size: 100%;
  border: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.user-menu__item i { inline-size: 22px; color: rgba(var(--v-theme-on-surface), 0.65); font-size: 21px; text-align: center; }
.user-menu__item:hover { background: rgba(var(--v-theme-primary), 0.06); color: rgb(var(--v-theme-primary)); }
.user-menu__item--logout:hover { background: #fff3f3; color: #b42318; }

@media (max-width: 760px) {
  .user-menu__trigger-copy,
  .user-menu__chevron { display: none; }
  .user-menu__trigger { min-inline-size: 44px; padding-inline: 3px; }
}

@media (max-width: 640px) {
  .site-header { block-size: dtro.$header-height-mobile; }
  .site-header__actions { gap: 6px; }
  .header-button { min-inline-size: 76px; min-block-size: 40px; padding-inline: 12px; font-size: 12px; }
}

@media (max-width: 520px) {
  .site-header { padding-inline: 20px; }
}

@media (max-width: 420px) {
  .header-button { min-inline-size: 66px; padding-inline: 9px; }
  .user-menu__panel { inset-inline-end: -4px; inline-size: min(250px, calc(100vw - 24px)); }
}
</style>
