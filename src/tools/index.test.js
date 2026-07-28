import { describe, expect, test } from 'vitest'
import { categoryNames, categoryOrder, getToolById, toolsByCategory } from './index.js'

describe('数学工具注册', () => {
  test('注册三角函数手册及数学分类', () => {
    expect(getToolById('trigonometry')).toMatchObject({
      id: 'trigonometry',
      category: 'math',
      customView: true,
    })
    expect(categoryNames.math).toBe('数学')
    expect(categoryOrder).toContain('math')
    expect(toolsByCategory.math.map(tool => tool.id)).toContain('trigonometry')
  })
})
