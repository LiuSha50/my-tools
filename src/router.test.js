import { describe, expect, test, vi } from 'vitest'

vi.mock('vue-router', () => ({
  createRouter: vi.fn(options => options),
  createWebHashHistory: vi.fn(() => ({})),
}))

import { routes } from './router.js'

describe('三角函数手册路由', () => {
  test('固定路由位于动态工具路由之前并使用宽版布局', () => {
    const fixedIndex = routes.findIndex(route => route.path === '/tool/trigonometry')
    const dynamicIndex = routes.findIndex(route => route.path === '/tool/:id')
    expect(fixedIndex).toBeGreaterThan(-1)
    expect(fixedIndex).toBeLessThan(dynamicIndex)
    expect(routes[fixedIndex].meta).toEqual({ layout: 'wide' })
    expect(typeof routes[fixedIndex].component).toBe('function')
  })
})
