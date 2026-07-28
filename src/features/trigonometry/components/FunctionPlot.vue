<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { getFunctionDefinition } from '../catalog'
import { createDefaultViewport, panViewport, zoomViewport } from '../composables/usePlotViewport'
import { getVisibleBranches } from '../plotting/branches'
import {
  dataToSvg,
  svgToData,
  type DataPoint,
  type PlotSize,
  type PlotViewport,
  type SvgPoint,
} from '../plotting/coordinates'
import { formatPiMultiple } from '../plotting/piFormatting'
import { sampleFunctionBranches } from '../plotting/sampling'
import type { MainFunctionId, MathPoint } from '../types'
import PlotAxes from './PlotAxes.vue'
import PlotMarkers from './PlotMarkers.vue'
import PlotSeries from './PlotSeries.vue'
import PlotTooltip from './PlotTooltip.vue'

interface MarkerVisibility {
  keyPoints: boolean
  zeros: boolean
  extrema: boolean
  asymptotes: boolean
}

interface PlotAsymptote {
  id: string
  orientation: 'vertical' | 'horizontal'
  value: number
  label: string
}

interface PlotMarkerEntry extends MathPoint {
  functionName: string
  color: string
  darkColor: string
}

interface InteractivePoint {
  functionName: string
  x: number
  y: number
  svgX: number
  svgY: number
}

interface PointerState {
  id: number
  pointerType: string
  start: SvgPoint
  previous: SvgPoint
  dragging: boolean
}

const props = defineProps<{
  functionIds: MainFunctionId[]
  category: 'trig' | 'inverse'
  markerVisibility: MarkerVisibility
}>()

const emit = defineEmits<{
  'viewport-change': [viewport: PlotViewport]
}>()

const FALLBACK_SIZE = { width: 800, height: 420 }
const PADDING = { top: 22, right: 24, bottom: 42, left: 54 }
const plotInstanceId = useId()
const plotTitleId = `function-plot-${plotInstanceId}-title`
const plotDescriptionId = `function-plot-${plotInstanceId}-description`
const container = ref<HTMLElement | null>(null)
const svgElement = ref<SVGSVGElement | null>(null)
const measuredSize = ref({ width: 0, height: 0 })
const viewport = ref<PlotViewport>(createDefaultViewport(props.category, props.functionIds))
let resizeObserver: ResizeObserver | undefined
let pointerState: PointerState | undefined
let pendingPanDelta: DataPoint | undefined
let animationFrameId: number | undefined
let suppressClick = false
const hoverPoint = ref<InteractivePoint | null>(null)
const pinnedPoint = ref<InteractivePoint | null>(null)

const definitions = computed(() => props.functionIds
  .map(id => getFunctionDefinition(id))
  .filter(definition => definition.category === props.category))

const size = computed<PlotSize>(() => ({
  width: measuredSize.value.width,
  height: measuredSize.value.height,
  padding: PADDING,
}))

const hasPositivePlotSize = computed(() => (
  size.value.width > PADDING.left + PADDING.right
  && size.value.height > PADDING.top + PADDING.bottom
))

const sampledSeries = computed(() => new Map(definitions.value.map(definition => [
  definition.id,
  hasPositivePlotSize.value
    ? sampleFunctionBranches(definition, viewport.value, {
        width: size.value.width - PADDING.left - PADDING.right,
        samplesPerPixel: 0.75,
      })
    : [],
])))

function parseCatalogValue(expression: string): number | undefined {
  const rawValue = expression.split('=').at(-1)?.trim()
    .replaceAll('\\', '')
    .replaceAll('{', '')
    .replaceAll('}', '')
    .replaceAll('−', '-')

  if (!rawValue) return undefined
  const numericValue = Number(rawValue)
  if (Number.isFinite(numericValue)) return numericValue

  const match = rawValue.match(/^([+-]?)(\d*)pi(?:\/(\d+))?$/)
  if (!match) return undefined
  const sign = match[1] === '-' ? -1 : 1
  const numerator = match[2] === '' ? 1 : Number(match[2])
  const denominator = match[3] ? Number(match[3]) : 1
  return sign * numerator * Math.PI / denominator
}

