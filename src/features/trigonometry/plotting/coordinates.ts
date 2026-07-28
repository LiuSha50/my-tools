export interface PlotViewport {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

export interface PlotSize {
  width: number
  height: number
  padding: { top: number; right: number; bottom: number; left: number }
}

export interface DataPoint {
  x: number
  y: number
}

export interface SvgPoint {
  x: number
  y: number
}

export function dataToSvg(
  point: DataPoint,
  viewport: PlotViewport,
  size: PlotSize,
): SvgPoint {
  const plotWidth = size.width - size.padding.left - size.padding.right
  const plotHeight = size.height - size.padding.top - size.padding.bottom

  return {
    x: size.padding.left
      + ((point.x - viewport.xMin) / (viewport.xMax - viewport.xMin)) * plotWidth,
    y: size.padding.top
      + ((viewport.yMax - point.y) / (viewport.yMax - viewport.yMin)) * plotHeight,
  }
}

export function svgToData(
  point: SvgPoint,
  viewport: PlotViewport,
  size: PlotSize,
): DataPoint {
  const plotWidth = size.width - size.padding.left - size.padding.right
  const plotHeight = size.height - size.padding.top - size.padding.bottom

  return {
    x: viewport.xMin
      + ((point.x - size.padding.left) / plotWidth) * (viewport.xMax - viewport.xMin),
    y: viewport.yMax
      - ((point.y - size.padding.top) / plotHeight) * (viewport.yMax - viewport.yMin),
  }
}
