<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { getFunctionDefinition, inverseFunctionIds } from '../catalog'
import type { InverseRelation } from '../types'
import MathFormula from './MathFormula.vue'

type InversePairId = (typeof inverseFunctionIds)[number]

interface RelationPoint {
  x: number
  y: number
}

interface EndpointMarker extends RelationPoint {
  side: 'min' | 'max'
  kind: 'closed'
}

interface DomainBoundaryAnnotation {
  side: 'min' | 'max'
  x: number
}

const SVG_SIZE = 480
const PLOT_PADDING = 44
const DATA_MIN = -4
const DATA_MAX = 4
const SAMPLE_COUNT = 241

const selectedInverseId = ref<InversePairId>('arcsin')
const showOriginal = ref(true)
const showInverse = ref(true)
const showSymmetryAxis = ref(true)
const instanceId = useId()
const titleId = `inverse-relation-${instanceId}-title`
const descriptionId = `inverse-relation-${instanceId}-description`
const clipId = `inverse-relation-${instanceId}-clip`

const inverseDefinition = computed(() => getFunctionDefinition(selectedInverseId.value))
const relation = computed(() => requireInverseRelation(inverseDefinition.value.inverseRelation))
const originalDefinition = computed(() => getFunctionDefinition(relation.value.originalId))

const pairOptions = inverseFunctionIds.map(id => {
  const inverse = getFunctionDefinition(id)
  const pairRelation = requireInverseRelation(inverse.inverseRelation)
  const original = getFunctionDefinition(pairRelation.originalId)
  return {
    id,
    label: `${original.name} ↔ ${inverse.name}`,
  }
})

const readableRestriction = computed(() => toReadableMath(relation.value.restriction))
const readablePrincipalRange = computed(() => toReadableMath(
  inverseDefinition.value.principalRange ?? inverseDefinition.value.range,
))

const originalPoints = computed(() => sampleRestrictedOriginal(
  originalDefinition.value.evaluate,
  originalDefinition.value.isDefined,
  relation.value,
).filter(isInsideSquare))

const inversePoints = computed(() => originalPoints.value.map(point => ({
  x: point.y,
  y: point.x,
})))

const originalPath = computed(() => pointsToPath(originalPoints.value))
const inversePath = computed(() => pointsToPath(inversePoints.value))
const originalEndpoints = computed(() => getEndpointMarkers(
  originalPoints.value,
  relation.value,
))
const openDomainBoundaries = computed<DomainBoundaryAnnotation[]>(() => {
  const { min, max, minOpen, maxOpen } = relation.value.restrictionBounds
  const boundaries: DomainBoundaryAnnotation[] = []
  if (minOpen) boundaries.push({ side: 'min', x: min })
  if (maxOpen) boundaries.push({ side: 'max', x: max })
  return boundaries
})

function requireInverseRelation(value: InverseRelation | undefined): InverseRelation {
  if (!value) throw new Error('反函数目录项缺少对应关系')
  return value
}

function toReadableMath(value: string): string {
  return value.replaceAll('\\pi', 'π').replaceAll('\\', '')
}

function seriesColorStyle(style: { color: string; darkColor: string }): Record<string, string> {
  return {
    '--series-light-color': style.color,
    '--series-dark-color': style.darkColor,
  }
}

function selectPair(event: Event): void {
  const value = (event.currentTarget as HTMLSelectElement).value
  if (inverseFunctionIds.includes(value as InversePairId)) {
    selectedInverseId.value = value as InversePairId
  }
}

function sampleRestrictedOriginal(
  evaluate: (x: number) => number,
  isDefined: (x: number) => boolean,
  pairRelation: InverseRelation,
): RelationPoint[] {
  const { min, max, minOpen, maxOpen } = pairRelation.restrictionBounds
  return sampleRange(evaluate, isDefined, min, max, minOpen, maxOpen)
}

