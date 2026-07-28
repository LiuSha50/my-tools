// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, test, vi } from 'vitest'
import FunctionPlot from './FunctionPlot.vue'
import PlotTooltip from './PlotTooltip.vue'

const markerVisibility = {
  keyPoints: true,
  zeros: true,
  extrema: true,
  asymptotes: true,
}

function dispatchPointer(
  element: Element,
  type: string,
  init: { clientX?: number; clientY?: number; pointerId?: number; pointerType?: string } = {},
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
  })
  Object.defineProperties(event, {
    pointerId: { value: init.pointerId ?? 0 },
    pointerType: { value: init.pointerType ?? 'mouse' },
  })
  element.dispatchEvent(event)
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('FunctionPlot', () => {
  test('tan 渲染多个独立 path 和渐近线', async () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['tan'],
        category: 'trig',
        markerVisibility,
      },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[data-series="tan"] path').length).toBeGreaterThan(1)
    expect(wrapper.findAll('[data-asymptote]').length).toBeGreaterThan(0)
    expect(wrapper.get('[data-asymptote] line').attributes('stroke-dasharray')).toBeTruthy()
  })

  test('提供键盘可操作的缩放和重置按钮', () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility,
      },
    })

    expect(wrapper.find('button[aria-label="放大图像"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="缩小图像"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="重置图像范围"]').exists()).toBe(true)
    expect(wrapper.get('svg').attributes('role')).toBe('img')
  })

  test('三角函数横轴使用 π 刻度而纵轴使用数字刻度', () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility,
      },
    })

    expect(wrapper.get('[data-axis="x"]').text()).toContain('π')
    expect(wrapper.get('[data-axis="y"]').text()).not.toContain('π')
  })

  test('反三角函数横轴使用数字刻度而纵轴使用 π 刻度', () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['arcsin'],
        category: 'inverse',
        markerVisibility,
      },
    })

    expect(wrapper.get('[data-axis="x"]').text()).not.toContain('π')
    expect(wrapper.get('[data-axis="y"]').text()).toContain('π')
  })

  test('函数曲线使用目录中的线型并提供文字标签', () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['cos'],
        category: 'trig',
        markerVisibility,
      },
    })
    const path = wrapper.get('[data-series="cos"] path')

    expect(path.attributes('stroke-dasharray')).toBeTruthy()
    expect(path.text()).toContain('余弦函数')
    expect(wrapper.get('[data-series-label]').text()).toContain('余弦函数')
  })

  test('零尺寸 ResizeObserver 通知不生成路径', async () => {
    let resizeCallback: ResizeObserverCallback | undefined
    const disconnect = vi.fn()
    class FakeResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeCallback = callback
      }

      observe() {}
      disconnect = disconnect
      unobserve() {}
    }
    vi.stubGlobal('ResizeObserver', FakeResizeObserver)
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['tan'],
        category: 'trig',
        markerVisibility,
      },
    })

    resizeCallback?.([
      { contentRect: { width: 0, height: 0 } } as ResizeObserverEntry,
    ], {} as ResizeObserver)
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('[data-series="tan"] path')).toHaveLength(0)
    wrapper.get('svg').element.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      clientX: 100,
      clientY: 100,
      deltaY: -100,
    }))
    expect(wrapper.emitted('viewport-change')).toBeUndefined()
    wrapper.unmount()
    expect(disconnect).toHaveBeenCalledOnce()
  })

  test('滚轮缩放保持指针所在数据点的相对位置', async () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility,
      },
    })
    const pointer = { x: 200, y: 100 }
    const original = {
      xMin: -2 * Math.PI,
      xMax: 2 * Math.PI,
      yMin: -1.5,
      yMax: 1.5,
    }
    const anchor = {
      x: original.xMin + ((pointer.x - 54) / (800 - 54 - 24)) * (original.xMax - original.xMin),
      y: original.yMax - ((pointer.y - 22) / (420 - 22 - 42)) * (original.yMax - original.yMin),
    }

    wrapper.get('svg').element.dispatchEvent(new WheelEvent('wheel', {
      bubbles: true,
      clientX: pointer.x,
      clientY: pointer.y,
      deltaY: -100,
    }))
    await wrapper.vm.$nextTick()
    const next = wrapper.emitted('viewport-change')?.at(-1)?.[0] as typeof original

    expect(next.xMax - next.xMin).toBeLessThan(original.xMax - original.xMin)
    expect((anchor.x - next.xMin) / (next.xMax - next.xMin)).toBeCloseTo(
      (anchor.x - original.xMin) / (original.xMax - original.xMin),
    )
    expect((anchor.y - next.yMin) / (next.yMax - next.yMin)).toBeCloseTo(
      (anchor.y - original.yMin) / (original.yMax - original.yMin),
    )
  })

  test('鼠标拖动超过 3px 后才平移视口', async () => {
    let pendingFrame: FrameRequestCallback | undefined
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      pendingFrame = callback
      return 17
    })
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility,
      },
    })
    const svg = wrapper.get('svg')

    dispatchPointer(svg.element, 'pointerdown', { clientX: 200, clientY: 100, pointerId: 1 })
    dispatchPointer(svg.element, 'pointermove', { clientX: 202, clientY: 102, pointerId: 1 })
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('viewport-change')).toBeUndefined()

    dispatchPointer(svg.element, 'pointermove', { clientX: 210, clientY: 100, pointerId: 1 })
    pendingFrame?.(0)
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('viewport-change')).toHaveLength(1)
  })

  test('点击固定提示，离开图像后保留，Escape 清除', async () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility,
      },
    })
    const svg = wrapper.get('svg')

    dispatchPointer(svg.element, 'pointermove', { clientX: 415, clientY: 210 })
    await wrapper.vm.$nextTick()
    await svg.trigger('click')
    expect(wrapper.get('[data-plot-tooltip]').attributes('data-pinned')).toBe('true')

    await svg.trigger('pointerleave')
    expect(wrapper.find('[data-plot-tooltip]').exists()).toBe(true)

    await svg.trigger('keydown', { key: 'Escape' })
    expect(wrapper.find('[data-plot-tooltip]').exists()).toBe(false)
  })

  test('触摸拖动十字准线不会平移视口', async () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility,
      },
    })
    const svg = wrapper.get('svg')

    dispatchPointer(svg.element, 'pointerdown', {
      clientX: 300,
      clientY: 180,
      pointerId: 2,
      pointerType: 'touch',
    })
    dispatchPointer(svg.element, 'pointermove', {
      clientX: 340,
      clientY: 200,
      pointerId: 2,
      pointerType: 'touch',
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-crosshair]').exists()).toBe(true)
    expect(wrapper.emitted('viewport-change')).toBeUndefined()
  })

  test('新的触摸拖动会移动上一次固定的十字准线', async () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility,
      },
    })
    const svg = wrapper.get('svg')

    dispatchPointer(svg.element, 'pointerdown', {
      clientX: 260,
      clientY: 180,
      pointerId: 3,
      pointerType: 'touch',
    })
    dispatchPointer(svg.element, 'pointerup', {
      clientX: 260,
      clientY: 180,
      pointerId: 3,
      pointerType: 'touch',
    })
    await wrapper.vm.$nextTick()
    const firstPosition = wrapper.get('[data-plot-tooltip]').attributes('transform')

    dispatchPointer(svg.element, 'pointerdown', {
      clientX: 520,
      clientY: 220,
      pointerId: 4,
      pointerType: 'touch',
    })
    dispatchPointer(svg.element, 'pointermove', {
      clientX: 560,
      clientY: 240,
      pointerId: 4,
      pointerType: 'touch',
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-plot-tooltip]').attributes('transform')).not.toBe(firstPosition)
  })

  test('按开关显示定义域和视口内的目录标记', () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility: { ...markerVisibility, zeros: false },
      },
    })

    expect(wrapper.find('[data-marker-kind="zero"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-marker-kind="maximum"]')).toHaveLength(1)
    expect(wrapper.get('[data-marker-kind="maximum"] title').text()).toContain('正弦函数')
    expect(wrapper.get('[data-marker-kind="maximum"] title').text()).toContain('π/2')
  })

  test('提示框按角度轴使用 π 坐标标签', () => {
    const wrapper = mount(PlotTooltip, {
      props: {
        dataPoint: {
          functionName: '正弦函数',
          x: Math.PI / 2,
          y: 1,
          svgX: 120,
          svgY: 80,
        },
        xIsAngle: true,
        yIsAngle: false,
        pinned: false,
      },
    })

    expect(wrapper.text()).toContain('x = π/2')
    expect(wrapper.text()).toContain('y = 1')
  })

  test('图像下方摘要列出函数、视口、可见渐近线和关键点', () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['tan'],
        category: 'trig',
        markerVisibility,
      },
    })
    const summary = wrapper.get('[data-plot-summary]').text()

    expect(summary).toContain('正切函数')
    expect(summary).toContain('视口')
    expect(summary).toContain('渐近线')
    expect(summary).toContain('关键点')
  })

  test('卸载时移除直接监听器并取消待处理动画帧', async () => {
    let pendingFrame: FrameRequestCallback | undefined
    const cancelAnimationFrame = vi.fn()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      pendingFrame = callback
      return 23
    })
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame)
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility,
      },
    })
    const svgElement = wrapper.get('svg').element
    const removeEventListener = vi.spyOn(svgElement, 'removeEventListener')

    dispatchPointer(wrapper.get('svg').element, 'pointerdown', {
      clientX: 100,
      clientY: 100,
      pointerId: 1,
    })
    dispatchPointer(wrapper.get('svg').element, 'pointermove', {
      clientX: 120,
      clientY: 100,
      pointerId: 1,
    })
    await wrapper.vm.$nextTick()
    expect(pendingFrame).toBeTypeOf('function')

    wrapper.unmount()

    expect(removeEventListener).toHaveBeenCalled()
    expect(cancelAnimationFrame).toHaveBeenCalledWith(23)
  })
})
