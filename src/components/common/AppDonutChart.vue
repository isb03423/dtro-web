<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  unit: { type: String, required: true },
})

const fn_number = value => new Intl.NumberFormat('ko-KR').format(value ?? 0)

const fn_percent = count => props.total ? Math.round(count / props.total * 100) : 0
const series = computed(() => props.items.map(item => item.count))

const options = computed(() => ({
  chart: { type: 'donut', toolbar: { show: false }, fontFamily: 'Malgun Gothic, Noto Sans KR, sans-serif' },
  labels: props.items.map(item => item.label),
  colors: props.items.map(item => item.color),
  dataLabels: { enabled: false },
  legend: { show: false },
  stroke: { width: 2, colors: ['#fff'] },
  plotOptions: {
    pie: {
      donut: {
        size: '70%',
        labels: {
          show: true,
          name: { show: true, offsetY: -7, color: '#75808f' },
          value: { show: true, offsetY: 7, color: '#263241', formatter: value => fn_number(Number(value)) },
          total: { show: true, showAlways: true, label: '전체', formatter: () => fn_number(props.total) },
        },
      },
    },
  },
  tooltip: { y: { formatter: value => `${fn_number(value)}${props.unit}` } },
}))
</script>

<template>
  <div class="app-donut-chart">
    <div class="app-donut-chart__visual" aria-hidden="true">
      <VueApexCharts v-if="total > 0" type="donut" width="220" height="220" :options="options" :series="series" />
      <div v-else class="app-donut-chart__zero"><span>전체<strong>0</strong></span></div>
    </div>
    <ul class="app-donut-chart__legend" aria-label="항목별 집계">
      <li v-for="item in items" :key="item.value">
        <span class="app-donut-chart__swatch" :style="{ backgroundColor: item.color }" aria-hidden="true" />
        <span class="app-donut-chart__label">{{ item.label }}</span>
        <strong>{{ fn_number(item.count) }}{{ unit }}</strong>
        <small>{{ fn_percent(item.count) }}%</small>
      </li>
    </ul>
  </div>
</template>
