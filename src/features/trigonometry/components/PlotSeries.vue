<script setup lang="ts">
import { computed } from 'vue'
import type { FunctionDefinition } from '../types'
import { dataToSvg, type PlotSize, type PlotViewport } from '../plotting/coordinates'
import { pointsToPath, type SampledBranch } from '../plotting/sampling'

const props = defineProps<{
  definition: FunctionDefinition
  branches: readonly SampledBranch[]
  viewport: PlotViewport
  size: PlotSize
}>()

const dashPatterns = {
  solid: undefined,
  dashed: '10 6',
  'dash-dot': '10 5 2 5',
  dotted: '2 5',
} as const

const renderedBranches = computed(() => props.branches.map((branch) => {
  const svgPoints = branch.points.map(point => dataToSvg(point, props.viewport, props.size))
  return {
    id: branch.id,
    path: pointsToPath(svgPoints),
    endpoint: svgPoints.at(-1),
  }
}).filter(branch => branch.path !== ''))

const seriesLabel = computed(() => {
  const rightmostBranch = renderedBranches.value.reduce<(typeof renderedBranches.value)[number] | undefined>(
    (rightmost, branch) => !rightmost || (branch.endpoint?.x ?? -Infinity) > (rightmost.endpoint?.x ?? -Infinity)
      ? branch
      : rightmost,
    undefined,
  )
  if (!rightmostBranch?.endpoint) return undefined
  return {
    x: Math.min(props.size.width - props.size.padding.right - 6, rightmostBranch.endpoint.x - 6),
    y: Math.min(
      props.size.height - props.size.padding.bottom - 6,
      Math.max(props.size.padding.top + 13, rightmostBranch.endpoint.y - 6),
    ),
  }
})
</script>

<template>
  <g
    :data-series="definition.id"
    class="plot-series"
    :style="{
      '--series-light-color': definition.style.color,
      '--series-dark-color': definition.style.darkColor,
    }"
  >
    <path
      v-for="(branch, index) in renderedBranches"
      :key="branch.id"
      :d="branch.path"
      fill="none"
      stroke="var(--series-color)"
      :stroke-dasharray="dashPatterns[definition.style.pattern]"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2.25"
      vector-effect="non-scaling-stroke"
    >
      <title>{{ definition.name }}（{{ definition.style.label }}），连续分支 {{ index + 1 }}</title>
    </path>
    <text
      v-if="seriesLabel"
      data-series-label
      :x="seriesLabel.x"
      :y="seriesLabel.y"
      fill="var(--series-color)"
      text-anchor="end"
    >{{ definition.name }}</text>
  </g>
</template>

<style scoped>
.plot-series {
  --series-color: var(--series-light-color);
}

.plot-series path {
  transition: opacity 120ms ease;
}

.plot-series text {
  font-size: 11px;
  font-weight: 600;
  paint-order: stroke;
  stroke: var(--color-surface, #fff);
  stroke-width: 3px;
  stroke-linejoin: round;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .plot-series path {
    transition: none;
  }
}
</style>
