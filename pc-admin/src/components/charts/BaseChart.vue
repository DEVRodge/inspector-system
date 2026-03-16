<script setup>
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { init, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const props = defineProps({
  option: {
    type: Object,
    required: true,
  },
  height: {
    type: String,
    default: '320px',
  },
})

const containerRef = ref(null)
const chartInstance = shallowRef(null)
let resizeObserver

function resizeChart() {
  chartInstance.value?.resize()
}

function renderChart() {
  if (!containerRef.value) {
    return
  }

  if (!chartInstance.value) {
    chartInstance.value = init(containerRef.value)
  }

  chartInstance.value.setOption(props.option, true)
}

onMounted(() => {
  renderChart()

  resizeObserver = new ResizeObserver(() => {
    resizeChart()
  })

  if (containerRef.value) {
    resizeObserver.observe(containerRef.value)
  }

  window.addEventListener('resize', resizeChart)
})

watch(
  () => props.option,
  () => {
    renderChart()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', resizeChart)
  chartInstance.value?.dispose()
})
</script>

<template>
  <div ref="containerRef" :style="{ height, width: '100%' }" />
</template>