function plainMathLabel(label: string): string {
  return label
    .replaceAll('\\operatorname', '')
    .replaceAll('\\pi', 'π')
    .replaceAll('\\', '')
    .replaceAll('{', '')
    .replaceAll('}', '')
    .replaceAll('-', '−')
}

const visibleAsymptotes = computed<PlotAsymptote[]>(() => {
  if (!props.markerVisibility.asymptotes) return []
  const result: PlotAsymptote[] = []

  for (const definition of definitions.value) {
    const branchIntervals = getVisibleBranches(
      definition.id,
      viewport.value.xMin,
      viewport.value.xMax,
    )
    const verticalValues = new Set<number>()
    for (const interval of branchIntervals) {
      if (interval.minOpen && interval.min > viewport.value.xMin) verticalValues.add(interval.min)
      if (interval.maxOpen && interval.max < viewport.value.xMax) verticalValues.add(interval.max)
    }
    for (const value of verticalValues) {
      result.push({
        id: `${definition.id}-vertical-${value}`,
        orientation: 'vertical',
        value,
        label: plainMathLabel(definition.verticalAsymptotes[0] ?? `x = ${value}`),
      })
    }

    for (const label of definition.horizontalAsymptotes) {
      const value = parseCatalogValue(label)
      if (value === undefined || value < viewport.value.yMin || value > viewport.value.yMax) continue
      result.push({
        id: `${definition.id}-horizontal-${value}`,
        orientation: 'horizontal',
        value,
        label: plainMathLabel(label),
      })
    }
  }

  return result
})

function isMarkerEnabled(point: MathPoint): boolean {
  if (point.kind === 'zero') return props.markerVisibility.zeros
  if (point.kind === 'maximum' || point.kind === 'minimum') return props.markerVisibility.extrema
  return props.markerVisibility.keyPoints
}

const visibleMarkers = computed<PlotMarkerEntry[]>(() => definitions.value.flatMap(definition => (
  definition.keyPoints
    .filter(point => (
      isMarkerEnabled(point)
      && definition.isDefined(point.x)
      && point.x >= viewport.value.xMin
      && point.x <= viewport.value.xMax
      && point.y >= viewport.value.yMin
      && point.y <= viewport.value.yMax
    ))
    .map(point => ({
      ...point,
      xLabel: plainMathLabel(point.xLabel),
      yLabel: plainMathLabel(point.yLabel),
      functionName: definition.name,
      color: definition.style.color,
      darkColor: definition.style.darkColor,
    }))
)))

const activeTooltip = computed<InteractivePoint | null>(() => {
  const point = pinnedPoint.value ?? hoverPoint.value
  if (!point || !hasPositivePlotSize.value) return point
  const projected = dataToSvg(point, viewport.value, size.value)
  return {
    ...point,
    svgX: projected.x,
    svgY: projected.y,
  }
})
const isTooltipPinned = computed(() => pinnedPoint.value !== null)
const plotTitle = computed(() => props.category === 'inverse'
  ? '反三角函数交互图像'
  : '三角函数交互图像')

