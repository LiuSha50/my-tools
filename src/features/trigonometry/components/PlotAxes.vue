<script setup lang="ts">
import { computed } from 'vue'
import { dataToSvg, type PlotSize, type PlotViewport } from '../plotting/coordinates'
import { createPiTicks, type PlotTick } from '../plotting/piFormatting'

interface PlotAsymptote {
  id: string
  orientation: 'vertical' | 'horizontal'
  value: number
  label: string
}

const props = defineProps<{
  category: 'trig' | 'inverse'
  viewport: PlotViewport
  size: PlotSize
  asymptotes: readonly PlotAsymptote[]
}>()

function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(2))
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

function niceNumericTicks(min: number, max: number): PlotTick[] {
  const span = max - min
  const roughStep = span / 6
  const magnitude = 10 ** Math.floor(Math.log10(roughStep))
  const normalized = roughStep / magnitude
  const multiplier = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  const step = multiplier * magnitude
  const first = Math.ceil(min / step)
  const last = Math.floor(max / step)
  const ticks: PlotTick[] = []

  for (let index = first; index <= last; index += 1) {
    const value = index === 0 ? 0 : index * step
    ticks.push({ value, label: formatNumber(value) })
  }

  return ticks
}

function piTicks(min: number, max: number): PlotTick[] {
  const span = max - min
  const candidates = [Math.PI / 6, Math.PI / 4, Math.PI / 2, Math.PI, 2 * Math.PI, 4 * Math.PI]
  const step = candidates.find(candidate => span / candidate <= 8) ?? candidates.at(-1)!
  return createPiTicks(min, max, step)
}

const xTicks = computed(() => props.category === 'trig'
  ? piTicks(props.viewport.xMin, props.viewport.xMax)
  : niceNumericTicks(props.viewport.xMin, props.viewport.xMax))

const yTicks = computed(() => props.category === 'inverse'
  ? piTicks(props.viewport.yMin, props.viewport.yMax)
  : niceNumericTicks(props.viewport.yMin, props.viewport.yMax))

const plotLeft = computed(() => props.size.padding.left)
const plotRight = computed(() => props.size.width - props.size.padding.right)
const plotTop = computed(() => props.size.padding.top)
const plotBottom = computed(() => props.size.height - props.size.padding.bottom)
const xAxisY = computed(() => Math.min(plotBottom.value, Math.max(
  plotTop.value,
  dataToSvg({ x: 0, y: 0 }, props.viewport, props.size).y,
)))
const yAxisX = computed(() => Math.min(plotRight.value, Math.max(
  plotLeft.value,
  dataToSvg({ x: 0, y: 0 }, props.viewport, props.size).x,
)))

function xPosition(value: number): number {
  return dataToSvg({ x: value, y: 0 }, props.viewport, props.size).x
}

function yPosition(value: number): number {
  return dataToSvg({ x: 0, y: value }, props.viewport, props.size).y
}
</script>

<template>
  <g class="plot-axes">
    <rect
      :x="plotLeft"
      :y="plotTop"
      :width="plotRight - plotLeft"
      :height="plotBottom - plotTop"
      class="plot-background"
    />

    <g data-axis="x">
      <g
        v-for="tick in xTicks"
        :key="`x-${tick.value}`"
        data-tick
      >
        <line
          :x1="xPosition(tick.value)"
          :x2="xPosition(tick.value)"
          :y1="plotTop"
          :y2="plotBottom"
          class="grid-line"
        />
        <text
          :x="xPosition(tick.value)"
          :y="Math.min(plotBottom + 18, size.height - 5)"
          text-anchor="middle"
          data-tick-label
        >{{ tick.label }}</text>
      </g>
      <line
        :x1="plotLeft"
        :x2="plotRight"
        :y1="xAxisY"
        :y2="xAxisY"
        class="axis-line"
      />
    </g>

    <g data-axis="y">
      <g
        v-for="tick in yTicks"
        :key="`y-${tick.value}`"
        data-tick
      >
        <line
          :x1="plotLeft"
          :x2="plotRight"
          :y1="yPosition(tick.value)"
          :y2="yPosition(tick.value)"
          class="grid-line"
        />
        <text
          :x="Math.max(4, plotLeft - 8)"
          :y="yPosition(tick.value) + 4"
          text-anchor="end"
          data-tick-label
        >{{ tick.label }}</text>
      </g>
      <line
        :x1="yAxisX"
        :x2="yAxisX"
        :y1="plotTop"
        :y2="plotBottom"
        class="axis-line"
      />
    </g>

    <g class="asymptotes">
      <g
        v-for="asymptote in asymptotes"
        :key="asymptote.id"
        data-asymptote
        :data-orientation="asymptote.orientation"
      >
        <line
          v-if="asymptote.orientation === 'vertical'"
          :x1="xPosition(asymptote.value)"
          :x2="xPosition(asymptote.value)"
          :y1="plotTop"
          :y2="plotBottom"
          class="asymptote-line"
          stroke-dasharray="5 5"
        />
        <line
          v-else
          :x1="plotLeft"
          :x2="plotRight"
          :y1="yPosition(asymptote.value)"
          :y2="yPosition(asymptote.value)"
          class="asymptote-line"
          stroke-dasharray="5 5"
        />
        <text
          v-if="asymptote.orientation === 'vertical'"
          :x="xPosition(asymptote.value) + 4"
          :y="plotTop + 13"
        >{{ asymptote.label }}</text>
        <text
          v-else
          :x="plotRight - 4"
          :y="yPosition(asymptote.value) - 5"
          text-anchor="end"
        >{{ asymptote.label }}</text>
      </g>
    </g>
  </g>
</template>

<style scoped>
.plot-background {
  fill: var(--color-surface, #fff);
  stroke: var(--color-border, #d9dde3);
}

.grid-line {
  stroke: var(--color-border, #d9dde3);
  stroke-width: 1;
  opacity: 0.55;
}

.axis-line {
  stroke: var(--color-text, #30343b);
  stroke-width: 1.25;
}

.asymptote-line {
  stroke: var(--color-text-secondary, #747b86);
  stroke-width: 1.25;
}

text {
  fill: var(--color-text-secondary, #747b86);
  font-size: 11px;
  user-select: none;
}
</style>
