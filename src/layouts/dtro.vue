<script setup>
import DtroAppShell from '@/components/dtro/DtroAppShell.vue'
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <DtroAppShell :train="Boolean(route.meta.trainLayout)">
    <RouterView />
  </DtroAppShell>
</template>
