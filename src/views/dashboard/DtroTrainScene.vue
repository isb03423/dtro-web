<script setup>
import stationImage from '@images/dtro/drawing-03-station.svg?url'
</script>

<template>
  <figure class="station-visual">
    <img
      class="station-visual__image"
      :src="stationImage"
      alt="대구 도시철도 열차와 캐릭터가 있는 역사 전경"
    >
  </figure>
</template>

<style lang="scss" scoped>
@use "@styles/variables/dtro" as dtro;

.station-visual {
  inline-size: 100%;
  overflow: hidden;
  margin: 0;
  background: dtro.$brand-sky;
  line-height: 0;
}

.station-visual__image {
  display: block;
  inline-size: 100%;
  block-size: auto;
  aspect-ratio: 1681 / 350;
  object-fit: cover;
  object-position: center;
}

@media (max-width: 900px) {
  .station-visual__image {
    min-block-size: 240px;
    object-position: center;
  }
}

@media (max-width: 640px) {
  .station-visual__image {
    min-block-size: 210px;
    object-position: 38% center;
  }
}

@media (max-width: 420px) {
  .station-visual__image {
    min-block-size: 190px;
    object-position: 34% center;
  }
}
</style>
