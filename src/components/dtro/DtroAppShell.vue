<script setup>
import DtroHeader from './DtroHeader.vue'
import DtroSideMenu from './DtroSideMenu.vue'

defineProps({
  centered: {
    type: Boolean,
    default: false,
  },
  train: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div class="dtro-shell" :class="{ 'dtro-shell--train': train }">
    <DtroHeader />
    <div class="dtro-shell__layout">
      <DtroSideMenu />
      <main class="dtro-shell__content" :class="{ 'dtro-shell__content--centered': centered }">
        <slot />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@styles/variables/dtro" as dtro;

.dtro-shell {
  min-block-size: 100vh;
  min-block-size: 100dvh;
  overflow-x: clip;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
}

.dtro-shell__layout {
  display: grid;
  inline-size: 100%;
  min-block-size: calc(100vh - dtro.$header-height);
  min-block-size: calc(100dvh - dtro.$header-height);
  grid-template-columns: 224px minmax(0, 1fr);
  background: rgb(var(--v-theme-surface));
}

.dtro-shell__content {
  inline-size: 100%;
  min-inline-size: 0;
  background: rgb(var(--v-theme-background));
}

.dtro-shell__content--centered {
  display: grid;
  align-items: center;
  justify-items: center;
  padding: clamp(32px, 6vh, 50px) 20px;
  background: rgb(var(--v-theme-background));
}

@media (max-width: 1100px) {
  .dtro-shell__layout { grid-template-columns: 220px minmax(0, 1fr); }
}

@media (max-width: 900px) {
  .dtro-shell__layout { grid-template-columns: 180px minmax(0, 1fr); }
}

@media (max-width: 640px) {
  .dtro-shell__layout {
    min-block-size: calc(100vh - dtro.$header-height-mobile);
    min-block-size: calc(100dvh - dtro.$header-height-mobile);
    grid-template-columns: 136px minmax(0, 1fr);
  }
  .dtro-shell__content--centered { padding: 24px 14px 32px; }
  .dtro-shell--train .dtro-shell__layout { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 420px) {
  .dtro-shell__layout { grid-template-columns: 116px minmax(0, 1fr); }
}

@media (max-width: 360px) {
  .dtro-shell__content--centered { padding-inline: 0; }
}

@media (max-height: 720px) {
  .dtro-shell__content--centered { align-items: start; padding-block: 16px 28px; }
}
</style>
