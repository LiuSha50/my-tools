import { describe, expect, test } from 'vitest'
import {
  createDefaultViewport,
  panViewport,
  zoomViewport,
} from './usePlotViewport'

describe('绘图视口', () => {
  test('缩放时请求的数据点保持在相同的相对位置', () => {
    const viewport = { xMin: -10, xMax: 10, yMin: -10, yMax: 10 }

    expect(zoomViewport(viewport, 2, { x: 2, y: -3 })).toEqual({
      xMin: -3,
      xMax: 7,
      yMin: -8,
      yMax: 2,
    })
  })

  test('平移保持每个轴的跨度', () => {
    const viewport = { xMin: -2, xMax: 6, yMin: -5, yMax: 3 }

    expect(panViewport(viewport, { x: 3, y: -2 })).toEqual({
      xMin: 1,
      xMax: 9,
      yMin: -7,
      yMax: 1,
    })
  })

  test('三角函数重置为 [-2π, 2π] 的横轴范围', () => {
    expect(createDefaultViewport('trig', ['sin'])).toEqual({
      xMin: -2 * Math.PI,
      xMax: 2 * Math.PI,
      yMin: -1.5,
      yMax: 1.5,
    })
  })

  test('含渐近线函数时使用更高的纵轴范围', () => {
    expect(createDefaultViewport('trig', ['tan'])).toEqual({
      xMin: -2 * Math.PI,
      xMax: 2 * Math.PI,
      yMin: -4,
      yMax: 4,
    })
  })

  test('反函数使用独立的默认范围', () => {
    expect(createDefaultViewport('inverse', ['arcsin'])).toEqual({
      xMin: -4,
      xMax: 4,
      yMin: -Math.PI,
      yMax: Math.PI,
    })
  })

  test('缩放和平移拒绝非有限输入', () => {
    const viewport = { xMin: -2, xMax: 2, yMin: -3, yMax: 3 }

    expect(zoomViewport(viewport, 2, { x: Number.NaN, y: 0 })).toEqual(viewport)
    expect(panViewport(viewport, { x: Infinity, y: 0 })).toEqual(viewport)
  })
})