function formatNumber(value: number): string {
  const rounded = Number(value.toFixed(2))
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

function formatAxisValue(value: number, angle: boolean): string {
  return angle ? formatPiMultiple(value) : formatNumber(value)
}

const plotSummary = computed(() => {
  const xIsAngle = props.category === 'trig'
  const yIsAngle = props.category === 'inverse'
  const names = definitions.value.map(definition => definition.name).join('、') || '无'
  const xRange = `${formatAxisValue(viewport.value.xMin, xIsAngle)} 到 ${formatAxisValue(viewport.value.xMax, xIsAngle)}`
  const yRange = `${formatAxisValue(viewport.value.yMin, yIsAngle)} 到 ${formatAxisValue(viewport.value.yMax, yIsAngle)}`
  const asymptotes = visibleAsymptotes.value.map(item => item.label).join('、') || '无'
  const keyPoints = visibleMarkers.value
    .map(marker => `${marker.functionName}(${marker.xLabel}, ${marker.yLabel})`)
    .join('、') || '无'
  return `函数：${names}。视口：x 从 ${xRange}，y 从 ${yRange}。可见渐近线：${asymptotes}。可见关键点：${keyPoints}。`
})

const visiblePlotStatus = computed(() => {
  const xIsAngle = props.category === 'trig'
  const yIsAngle = props.category === 'inverse'
  const names = definitions.value.map(definition => definition.name).join('、') || '无函数'
  return `${names} · x [${formatAxisValue(viewport.value.xMin, xIsAngle)}, ${formatAxisValue(viewport.value.xMax, xIsAngle)}] · y [${formatAxisValue(viewport.value.yMin, yIsAngle)}, ${formatAxisValue(viewport.value.yMax, yIsAngle)}]`
})

function setViewport(nextViewport: PlotViewport) {
  viewport.value = nextViewport
  emit('viewport-change', { ...nextViewport })
}

function viewportCenter() {
  return {
    x: (viewport.value.xMin + viewport.value.xMax) / 2,
    y: (viewport.value.yMin + viewport.value.yMax) / 2,
  }
}

function zoom(factor: number) {
  setViewport(zoomViewport(viewport.value, factor, viewportCenter()))
}

function resetViewport() {
  cancelPendingInteraction()
  hoverPoint.value = null
  pinnedPoint.value = null
  setViewport(createDefaultViewport(props.category, props.functionIds))
}

function clientToSvg(event: Pick<PointerEvent | WheelEvent, 'clientX' | 'clientY'>): SvgPoint {
  const bounds = svgElement.value?.getBoundingClientRect()
  const widthScale = bounds && bounds.width > 0 ? size.value.width / bounds.width : 1
  const heightScale = bounds && bounds.height > 0 ? size.value.height / bounds.height : 1
  return {
    x: (event.clientX - (bounds?.left ?? 0)) * widthScale,
    y: (event.clientY - (bounds?.top ?? 0)) * heightScale,
  }
}

function nearestFunctionPoint(svgPoint: SvgPoint): InteractivePoint | null {
  if (!hasPositivePlotSize.value) return null
  const dataPoint = svgToData(svgPoint, viewport.value, size.value)
  let nearest: InteractivePoint | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const definition of definitions.value) {
    if (!definition.isDefined(dataPoint.x)) continue
    const y = definition.evaluate(dataPoint.x)
    if (!Number.isFinite(y) || y < viewport.value.yMin || y > viewport.value.yMax) continue
    const rendered = dataToSvg({ x: dataPoint.x, y }, viewport.value, size.value)
    const distance = Math.abs(rendered.y - svgPoint.y)
    if (distance >= nearestDistance) continue
    nearestDistance = distance
    nearest = {
      functionName: definition.name,
      x: dataPoint.x,
      y,
      svgX: rendered.x,
      svgY: rendered.y,
    }
  }

  return nearest
}

function updateHoverPoint(svgPoint: SvgPoint) {
  if (!pinnedPoint.value) hoverPoint.value = nearestFunctionPoint(svgPoint)
}

function applyPendingPan() {
  animationFrameId = undefined
  if (!pendingPanDelta) return
  const delta = pendingPanDelta
  pendingPanDelta = undefined
  setViewport(panViewport(viewport.value, delta))
}

function schedulePan(delta: DataPoint) {
  pendingPanDelta = pendingPanDelta
    ? { x: pendingPanDelta.x + delta.x, y: pendingPanDelta.y + delta.y }
    : delta
  if (animationFrameId !== undefined) return
  if (typeof requestAnimationFrame === 'undefined') {
    applyPendingPan()
    return
  }
  animationFrameId = requestAnimationFrame(applyPendingPan)
}

function cancelPendingInteraction() {
  if (animationFrameId !== undefined && typeof cancelAnimationFrame !== 'undefined') {
    cancelAnimationFrame(animationFrameId)
  }
  animationFrameId = undefined
  pendingPanDelta = undefined
  pointerState = undefined
  suppressClick = false
}

