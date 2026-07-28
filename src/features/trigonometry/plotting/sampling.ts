import type { FunctionDefinition } from '../types'
import { getVisibleBranches, type BranchInterval } from './branches'
import type { DataPoint, PlotViewport } from './coordinates'

export interface SamplingOptions {
  width: number
  samplesPerPixel: number
}

export interface SampledBranch {
  id: string
  interval: BranchInterval
  points: DataPoint[]
}

const MIN_BOUNDARY_INSET = 1e-8
const Y_OVERSCAN_RATIO = 0.05

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function sampleBranch(
  definition: FunctionDefinition,
  interval: BranchInterval,
  viewport: PlotViewport,
  options: SamplingOptions,
): SampledBranch | undefined {
  const viewportSpan = viewport.xMax - viewport.xMin
  const boundaryInset = Math.max(viewportSpan / options.width / 4, MIN_BOUNDARY_INSET)
  const min = interval.min + (interval.minOpen ? boundaryInset : 0)
  const max = interval.max - (interval.maxOpen ? boundaryInset : 0)

  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    return undefined
  }

  const branchPixelWidth = ((max - min) / viewportSpan) * options.width
  const segmentCount = Math.max(1, Math.ceil(branchPixelWidth * options.samplesPerPixel))
  const yOverscan = Math.max((viewport.yMax - viewport.yMin) * Y_OVERSCAN_RATIO, MIN_BOUNDARY_INSET)
  const yMin = viewport.yMin - yOverscan
  const yMax = viewport.yMax + yOverscan
  const points: DataPoint[] = []

  for (let index = 0; index <= segmentCount; index += 1) {
    const x = min + ((max - min) * index) / segmentCount

    if (!definition.isDefined(x)) {
      continue
    }

    const y = definition.evaluate(x)
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      continue
    }

    points.push({ x, y: clamp(y, yMin, yMax) })
  }

  return points.length >= 2 ? { id: interval.id, interval, points } : undefined
}

export function sampleFunctionBranches(
  definition: FunctionDefinition,
  viewport: PlotViewport,
  options: SamplingOptions,
): SampledBranch[] {
  if (
    !Number.isFinite(options.width)
    || !Number.isFinite(options.samplesPerPixel)
    || options.width <= 0
    || options.samplesPerPixel <= 0
    || !Number.isFinite(viewport.xMin)
    || !Number.isFinite(viewport.xMax)
    || !Number.isFinite(viewport.yMin)
    || !Number.isFinite(viewport.yMax)
    || viewport.xMin >= viewport.xMax
    || viewport.yMin >= viewport.yMax
  ) {
    return []
  }

  return getVisibleBranches(definition.id, viewport.xMin, viewport.xMax)
    .map(interval => sampleBranch(definition, interval, viewport, options))
    .filter((branch): branch is SampledBranch => branch !== undefined)
}

export function pointsToPath(points: readonly DataPoint[]): string {
  const finitePoints = points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))

  if (finitePoints.length < 2) {
    return ''
  }

  return finitePoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')
}
