<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
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

const route = useRoute()
const contentRef = ref(null)

watch(() => route.fullPath, () => {
  if (contentRef.value) {
    contentRef.value.scrollTop = 0
  }
}, { flush: 'post' })
</script>

<template>
  <div class="dtro-shell" :class="{ 'dtro-shell--train': train }">
    <DtroHeader />
    <div class="dtro-shell__layout">
      <DtroSideMenu />
      <main ref="contentRef" class="dtro-shell__content" :class="{ 'dtro-shell__content--centered': centered }">
        <slot />
      </main>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use "@styles/variables/dtro" as dtro;

.dtro-shell {
  display: grid;
  block-size: 100vh;
  block-size: 100dvh;
  grid-template-rows: dtro.$header-height minmax(0, 1fr);
  overflow: hidden;
  background: rgb(var(--v-theme-background));
  color: rgb(var(--v-theme-on-background));
}

.dtro-shell__layout {
  display: grid;
  inline-size: 100%;
  min-block-size: 0;
  grid-template-columns: 224px minmax(0, 1fr);
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.dtro-shell__content {
  inline-size: 100%;
  min-inline-size: 0;
  min-block-size: 0;
  overflow-y: auto;
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
  .dtro-shell { grid-template-rows: dtro.$header-height-mobile minmax(0, 1fr); }
  .dtro-shell__layout {
    grid-template-columns: 136px minmax(0, 1fr);
  }
  .dtro-shell__content--centered { padding: 24px 14px 32px; }
  .dtro-shell--train .dtro-shell__layout {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto minmax(0, 1fr);
  }
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