function onWheel(event: WheelEvent) {
  event.preventDefault()
  if (!hasPositivePlotSize.value) return
  const anchor = svgToData(clientToSvg(event), viewport.value, size.value)
  setViewport(zoomViewport(viewport.value, event.deltaY < 0 ? 1.2 : 1 / 1.2, anchor))
}

function onPointerDown(event: PointerEvent) {
  if (!hasPositivePlotSize.value) return
  const point = clientToSvg(event)
  pointerState = {
    id: event.pointerId,
    pointerType: event.pointerType,
    start: point,
    previous: point,
    dragging: false,
  }
  suppressClick = false
  try {
    svgElement.value?.setPointerCapture?.(event.pointerId)
  } catch {
    // Pointer capture can fail when the pointer is no longer active.
  }
  if (event.pointerType === 'touch') {
    pinnedPoint.value = null
    updateHoverPoint(point)
  }
}

function onPointerMove(event: PointerEvent) {
  if (!hasPositivePlotSize.value) return
  const point = clientToSvg(event)
  if (!pointerState || pointerState.id !== event.pointerId) {
    updateHoverPoint(point)
    return
  }

  if (pointerState.pointerType === 'touch') {
    updateHoverPoint(point)
    pointerState.previous = point
    return
  }

  const distance = Math.hypot(
    point.x - pointerState.start.x,
    point.y - pointerState.start.y,
  )
  if (!pointerState.dragging && distance <= 3) {
    updateHoverPoint(point)
    return
  }

  pointerState.dragging = true
  suppressClick = true
  hoverPoint.value = null
  const plotWidth = size.value.width - PADDING.left - PADDING.right
  const plotHeight = size.value.height - PADDING.top - PADDING.bottom
  const xSpan = viewport.value.xMax - viewport.value.xMin
  const ySpan = viewport.value.yMax - viewport.value.yMin
  schedulePan({
    x: -((point.x - pointerState.previous.x) / plotWidth) * xSpan,
    y: ((point.y - pointerState.previous.y) / plotHeight) * ySpan,
  })
  pointerState.previous = point
}

function finishPointer(event: PointerEvent) {
  if (!pointerState || pointerState.id !== event.pointerId) return
  if (pointerState.pointerType === 'touch') {
    updateHoverPoint(clientToSvg(event))
    pinnedPoint.value = hoverPoint.value
  }
  try {
    svgElement.value?.releasePointerCapture?.(event.pointerId)
  } catch {
    // Pointer capture may already have been released by the browser.
  }
  pointerState = undefined
}

function onPointerLeave() {
  if (!pointerState && !pinnedPoint.value) hoverPoint.value = null
}

function onClick() {
  if (suppressClick) {
    suppressClick = false
    return
  }
  if (hoverPoint.value) pinnedPoint.value = hoverPoint.value
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Escape') return
  pinnedPoint.value = null
  hoverPoint.value = null
}

function addSvgListeners() {
  const svg = svgElement.value
  if (!svg) return
  svg.addEventListener('wheel', onWheel, { passive: false })
  svg.addEventListener('pointerdown', onPointerDown)
  svg.addEventListener('pointermove', onPointerMove)
  svg.addEventListener('pointerup', finishPointer)
  svg.addEventListener('pointercancel', finishPointer)
  svg.addEventListener('pointerleave', onPointerLeave)
  svg.addEventListener('click', onClick)
  svg.addEventListener('keydown', onKeyDown)
}

function removeSvgListeners() {
  const svg = svgElement.value
  if (!svg) return
  svg.removeEventListener('wheel', onWheel)
  svg.removeEventListener('pointerdown', onPointerDown)
  svg.removeEventListener('pointermove', onPointerMove)
  svg.removeEventListener('pointerup', finishPointer)
  svg.removeEventListener('pointercancel', finishPointer)
  svg.removeEventListener('pointerleave', onPointerLeave)
  svg.removeEventListener('click', onClick)
  svg.removeEventListener('keydown', onKeyDown)
}

function measureContainer() {
  const bounds = container.value?.getBoundingClientRect()
  if (bounds && bounds.width > 0 && bounds.height > 0) {
    measuredSize.value = { width: bounds.width, height: bounds.height }
  }
}

