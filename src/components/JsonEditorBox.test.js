// @vitest-environment jsdom
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
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
})
