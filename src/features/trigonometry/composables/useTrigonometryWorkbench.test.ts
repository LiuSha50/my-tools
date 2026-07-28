import { describe, expect, test } from 'vitest'
import { useTrigonometryWorkbench } from './useTrigonometryWorkbench'

describe('工作台状态', () => {
  test('默认选择 sin 并分别保留两个分区选择', () => {
    const state = useTrigonometryWorkbench()

    expect(state.selectedIds.value).toEqual(['sin'])
    state.activeCategory.value = 'inverse'
    expect(state.selectedIds.value).toEqual(['arcsin'])
    state.activeCategory.value = 'trig'
    expect(state.selectedIds.value).toEqual(['sin'])
  })

  test('最多允许选择 4 个函数', () => {
    const state = useTrigonometryWorkbench()

    for (const id of ['cos', 'tan', 'cot'] as const) state.toggleFunction(id)
    state.toggleFunction('sec')

    expect(state.selectedIds.value).toEqual(['sin', 'cos', 'tan', 'cot'])
    expect(state.selectionError.value).toContain('最多比较 4 个')
  })

  test('清空后可恢复当前分区默认函数', () => {
    const state = useTrigonometryWorkbench()

    state.toggleFunction('sin')
    expect(state.selectedIds.value).toEqual([])

    state.restoreDefault()
    expect(state.selectedIds.value).toEqual(['sin'])
  })

  test('成功改变选择时清除之前的上限错误', () => {
    const state = useTrigonometryWorkbench()

    for (const id of ['cos', 'tan', 'cot'] as const) state.toggleFunction(id)
    state.toggleFunction('sec')
    state.toggleFunction('cot')

    expect(state.selectedIds.value).toEqual(['sin', 'cos', 'tan'])
    expect(state.selectionError.value).toBe('')
  })
})
