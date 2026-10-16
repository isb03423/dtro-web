<script setup>
import DtroHeader from './DtroHeader.vue'
</script>

<template>
  <div class="auth-page">
    <DtroHeader />
    <main class="auth-page__body">
      <slot />
    </main>
  </div>
</template>

<style lang="scss" scoped>
@use "@styles/variables/dtro" as dtro;

.auth-page {
  min-block-size: 100vh;
  min-block-size: 100dvh;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
}

.auth-page__body {
  display: grid;
  min-block-size: calc(100vh - dtro.$auth-header-height);
  min-block-size: calc(100dvh - dtro.$auth-header-height);
  place-items: center;
  padding: 20px 16px;
}

@media (max-height: 680px) {
  .auth-page__body { align-items: start; }
}
</style>
