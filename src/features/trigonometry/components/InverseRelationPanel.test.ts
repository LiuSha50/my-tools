// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { getFunctionDefinition } from '../catalog'
import InverseRelationPanel from './InverseRelationPanel.vue'

function parsePathPoints(path: string): Array<{ x: number; y: number }> {
  return Array.from(path.matchAll(/[ML] (-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g), match => ({
    x: Number(match[1]),
    y: Number(match[2]),
  }))
}

describe('InverseRelationPanel', () => {
  test('三个显示开关彼此独立', async () => {
    const wrapper = mount(InverseRelationPanel)
    const original = wrapper.get('button[aria-label="显示或隐藏受限原函数"]')
    const inverse = wrapper.get('button[aria-label="显示或隐藏反函数"]')
    const axis = wrapper.get('button[aria-label="显示或隐藏对称轴 y=x"]')

    await original.trigger('click')

    expect(original.attributes('aria-pressed')).toBe('false')
    expect(inverse.attributes('aria-pressed')).toBe('true')
    expect(axis.attributes('aria-pressed')).toBe('true')
    expect(wrapper.find('[data-series="original"]').exists()).toBe(false)
    expect(wrapper.find('[data-series="inverse"]').exists()).toBe(true)
    expect(wrapper.find('[data-axis="symmetry"]').exists()).toBe(true)
  })

  test('arccot 显示目录约定与限制区间', async () => {
    const wrapper = mount(InverseRelationPanel)
    await wrapper.get('select').setValue('arccot')

    const relation = getFunctionDefinition('arccot').inverseRelation
    const formulaLabels = wrapper.findAll('[role="math"]')
      .map(formula => formula.attributes('aria-label') ?? '')

    expect(wrapper.text()).toContain('(0, π)')
    expect(wrapper.text()).toContain('主值')
    expect(relation?.restriction).toBe('(0, \\pi)')
    expect(formulaLabels.some(label => label.includes(relation?.restriction ?? ''))).toBe(true)
    expect(formulaLabels.some(label => label.includes('\\operatorname{arccot} x'))).toBe(true)
  })

  test('使用原生配对选择器并可切换四组关系', async () => {
    const wrapper = mount(InverseRelationPanel)
    const selector = wrapper.get('select[aria-label="选择反函数关系"]')

    expect(selector.findAll('option').map(option => option.attributes('value'))).toEqual([
      'arcsin',
      'arccos',
      'arctan',
      'arccot',
    ])
    expect(selector.findAll('option').map(option => option.text())).toEqual([
      '正弦函数 ↔ 反正弦函数',
      '余弦函数 ↔ 反余弦函数',
      '正切函数 ↔ 反正切函数',
      '余切函数 ↔ 反余切函数',
    ])

    await selector.setValue('arccos')
    expect((selector.element as HTMLSelectElement).value).toBe('arccos')
    expect(wrapper.text()).toContain('[0, π]')
  })

  test('正方形等比例坐标系绘制带标签的 y=x 虚线', () => {
    const wrapper = mount(InverseRelationPanel)
    const svg = wrapper.get('svg[data-inverse-relation-plot]')
    const axis = svg.get('[data-axis="symmetry"]')

    expect(svg.attributes('viewBox')).toBe('0 0 480 480')
    expect(svg.attributes('preserveAspectRatio')).toBe('xMidYMid meet')
    expect(axis.attributes('stroke-dasharray')).toBeTruthy()
    expect(svg.get('[data-axis-label="symmetry"]').text()).toBe('y = x')
  })

  test.each(['arctan', 'arccot'] as const)(
    '%s 不把内部采样点伪装成开放端点并单独标注定义域边界',
    async id => {
      const wrapper = mount(InverseRelationPanel)
      await wrapper.get('select').setValue(id)
      const relation = getFunctionDefinition(id).inverseRelation
      const path = wrapper.get('[data-series="original"]')
      const endpoints = wrapper.findAll('[data-series-endpoint="original"]')
      const boundaries = wrapper.findAll('[data-domain-boundary="original"]')

      expect(Number(path.attributes('data-sampled-min-x')))
        .toBeGreaterThan(relation?.restrictionBounds.min ?? Number.POSITIVE_INFINITY)
      expect(Number(path.attributes('data-sampled-max-x')))
        .toBeLessThan(relation?.restrictionBounds.max ?? Number.NEGATIVE_INFINITY)
      expect(endpoints).toHaveLength(0)
      expect(boundaries).toHaveLength(2)
      for (const boundary of boundaries) {
        expect(boundary.attributes('data-boundary-kind')).toBe('open')
        expect(boundary.attributes('data-represents')).toBe('domain-boundary-not-function-point')
        expect(boundary.attributes('aria-label')).toContain('开放定义域边界')
        expect(boundary.attributes('aria-label')).toContain('不是函数坐标')
      }
    },
  )

  test.each(['arcsin', 'arccos'] as const)(
    '%s 的闭区间端点使用实心标记',
    async id => {
      const wrapper = mount(InverseRelationPanel)
      await wrapper.get('select').setValue(id)
      const endpoints = wrapper.findAll('[data-series-endpoint="original"]')

      expect(endpoints).toHaveLength(2)
      for (const endpoint of endpoints) {
        expect(endpoint.attributes('data-endpoint-kind')).toBe('closed')
        expect(endpoint.attributes('fill')).not.toBe('none')
      }
    },
  )

  test('反函数路径由共同可见关系点逐点交换坐标生成', async () => {
    const wrapper = mount(InverseRelationPanel)

    for (const id of ['arcsin', 'arccos', 'arctan', 'arccot']) {
      await wrapper.get('select').setValue(id)
      const original = wrapper.get('[data-series="original"]')
      const inverse = wrapper.get('[data-series="inverse"]')
      const originalPoints = parsePathPoints(original.attributes('d') ?? '')
      const inversePoints = parsePathPoints(inverse.attributes('d') ?? '')

      expect(original.attributes('data-sampling-source')).toBe('shared-relation-points')
      expect(inverse.attributes('data-sampling-source')).toBe('reflected-relation-points')
      expect(original.attributes('d')).not.toMatch(/NaN|Infinity/)
      expect(inverse.attributes('d')).not.toMatch(/NaN|Infinity/)
      expect(originalPoints.length).toBeGreaterThan(2)
      expect(inversePoints).toHaveLength(originalPoints.length)

      for (const [index, originalPoint] of originalPoints.entries()) {
        const inversePoint = inversePoints[index]
        expect(inversePoint?.x).toBeCloseTo(480 - originalPoint.y, 2)
        expect(inversePoint?.y).toBeCloseTo(480 - originalPoint.x, 2)
      }
    }
  })

  test('曲线主题变量同时消费 catalog 的浅色与深色颜色', async () => {
    const wrapper = mount(InverseRelationPanel)

    for (const id of ['arcsin', 'arccos', 'arctan', 'arccot'] as const) {
      await wrapper.get('select').setValue(id)
      const inverse = getFunctionDefinition(id)
      const relation = inverse.inverseRelation
      const original = getFunctionDefinition(relation!.originalId)
      const originalPath = wrapper.get<SVGPathElement>('[data-series="original"]')
      const inversePath = wrapper.get<SVGPathElement>('[data-series="inverse"]')

      expect(originalPath.element.style.getPropertyValue('--series-light-color'))
        .toBe(original.style.color)
      expect(originalPath.element.style.getPropertyValue('--series-dark-color'))
        .toBe(original.style.darkColor)
      expect(inversePath.element.style.getPropertyValue('--series-light-color'))
        .toBe(inverse.style.color)
      expect(inversePath.element.style.getPropertyValue('--series-dark-color'))
        .toBe(inverse.style.darkColor)
    }
  })
})
