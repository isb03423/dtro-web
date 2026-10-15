<script setup>
import { APP_ROLES } from '@/config/sideMenu'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const roleLabels = {
  [APP_ROLES.ADMIN]: '관리자',
  [APP_ROLES.TRAIN_MANAGER]: '열차 운영자',
  [APP_ROLES.USER]: '일반 사용자',
}

// 현재 권한을 화면에 표시할 이름으로 바꾼다.
const roleLabel = computed(() => roleLabels[authStore.role] ?? '사용자')
</script>

<template>
  <div class="profile-page">
    <VCard class="profile-card" elevation="0" tag="section" aria-labelledby="profile-title">
      <div class="profile-card__heading">
        <span class="profile-card__avatar" aria-hidden="true"><i class="bx bx-user" /></span>
        <div>
          <h1 id="profile-title">프로필</h1>
          <p>로그인한 계정 정보입니다.</p>
        </div>
      </div>

      <dl class="profile-card__details">
        <div>
          <dt>아이디</dt>
          <dd>{{ authStore.username }}</dd>
        </div>
        <div>
          <dt>권한</dt>
          <dd>{{ roleLabel }}</dd>
        </div>
      </dl>
    </VCard>
  </div>
</template>

<style lang="scss" scoped>
@use "@styles/variables/dtro" as dtro;

.profile-page {
  inline-size: min(100%, 960px);
  margin-inline: auto;
  padding: clamp(20px, 3vw, 32px);
}

.profile-card {
  @include dtro.surface-card;

  padding: clamp(20px, 2vw, 24px);
}

.profile-card__heading {
  display: flex;
  align-items: center;
  gap: 12px;
}

.profile-card__avatar {
  display: grid;
  inline-size: 48px;
  block-size: 48px;
  flex: 0 0 auto;
  border: 2px solid rgba(var(--v-theme-primary), 0.16);
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.08);
  color: rgb(var(--v-theme-primary));
  font-size: 24px;
  place-items: center;
}

.profile-card h1 {
  color: rgb(var(--v-theme-on-surface));
  font-size: clamp(20px, 2vw, 26px);
}

.profile-card p {
  margin-block-start: 4px;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 15px;
}

.profile-card__details {
  margin-block-start: 20px;
  border-block-start: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.profile-card__details > div {
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  padding-block: 12px;
  border-block-end: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  gap: 12px;
}

.profile-card dt { color: rgba(var(--v-theme-on-surface), 0.62); }
.profile-card dd { min-inline-size: 0; overflow-wrap: anywhere; }

@media (max-width: 640px) {
  .profile-page { padding: 16px 14px; }
  .profile-card__details > div { grid-template-columns: 1fr; gap: 4px; }
}
</style>
