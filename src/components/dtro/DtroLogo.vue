<script setup>
import dtroLogo from '@/assets/images/devtro/devtro_horizontal_logo.svg?url'
</script>

<template>
  <RouterLink to="/" class="dtro-logo" aria-label="대구교통공사 홈">
    <img :src="dtroLogo" alt="DTRO 대구교통공사" />
  </RouterLink>
</template>

<style lang="scss" scoped>
@use '@styles/variables/dtro' as dtro;

.dtro-logo {
  display: inline-flex;
  inline-size: clamp(160px, 14vw, 210px);
  flex: 0 0 auto;
  align-items: center;
  text-decoration: none;
}

.dtro-logo img {
  display: block;
  inline-size: 100%;
  block-size: auto;
  max-block-size: dtro.$auth-header-height;
  aspect-ratio: 269 / 90;
  object-fit: contain;
}

.dtro-logo:focus-visible {
  border-radius: dtro.$radius;
  outline: 3px solid dtro.$focus-accent;
  outline-offset: 3px;
}

@media (max-width: 640px) {
  .dtro-logo {
    inline-size: clamp(118px, 34vw, 145px);
  }
}

@media (max-width: 380px) {
  .dtro-logo {
    inline-size: 112px;
  }
}
</style>