watch(
  () => props.category,
  () => {
    resetViewport()
  },
)

onMounted(() => {
  addSvgListeners()
  if (typeof ResizeObserver !== 'undefined' && container.value) {
    resizeObserver = new ResizeObserver((entries) => {
      const bounds = entries[0]?.contentRect
      measuredSize.value = {
        width: bounds?.width ?? 0,
        height: bounds?.height ?? 0,
      }
    })
    resizeObserver.observe(container.value)
  } else {
    measureContainer()
    if (measuredSize.value.width <= 0 || measuredSize.value.height <= 0) {
      measuredSize.value = FALLBACK_SIZE
    }
  }
})

onBeforeUnmount(() => {
  removeSvgListeners()
  resizeObserver?.disconnect()
  resizeObserver = undefined
  cancelPendingInteraction()
})
</script>

<template>
  <section class="function-plot" aria-label="交互式函数图像">
    <div class="plot-toolbar" aria-label="图像范围控制">
      <button type="button" aria-label="放大图像" @click="zoom(1.25)">+</button>
      <button type="button" aria-label="缩小图像" @click="zoom(0.8)">−</button>
      <button type="button" aria-label="重置图像范围" @click="resetViewport">重置</button>
    </div>

    <div ref="container" class="plot-stage">
      <svg
        ref="svgElement"
        :viewBox="`0 0 ${size.width} ${size.height}`"
        role="img"
        :aria-labelledby="`${plotTitleId} ${plotDescriptionId}`"
        tabindex="0"
      >
        <title :id="plotTitleId">{{ plotTitle }}</title>
        <desc :id="plotDescriptionId">显示所选函数、坐标轴、关键点与渐近线。</desc>
        <template v-if="hasPositivePlotSize">
          <PlotAxes
            :category="category"
            :viewport="viewport"
            :size="size"
            :asymptotes="visibleAsymptotes"
          />
          <PlotSeries
            v-for="definition in definitions"
            :key="definition.id"
            :definition="definition"
            :branches="sampledSeries.get(definition.id) ?? []"
            :viewport="viewport"
            :size="size"
          />
          <PlotMarkers
            :markers="visibleMarkers"
            :viewport="viewport"
            :size="size"
          />
          <g
            v-if="activeTooltip"
            data-crosshair
            class="crosshair"
          >
            <line
              :x1="activeTooltip.svgX"
              :x2="activeTooltip.svgX"
              :y1="PADDING.top"
              :y2="size.height - PADDING.bottom"
            />
            <line
              :x1="PADDING.left"
              :x2="size.width - PADDING.right"
              :y1="activeTooltip.svgY"
              :y2="activeTooltip.svgY"
            />
          </g>
          <PlotTooltip
            :data-point="activeTooltip"
            :x-is-angle="category === 'trig'"
            :y-is-angle="category === 'inverse'"
            :pinned="isTooltipPinned"
          />
        </template>
      </svg>
    </div>
    <p class="plot-status" aria-hidden="true">{{ visiblePlotStatus }}</p>
    <p class="plot-summary" data-plot-summary>{{ plotSummary }}</p>
  </section>
</template>

<style scoped>
.function-plot {
  min-width: 0;
}

.plot-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-bottom: 8px;
}

.plot-toolbar button {
  min-width: 34px;
  min-height: 34px;
  padding: 5px 9px;
  border: 1px solid var(--color-border, #d9dde3);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text, #30343b);
  font: inherit;
  cursor: pointer;
}

.plot-toolbar button:focus-visible {
  outline: 2px solid var(--color-primary, #2563eb);
  outline-offset: 2px;
}

.plot-stage {
  width: 100%;
  height: clamp(320px, 42vw, 480px);
  min-height: 320px;
  overflow: hidden;
  border-radius: 8px;
  touch-action: none;
}

svg {
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.crosshair {
  pointer-events: none;
}

.crosshair line {
  stroke: var(--color-text-secondary, #747b86);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.plot-status {
  margin: 7px 0 0;
  color: var(--color-text-secondary, #747b86);
  font-size: 11px;
  line-height: 1.4;
  text-align: right;
}

.plot-summary {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
