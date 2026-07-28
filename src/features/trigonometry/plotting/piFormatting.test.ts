import { describe, expect, test } from 'vitest'
import { createPiTicks, formatPiMultiple } from './piFormatting'

describe('π 格式化', () => {
  test.each([
    [0, '0'],
    [Math.PI / 4, 'π/4'],
    [-Math.PI / 2, '−π/2'],
    [Math.PI, 'π'],
    [2 * Math.PI, '2π'],
    [3 * Math.PI / 2, '3π/2'],
  ])('格式化 %s', (value, label) => {
    expect(formatPiMultiple(value)).toBe(label)
  })

  test('生成稳定且唯一的 π 刻度', () => {
    expect(createPiTicks(-Math.PI, Math.PI, Math.PI / 2).map(tick => tick.label)).toEqual([
      '−π', '−π/2', '0', 'π/2', 'π',
    ])
  })
})
