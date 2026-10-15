<template>
  <main class="not-found">
    <VCard class="not-found__card" elevation="2" aria-labelledby="not-found-title">
      <div class="not-found__symbol" aria-hidden="true">
        <span class="not-found__track" />
        <span class="not-found__station"><i class="bx bx-train" /></span>
        <span class="not-found__track" />
      </div>

      <p class="not-found__code">404</p>
      <h1 id="not-found-title">페이지를 찾을 수 없습니다</h1>
      <p class="not-found__description">
        요청하신 주소를 다시 확인해 주세요.<br>
        찾으시는 페이지가 없다면 메인 화면으로 이동해 주세요.
      </p>

      <VBtn class="not-found__link" to="/" color="primary" size="large">
        메인으로 돌아가기
        <i class="bx bx-right-arrow-alt" aria-hidden="true" />
      </VBtn>
    </VCard>
  </main>
</template>

<style lang="scss" scoped>
@use "@styles/variables/vuetify" as vuetify;

.not-found {
  display: grid;
  min-block-size: 100vh;
  min-block-size: 100dvh;
  place-items: center;
  padding: 24px;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
}

.not-found__card {
  inline-size: min(100%, 560px);
  padding: clamp(24px, 4vw, 36px) clamp(20px, 3vw, 32px);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  border-radius: vuetify.$border-radius-root * 2;
  background: rgb(var(--v-theme-surface));
  text-align: center;
}

.not-found__symbol {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-block-end: 16px;
  color: rgb(var(--v-theme-primary));
  gap: 8px;
}

.not-found__track {
  inline-size: 52px;
  block-size: 3px;
  border-radius: 999px;
  background: #d8e9fa;
}

.not-found__station {
  display: grid;
  inline-size: 48px;
  block-size: 48px;
  border: 2px solid rgb(var(--v-theme-primary));
  border-radius: 50%;
  background: #eef6ff;
  font-size: 26px;
  place-items: center;
}

.not-found__code {
  margin: 0 0 12px;
  color: rgb(var(--v-theme-primary));
  font-size: clamp(72px, 14vw, 104px);
  font-weight: 800;
  letter-spacing: -.07em;
  line-height: 1;
}

.not-found h1 {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: clamp(22px, 4vw, 28px);
  font-weight: 800;
  letter-spacing: -.05em;
}

.not-found__description {
  margin: 12px 0 20px;
  color: #687488;
  font-size: 14px;
  line-height: 1.7;
}

.not-found__link {
  min-block-size: 40px;
  padding-inline: 18px 14px;
  border-radius: vuetify.$border-radius-root;
}

.not-found__link i { margin-inline-start: 8px; font-size: 20px; }
.not-found__link:focus-visible { outline: 3px solid #ffdc54; outline-offset: 3px; }

@media (max-width: 420px) {
  .not-found { padding: 16px; }
  .not-found__description br { display: none; }
  .not-found__link { min-block-size: 44px; }
}
</style>
