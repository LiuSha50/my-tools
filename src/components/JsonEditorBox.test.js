// @vitest-environment jsdom
import { nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { foldCode } from '@codemirror/language'
import { describe, expect, test, vi } from 'vitest'
import JsonEditorBox from './JsonEditorBox.vue'

describe('JsonEditorBox', () => {
  test('渲染可编辑 JSON 文档并发送编辑结果', async () => {
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{\n  "a": 1\n}' },
    })
    const view = wrapper.vm.getEditorView()

    expect(view.state.doc.toString()).toBe('{\n  "a": 1\n}')
    expect(wrapper.find('.cm-content').attributes('contenteditable')).toBe('true')
    expect(wrapper.find('.cm-foldGutter').exists()).toBe(true)

    view.dispatch({
      changes: { from: 9, to: 10, insert: '2' },
    })
    await nextTick()

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['{\n  "a": 2\n}'])
  })

  test('父级新值覆盖编辑器且不会反向重复发送', async () => {
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{"a":1}' },
    })
    const view = wrapper.vm.getEditorView()

    await wrapper.setProps({ modelValue: '[1,2,3]' })

    expect(view.state.doc.toString()).toBe('[1,2,3]')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  test('对象和数组默认展开并可折叠为省略占位', async () => {
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{\n  "items": [\n    1,\n    2\n  ]\n}' },
    })
    const view = wrapper.vm.getEditorView()

    expect(wrapper.find('.cm-foldPlaceholder').exists()).toBe(false)
    view.dispatch({ selection: { anchor: 0 } })
    expect(foldCode(view)).toBe(true)
    await nextTick()

    expect(wrapper.get('.cm-foldPlaceholder').text()).toBe('…')
    expect(view.state.doc.toString()).toContain('"items"')
  })

  test('复制当前编辑内容并在卸载时销毁编辑器', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{"edited":true}' },
    })
    const view = wrapper.vm.getEditorView()
    const destroy = vi.spyOn(view, 'destroy')

    await wrapper.get('[data-test="copy-json-result"]').trigger('click')
    expect(writeText).toHaveBeenCalledWith('{"edited":true}')

    wrapper.unmount()
    expect(destroy).toHaveBeenCalledOnce()
  })

  test('Clipboard API 拒绝后 fallback 成功才显示已复制并清理节点', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(true),
    })
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{"fallback":true}' },
    })

    await wrapper.get('[data-test="copy-json-result"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="copy-json-result"]').text()).toBe('已复制')
    expect(document.body.querySelector('textarea')).toBeNull()
    wrapper.unmount()
  })

  test('fallback 返回 false 时不误报成功并清理节点', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn().mockReturnValue(false),
    })
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{"fallback":false}' },
    })

    await wrapper.get('[data-test="copy-json-result"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="copy-json-result"]').text()).toBe('复制')
    expect(document.body.querySelector('textarea')).toBeNull()
    wrapper.unmount()
  })

  test('fallback 抛错时不误报成功并清理节点', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: vi.fn(() => { throw new Error('copy failed') }),
    })
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{"fallback":"throws"}' },
      global: { config: { errorHandler: vi.fn() } },
    })

    await wrapper.get('[data-test="copy-json-result"]').trigger('click')
    await flushPromises()

    expect(document.body.querySelector('textarea')).toBeNull()
    expect(wrapper.get('[data-test="copy-json-result"]').text()).toBe('复制')
    wrapper.unmount()
  })

  test('重复复制与卸载会清理成功提示定时器', async () => {
    vi.useFakeTimers()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{"timer":true}' },
    })
    const initialTimerCount = vi.getTimerCount()

    try {
      await wrapper.get('[data-test="copy-json-result"]').trigger('click')
      await flushPromises()
      expect(vi.getTimerCount()).toBe(initialTimerCount + 1)

      await wrapper.get('[data-test="copy-json-result"]').trigger('click')
      await flushPromises()
      expect(vi.getTimerCount()).toBe(initialTimerCount + 1)

      wrapper.unmount()
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      if (wrapper.exists()) wrapper.unmount()
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })
})
