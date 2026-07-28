import { describe, expect, test } from 'vitest'
import {
  functionCatalog,
  getFunctionDefinition,
  inverseFunctionIds,
  mainFunctionIds,
  supplementFunctionIds,
  trigFunctionIds,
} from './catalog'

describe('三角函数目录', () => {
  test('包含 10 个主要函数和 2 个补充函数且 ID 唯一', () => {
    expect(trigFunctionIds).toEqual(['sin', 'cos', 'tan', 'cot', 'sec', 'csc'])
    expect(inverseFunctionIds).toEqual(['arcsin', 'arccos', 'arctan', 'arccot'])
    expect(supplementFunctionIds).toEqual(['arcsec', 'arccsc'])
    expect(mainFunctionIds).toHaveLength(10)
    expect(new Set(functionCatalog.map(item => item.id)).size).toBe(12)
  })

  test.each(mainFunctionIds)('%s 具有完整速查字段', id => {
    const item = getFunctionDefinition(id)
    expect(item.formula).toBeTruthy()
    expect(item.domain).toBeTruthy()
    expect(item.range).toBeTruthy()
    expect(item.parity).toBeTruthy()
    expect(item.increasingIntervals).toBeDefined()
    expect(item.decreasingIntervals).toBeDefined()
    expect(item.period).toBeTruthy()
    expect(item.zeros).toBeTruthy()
    expect(item.extrema).toBeTruthy()
    expect(item.continuousIntervals).toBeTruthy()
    expect(item.derivative).toBeTruthy()
    expect(item.keyPoints.length).toBeGreaterThan(0)
  })

  test('固定反三角函数主值约定', () => {
    expect(getFunctionDefinition('arcsin').principalRange).toBe('[-\\pi/2, \\pi/2]')
    expect(getFunctionDefinition('arccos').principalRange).toBe('[0, \\pi]')
    expect(getFunctionDefinition('arctan').principalRange).toBe('(-\\pi/2, \\pi/2)')
    expect(getFunctionDefinition('arccot').principalRange).toBe('(0, \\pi)')
    expect(getFunctionDefinition('arccot').evaluate(-1)).toBeCloseTo(3 * Math.PI / 4)
  })

  test('补充函数不进入主要反三角函数列表', () => {
    expect(supplementFunctionIds).not.toContain('arcsin')
    expect(getFunctionDefinition('arcsec').category).toBe('supplement')
    expect(getFunctionDefinition('arccsc').conventionNote).toContain('教材')
  })

  test('关键坐标可由计算函数复现', () => {
    for (const item of functionCatalog.filter(entry => entry.category !== 'supplement')) {
      for (const point of item.keyPoints) {
        expect(item.evaluate(point.x)).toBeCloseTo(point.y, 10)
      }
    }
  })

  test('arccos 的 (1, 0) 以单个点同时记录零点与最小值语义', () => {
    const points = getFunctionDefinition('arccos').keyPoints.filter(
      point => point.x === 1 && point.y === 0,
    )

    expect(points).toHaveLength(1)
    expect(points[0]).toMatchObject({
      id: 'arccos-zero-one',
      kind: 'minimum',
      additionalKinds: ['zero'],
    })
  })

  test('sec 和 csc 的单调区间在渐近线处分开', () => {
    expect(getFunctionDefinition('sec').increasingIntervals).toEqual([
      '(2k\\pi, \\pi/2 + 2k\\pi)',
      '(\\pi/2 + 2k\\pi, \\pi + 2k\\pi)',
    ])
    expect(getFunctionDefinition('csc').decreasingIntervals).toEqual([
      '(2k\\pi, \\pi/2 + 2k\\pi)',
      '(3\\pi/2 + 2k\\pi, 2\\pi + 2k\\pi)',
    ])
  })

  test.each([
    ['sec', 'x = 2k\\pi', 'x = \\pi + 2k\\pi'],
    ['csc', 'x = \\pi/2 + 2k\\pi', 'x = 3\\pi/2 + 2k\\pi'],
  ] as const)('%s 明确无全局最值并保留局部极值', (id, localMinimumAt, localMaximumAt) => {
    const extrema = getFunctionDefinition(id).extrema

    expect(extrema).toContain('无全局最大值或最小值')
    expect(extrema).toContain(`局部最小值 1：${localMinimumAt}`)
    expect(extrema).toContain(`局部最大值 -1：${localMaximumAt}`)
  })

  test('闭定义域不会因数值容差向外扩张', () => {
    for (const id of ['arcsin', 'arccos'] as const) {
      const item = getFunctionDefinition(id)
      expect(item.isDefined(-1)).toBe(true)
      expect(item.isDefined(1)).toBe(true)
      expect(item.isDefined(-1 - 1e-12)).toBe(false)
      expect(item.isDefined(1 + 1e-12)).toBe(false)
    }

    for (const id of ['arcsec', 'arccsc'] as const) {
      const item = getFunctionDefinition(id)
      expect(item.isDefined(-1)).toBe(true)
      expect(item.isDefined(1)).toBe(true)
      expect(item.isDefined(-1 + 1e-12)).toBe(false)
      expect(item.isDefined(1 - 1e-12)).toBe(false)
    }
  })

  test('补充函数的关键点均在定义域内且可由求值器复现', () => {
    for (const id of supplementFunctionIds) {
      const item = getFunctionDefinition(id)

      for (const point of item.keyPoints) {
        expect(item.isDefined(point.x)).toBe(true)
        expect(Number.isFinite(item.evaluate(point.x))).toBe(true)
        expect(item.evaluate(point.x)).toBeCloseTo(point.y, 10)
      }
    }
  })

  test('补充函数的奇偶性与极值匹配所选主值约定', () => {
    const arcsec = getFunctionDefinition('arcsec')
    expect(arcsec.parity).toBe('非奇非偶')
    expect(arcsec.extrema).toBe('最小值 0：x = 1；最大值 \\pi：x = -1')

    const arccsc = getFunctionDefinition('arccsc')
    expect(arccsc.parity).toBe('奇函数')
    expect(arccsc.extrema).toBe('最小值 -\\pi/2：x = -1；最大值 \\pi/2：x = 1')
  })

  test('四组反函数限制区间保留正确的数值边界和开闭性', () => {
    expect(getFunctionDefinition('arcsin').inverseRelation?.restrictionBounds).toEqual({
      min: -Math.PI / 2,
      max: Math.PI / 2,
      minOpen: false,
      maxOpen: false,
    })
    expect(getFunctionDefinition('arccos').inverseRelation?.restrictionBounds).toEqual({
      min: 0,
      max: Math.PI,
      minOpen: false,
      maxOpen: false,
    })
    expect(getFunctionDefinition('arctan').inverseRelation?.restrictionBounds).toEqual({
      min: -Math.PI / 2,
      max: Math.PI / 2,
      minOpen: true,
      maxOpen: true,
    })
    expect(getFunctionDefinition('arccot').inverseRelation?.restrictionBounds).toEqual({
      min: 0,
      max: Math.PI,
      minOpen: true,
      maxOpen: true,
    })
  })
})
