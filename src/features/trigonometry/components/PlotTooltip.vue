<script setup lang="ts">
import { computed } from 'vue'
import { formatPiMultiple } from '../plotting/piFormatting'

interface PlotTooltipPoint {
  functionName: string
  x: number
  y: number
  svgX: number
  svgY: number
}

const props = defineProps<{
  dataPoint: PlotTooltipPoint | null
  xIsAngle: boolean
  yIsAngle: boolean
  pinned: boolean
}>()

function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(3))
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

const xLabel = computed(() => props.dataPoint
  ? (props.xIsAngle ? formatPiMultiple(props.dataPoint.x) : formatNumber(props.dataPoint.x))
  : '')
const yLabel = computed(() => props.dataPoint
  ? (props.yIsAngle ? formatPiMultiple(props.dataPoint.y) : formatNumber(props.dataPoint.y))
  : '')
</script>

<template>
  <g
    v-if="dataPoint"
    data-plot-tooltip
    :data-pinned="String(pinned)"
    :transform="`translate(${dataPoint.svgX + 12} ${dataPoint.svgY - 52})`"
    class="plot-tooltip"
    pointer-events="none"
  >
    <rect width="164" height="50" rx="5" />
    <text x="9" y="17" class="tooltip-name">{{ dataPoint.functionName }}</text>
    <text x="9" y="37">x = {{ xLabel }}，y = {{ yLabel }}</text>
  </g>
</template>

<style scoped>
.plot-tooltip rect {
  fill: var(--color-surface, #fff);
  stroke: var(--color-border, #d9dde3);
  stroke-width: 1;
}

.plot-tooltip text {
  fill: var(--color-text, #30343b);
  font-size: 11px;
}

.tooltip-name {
  font-weight: 600;
}
</style>