function sampleRange(
  evaluate: (x: number) => number,
  isDefined: (x: number) => boolean,
  min: number,
  max: number,
  minOpen: boolean,
  maxOpen: boolean,
): RelationPoint[] {
  const points: RelationPoint[] = []
  const openStep = (max - min) / (SAMPLE_COUNT + 1)
  const sampledMin = minOpen ? min + openStep : min
  const sampledMax = maxOpen ? max - openStep : max

  for (let index = 0; index < SAMPLE_COUNT; index += 1) {
    const ratio = index / (SAMPLE_COUNT - 1)
    const x = sampledMin + ratio * (sampledMax - sampledMin)
    if (!isDefined(x)) continue

    const y = evaluate(x)
    if (Number.isFinite(x) && Number.isFinite(y)) points.push({ x, y })
  }

  return points
}

function isInsideSquare(point: RelationPoint): boolean {
  return point.x >= DATA_MIN
    && point.x <= DATA_MAX
    && point.y >= DATA_MIN
    && point.y <= DATA_MAX
}

function toSvgX(x: number): number {
  const plotSize = SVG_SIZE - 2 * PLOT_PADDING
  return PLOT_PADDING + (x - DATA_MIN) / (DATA_MAX - DATA_MIN) * plotSize
}

function toSvgY(y: number): number {
  const plotSize = SVG_SIZE - 2 * PLOT_PADDING
  return PLOT_PADDING + (DATA_MAX - y) / (DATA_MAX - DATA_MIN) * plotSize
}

function pointsToPath(points: readonly RelationPoint[]): string {
  return points.map((point, index) => (
    `${index === 0 ? 'M' : 'L'} ${toSvgX(point.x).toFixed(2)} ${toSvgY(point.y).toFixed(2)}`
  )).join(' ')
}

function getEndpointMarkers(
  points: readonly RelationPoint[],
  pairRelation: InverseRelation,
): EndpointMarker[] {
  if (points.length === 0) return []

  const markers: EndpointMarker[] = []
  if (!pairRelation.restrictionBounds.minOpen) {
    markers.push({ ...points[0], side: 'min', kind: 'closed' })
  }
  if (!pairRelation.restrictionBounds.maxOpen) {
    markers.push({ ...points.at(-1)!, side: 'max', kind: 'closed' })
  }
  return markers
}
</script>

