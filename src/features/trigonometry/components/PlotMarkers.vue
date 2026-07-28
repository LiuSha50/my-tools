<script setup lang="ts">
import { computed } from 'vue'
import { dataToSvg, type PlotSize, type PlotViewport } from '../plotting/coordinates'
import type { MathPoint } from '../types'

interface PlotMarkerEntry extends MathPoint {
  functionName: string
  color: string
  darkColor: string
}

const props = defineProps<{
  markers: readonly PlotMarkerEntry[]
  viewport: PlotViewport
  size: PlotSize
}>()

const positionedMarkers = computed(() => props.markers.map(marker => ({
  ...marker,
  svg: dataToSvg(marker, props.viewport, props.size),
})))
</script>

<template>
  <g class="plot-markers">
    <g
      v-for="marker in positionedMarkers"
      :key="marker.id"
      :data-marker-kind="marker.kind"
      :transform="`translate(${marker.svg.x} ${marker.svg.y})`"
      class="plot-marker"
      data-plot-marker
      :style="{
        '--marker-light-color': marker.color,
        '--marker-dark-color': marker.darkColor,
      }"
    >
      <circle
        v-if="marker.kind === 'zero'"
        stroke="var(--marker-color)"
        r="4.5"
        fill="var(--color-surface, #fff)"
        stroke-width="2"
      />
      <path
        v-else-if="marker.kind === 'maximum' || marker.kind === 'minimum'"
        :d="marker.kind === 'maximum' ? 'M 0 -6 L 6 5 L -6 5 Z' : 'M 0 6 L 6 -5 L -6 -5 Z'"
        fill="var(--marker-color)"
        stroke="var(--color-surface, #fff)"
        stroke-width="1.25"
      />
      <rect
        v-else
        x="-4"
        y="-4"
        width="8"
        height="8"
        fill="var(--marker-color)"
        stroke="var(--color-surface, #fff)"
        stroke-width="1.25"
        transform="rotate(45)"
      />
      <title>{{ marker.functionName }}：({{ marker.xLabel }}, {{ marker.yLabel }})</title>
    </g>
  </g>
</template>

<style scoped>
.plot-marker {
  --marker-color: var(--marker-light-color);
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .plot-marker {
    --marker-color: var(--marker-dark-color);
  }
}
</style>
