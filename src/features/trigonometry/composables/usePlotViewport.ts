import type { FunctionCategory, MainFunctionId } from '../types'
import type { DataPoint, PlotViewport } from '../plotting/coordinates'

const MIN_SPAN = 1e-4
const MAX_SPAN = 1e4
const ASYMPTOTE_FUNCTIONS = new Set<MainFunctionId>(['tan', 'cot', 'sec', 'csc'])

function isFinitePoint(point: DataPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y)
}

function clampSpan(span: number): number {
  return Math.min(MAX_SPAN, Math.max(MIN_SPAN, span))
}

export function createDefaultViewport(
  category: FunctionCategory,
  selectedIds: readonly MainFunctionId[],
): PlotViewport {
  if (category === 'inverse') {
    return { xMin: -4, xMax: 4, yMin: -Math.PI, yMax: Math.PI }
  }

  const yExtent = selectedIds.some(id => ASYMPTOTE_FUNCTIONS.has(id)) ? 4 : 1.5
  return { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -yExtent, yMax: yExtent }
}

export function zoomViewport(
  viewport: PlotViewport,
  factor: number,
  center: DataPoint,
): PlotViewport {
  if (!Number.isFinite(factor) || factor <= 0 || !isFinitePoint(center)) {
    return viewport
  }

  const previousXSpan = viewport.xMax - viewport.xMin
  const previousYSpan = viewport.yMax - viewport.yMin
  const xSpan = clampSpan(previousXSpan / factor)
  const ySpan = clampSpan(previousYSpan / factor)
  const xAnchorRatio = (center.x - viewport.xMin) / previousXSpan
  const yAnchorRatio = (center.y - viewport.yMin) / previousYSpan

  return {
    xMin: center.x - xAnchorRatio * xSpan,
    xMax: center.x + (1 - xAnchorRatio) * xSpan,
    yMin: center.y - yAnchorRatio * ySpan,
    yMax: center.y + (1 - yAnchorRatio) * ySpan,
  }
}

export function panViewport(viewport: PlotViewport, delta: DataPoint): PlotViewport {
  if (!isFinitePoint(delta)) return viewport

  return {
    xMin: viewport.xMin + delta.x,
    xMax: viewport.xMax + delta.x,
    yMin: viewport.yMin + delta.y,
    yMax: viewport.yMax + delta.y,
  }
}