<template>
  <section class="inverse-relation-panel" aria-labelledby="inverse-relation-panel-title">
    <div class="relation-heading">
      <div>
        <p class="eyebrow">反函数关系</p>
        <h2 id="inverse-relation-panel-title">关于 y = x 的对称</h2>
      </div>

      <label class="pair-selector">
        <span>选择函数对</span>
        <select
          :value="selectedInverseId"
          aria-label="选择反函数关系"
          @change="selectPair"
        >
          <option
            v-for="option in pairOptions"
            :key="option.id"
            :value="option.id"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <div class="relation-layout">
      <div class="plot-shell">
        <svg
          data-inverse-relation-plot
          viewBox="0 0 480 480"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          :aria-labelledby="`${titleId} ${descriptionId}`"
        >
          <title :id="titleId">
            {{ originalDefinition.name }}与{{ inverseDefinition.name }}的对称关系图
          </title>
          <desc :id="descriptionId">
            受限原函数与反函数在等比例坐标系中关于 y 等于 x 对称。
          </desc>
          <defs>
            <clipPath :id="clipId">
              <rect
                :x="PLOT_PADDING"
                :y="PLOT_PADDING"
                :width="SVG_SIZE - 2 * PLOT_PADDING"
                :height="SVG_SIZE - 2 * PLOT_PADDING"
              />
            </clipPath>
          </defs>

          <rect
            class="plot-background"
            :x="PLOT_PADDING"
            :y="PLOT_PADDING"
            :width="SVG_SIZE - 2 * PLOT_PADDING"
            :height="SVG_SIZE - 2 * PLOT_PADDING"
          />
          <g class="coordinate-axes" aria-hidden="true">
            <line :x1="PLOT_PADDING" :y1="toSvgY(0)" :x2="SVG_SIZE - PLOT_PADDING" :y2="toSvgY(0)" />
            <line :x1="toSvgX(0)" :y1="PLOT_PADDING" :x2="toSvgX(0)" :y2="SVG_SIZE - PLOT_PADDING" />
            <text :x="SVG_SIZE - PLOT_PADDING + 6" :y="toSvgY(0) + 4">x</text>
            <text :x="toSvgX(0) + 7" :y="PLOT_PADDING - 8">y</text>
          </g>

          <g :clip-path="`url(#${clipId})`">
            <line
              v-if="showSymmetryAxis"
              data-axis="symmetry"
              :x1="toSvgX(DATA_MIN)"
              :y1="toSvgY(DATA_MIN)"
              :x2="toSvgX(DATA_MAX)"
              :y2="toSvgY(DATA_MAX)"
              stroke-dasharray="8 7"
            />

            <path
              v-if="showOriginal"
              data-series="original"
              data-sampling-source="shared-relation-points"
              :data-sampled-min-x="originalPoints[0]?.x"
              :data-sampled-max-x="originalPoints.at(-1)?.x"
              :d="originalPath"
              :style="seriesColorStyle(originalDefinition.style)"
            />
            <path
              v-if="showInverse"
              data-series="inverse"
              data-sampling-source="reflected-relation-points"
              :data-sampled-min-x="inversePoints[0]?.x"
              :data-sampled-max-x="inversePoints.at(-1)?.x"
              :d="inversePath"
              :style="seriesColorStyle(inverseDefinition.style)"
            />

            <g
              v-for="boundary in showOriginal ? openDomainBoundaries : []"
              :key="`domain-boundary-${boundary.side}`"
              data-domain-boundary="original"
              data-boundary-kind="open"
              data-represents="domain-boundary-not-function-point"
              :data-boundary-value="boundary.x"
              role="img"
              :aria-label="`${boundary.side === 'min' ? '左侧' : '右侧'}开放定义域边界 ${readableRestriction}；这是定义域边界轨道，不是函数坐标`"
            >
              <title>
                {{ boundary.side === 'min' ? '左侧' : '右侧' }}开放定义域边界；不是函数坐标
              </title>
              <line
                class="domain-boundary-track"
                :x1="toSvgX(boundary.x)"
                :x2="toSvgX(boundary.x)"
                :y1="toSvgY(DATA_MIN + 0.15)"
                :y2="toSvgY(DATA_MIN + 0.65)"
              />
              <text
                class="domain-boundary-label"
                :x="toSvgX(boundary.x)"
                :y="toSvgY(DATA_MIN + 0.78)"
                text-anchor="middle"
              >开</text>
            </g>

            <circle
              v-for="endpoint in showOriginal ? originalEndpoints : []"
              :key="endpoint.side"
              data-series-endpoint="original"
              :data-endpoint-kind="endpoint.kind"
              :cx="toSvgX(endpoint.x)"
              :cy="toSvgY(endpoint.y)"
              r="5"
              :style="seriesColorStyle(originalDefinition.style)"
              stroke-width="2.5"
            />
          </g>

          <text
            v-if="showSymmetryAxis"
            data-axis-label="symmetry"
            :x="toSvgX(2.6)"
            :y="toSvgY(2.6) - 9"
          >y = x</text>
        </svg>
      </div>

      <div class="relation-details">
        <div class="formula-card">
          <span class="formula-card__label">受限原函数</span>
          <MathFormula
            :formula="originalDefinition.formula"
            :label="`受限原函数公式：${originalDefinition.formula}`"
            display
          />
          <MathFormula
            :formula="`x \\in ${relation.restriction}`"
            :label="`${originalDefinition.name}限制区间：x \\in ${relation.restriction}`"
          />
        </div>

        <div class="formula-card">
          <span class="formula-card__label">对应反函数</span>
          <MathFormula
            :formula="inverseDefinition.formula"
            :label="`反函数公式：${inverseDefinition.formula}`"
            display
          />
          <p class="principal-range">
            主值：<span>{{ readablePrincipalRange }}</span>
          </p>
        </div>

        <p class="restriction-summary">
          {{ originalDefinition.name }}限制在
          <strong>{{ readableRestriction }}</strong> 后，与
          {{ inverseDefinition.name }}
          互为反函数。
        </p>

        <div class="visibility-controls" aria-label="关系图显示设置">
          <button
            type="button"
            :aria-pressed="showOriginal"
            aria-label="显示或隐藏受限原函数"
            @click="showOriginal = !showOriginal"
          >
            受限原函数
          </button>
          <button
            type="button"
            :aria-pressed="showInverse"
            aria-label="显示或隐藏反函数"
            @click="showInverse = !showInverse"
          >
            反函数
          </button>
          <button
            type="button"
            :aria-pressed="showSymmetryAxis"
            aria-label="显示或隐藏对称轴 y=x"
            @click="showSymmetryAxis = !showSymmetryAxis"
          >
            对称轴 y = x
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.inverse-relation-panel {
  min-width: 0;
  padding: clamp(16px, 3vw, 28px);
  border: 1px solid var(--color-border, #d9dde3);
  border-radius: 14px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #30343b);
}

.relation-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 4px;
  color: var(--color-primary, #2563eb);
  font-size: 0.8rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}

h2 {
  margin: 0;
  font-size: clamp(1.25rem, 3vw, 1.65rem);
}

.pair-selector {
  display: grid;
  gap: 6px;
  min-width: min(100%, 15rem);
  font-size: 0.875rem;
  font-weight: 650;
}

select {
  min-height: 42px;
  padding: 8px 34px 8px 11px;
  border: 1px solid var(--color-border, #d9dde3);
  border-radius: 8px;
  background: var(--color-surface, #fff);
  color: inherit;
  font: inherit;
}

.relation-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(16rem, 0.9fr);
  align-items: start;
  gap: clamp(18px, 4vw, 36px);
}

.plot-shell {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  background: var(--color-surface-soft, #f6f7f9);
  overflow: hidden;
}

svg {
  display: block;
  width: 100%;
  height: 100%;
}

.plot-background {
  fill: var(--color-surface, #fff);
  stroke: var(--color-border, #d9dde3);
}

.coordinate-axes line {
  stroke: var(--color-text-muted, #6b7280);
  stroke-width: 1;
}

.coordinate-axes text,
[data-axis-label="symmetry"] {
  fill: var(--color-text-muted, #6b7280);
  font-size: 13px;
}

[data-axis="symmetry"] {
  stroke: var(--color-text-muted, #6b7280);
  stroke-width: 1.5;
}

[data-series] {
  fill: none;
  stroke: var(--series-light-color);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

[data-series="inverse"] {
  stroke-dasharray: 9 5;
}

[data-series-endpoint] {
  fill: var(--series-light-color);
  stroke: var(--series-light-color);
}

.domain-boundary-track {
  stroke: var(--color-text-muted, #6b7280);
  stroke-width: 2;
  stroke-dasharray: 3 3;
}

.domain-boundary-label {
  fill: var(--color-text-muted, #6b7280);
  font-size: 11px;
  font-weight: 700;
}

.relation-details {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.formula-card {
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 14px;
  border: 1px solid var(--color-border, #d9dde3);
  border-radius: 10px;
  background: var(--color-surface-soft, #f6f7f9);
}

.formula-card__label {
  color: var(--color-text-muted, #6b7280);
  font-size: 0.8rem;
  font-weight: 700;
}

:deep(.math-formula) {
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.principal-range,
.restriction-summary {
  margin: 0;
  line-height: 1.65;
}

.principal-range span,
.restriction-summary strong {
  font-family: "Times New Roman", serif;
}

.visibility-controls {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

button {
  min-height: 42px;
  padding: 8px 10px;
  border: 1px solid var(--color-border, #d9dde3);
  border-radius: 8px;
  background: var(--color-surface, #fff);
  color: inherit;
  font: inherit;
  cursor: pointer;
}

button[aria-pressed="true"] {
  border-color: var(--color-primary, #2563eb);
  background: color-mix(in srgb, var(--color-primary, #2563eb) 11%, transparent);
  color: var(--color-primary, #2563eb);
}

select:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-primary, #2563eb);
  outline-offset: 2px;
}

@media (prefers-color-scheme: dark) {
  [data-series] {
    stroke: var(--series-dark-color);
  }

  [data-series-endpoint] {
    fill: var(--series-dark-color);
    stroke: var(--series-dark-color);
  }
}

@media (max-width: 780px) {
  .relation-heading,
  .relation-layout {
    display: grid;
    grid-template-columns: 1fr;
  }

  .pair-selector {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .visibility-controls {
    grid-template-columns: 1fr;
  }
}
</style>
