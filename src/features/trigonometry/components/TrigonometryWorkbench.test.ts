// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import FunctionPlot from './FunctionPlot.vue'
import TrigonometryWorkbench from './TrigonometryWorkbench.vue'

describe('TrigonometryWorkbench', () => {
  test('默认选中 sin 并显示完整性质', () => {
    const wrapper = mount(TrigonometryWorkbench)

    expect((wrapper.get('input[value="sin"]').element as HTMLInputElement).checked).toBe(true)
    for (const heading of [
      '定义域',
      '值域',
      '奇偶性',
      '单调递增区间',
      '单调递减区间',
      '最小正周期',
      '零点',
      '极值',
      '竖直渐近线',
      '水平渐近线',
      '连续区间',
      '导数',
      '端点说明',
      '极限说明',
      '关键坐标',
    ]) {
      expect(wrapper.text()).toContain(heading)
    }
    expect(wrapper.get('table').attributes('aria-label')).toBe('所选函数性质比较')
  })

  test('目录中的中英混合性质以安全公式呈现且不产生 KaTeX 警告', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    mount(TrigonometryWorkbench)

    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  test('第五个函数被拒绝并显示就近提示', async () => {
    const wrapper = mount(TrigonometryWorkbench)

    for (const id of ['cos', 'tan', 'cot']) {
      await wrapper.get(`input[value="${id}"]`).setValue(true)
    }
    await wrapper.get('input[value="sec"]').setValue(true)

    expect(wrapper.get('[data-selection-error]').text()).toContain('最多比较 4 个函数')
    expect(wrapper.get('[data-selection-error]').attributes('aria-live')).toBe('polite')
    expect((wrapper.get('input[value="sec"]').element as HTMLInputElement).checked).toBe(false)
  })

  test('无选择时提供恢复默认按钮', async () => {
    const wrapper = mount(TrigonometryWorkbench)

    await wrapper.get('input[value="sin"]').setValue(false)

    expect(wrapper.text()).toContain('尚未选择函数')
    expect(wrapper.findComponent(FunctionPlot).exists()).toBe(false)
    expect(wrapper.get('button[data-action="restore-default"]').text()).toContain('恢复默认')
  })

  test('选择器使用原生控件并呈现颜色、线型、公式和标记状态', async () => {
    const wrapper = mount(TrigonometryWorkbench)
    const selector = wrapper.get('[data-function-selector]')
    const fieldset = selector.get('fieldset')
    const sin = fieldset.get('input[value="sin"]')
    const label = fieldset.get(`label[for="${sin.attributes('id')}"]`)

    expect(fieldset.get('legend').text()).toContain('选择函数')
    expect(sin.attributes('type')).toBe('checkbox')
    expect(sin.attributes('id')).toBe('trigonometry-function-sin')
    expect(label.find('[data-function-swatch]').exists()).toBe(true)
    expect(label.find('[data-line-pattern]').attributes('data-pattern')).toBe('solid')
    expect(label.get('[role="math"]').attributes('aria-label')).toContain('正弦函数')

    const markerButton = selector.get('button[data-marker="zeros"]')
    expect(markerButton.attributes('aria-pressed')).toBe('true')
    await markerButton.trigger('click')
    expect(markerButton.attributes('aria-pressed')).toBe('false')
  })

  test('切换类别时分别保留三角函数与反三角函数选择', async () => {
    const wrapper = mount(TrigonometryWorkbench)

    await wrapper.get('input[value="cos"]').setValue(true)
    await wrapper.get('button[data-category="inverse"]').trigger('click')
    expect((wrapper.get('input[value="arcsin"]').element as HTMLInputElement).checked).toBe(true)
    await wrapper.get('input[value="arccos"]').setValue(true)

    await wrapper.get('button[data-category="trig"]').trigger('click')
    expect((wrapper.get('input[value="sin"]').element as HTMLInputElement).checked).toBe(true)
    expect((wrapper.get('input[value="cos"]').element as HTMLInputElement).checked).toBe(true)

    await wrapper.get('button[data-category="inverse"]').trigger('click')
    expect((wrapper.get('input[value="arcsin"]').element as HTMLInputElement).checked).toBe(true)
    expect((wrapper.get('input[value="arccos"]').element as HTMLInputElement).checked).toBe(true)
  })

  test('普通多选保留缩放，类别变化重置为兼容视口', async () => {
    const wrapper = mount(TrigonometryWorkbench)
    const plot = wrapper.getComponent(FunctionPlot)

    await plot.get('button[aria-label="放大图像"]').trigger('click')
    const zoomedViewport = plot.emitted('viewport-change')?.at(-1)?.[0]
    await wrapper.get('input[value="cos"]').setValue(true)
    expect(plot.emitted('viewport-change')?.at(-1)?.[0]).toEqual(zoomedViewport)
    expect(plot.emitted('viewport-change')).toHaveLength(1)

    await wrapper.get('button[data-category="inverse"]').trigger('click')
    expect(plot.emitted('viewport-change')?.at(-1)?.[0]).toEqual({
      xMin: -4,
      xMax: 4,
      yMin: -Math.PI,
      yMax: Math.PI,
    })
  })
})
