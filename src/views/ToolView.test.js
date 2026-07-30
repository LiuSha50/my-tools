// @vitest-environment jsdom
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, test } from 'vitest'
import JsonEditorBox from '../components/JsonEditorBox.vue'
import ToolView from './ToolView.vue'

async function mountTool(id) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/tool/:id', component: ToolView }],
  })
  await router.push(`/tool/${id}`)
  await router.isReady()

  return mount(ToolView, {
    global: { plugins: [router] },
  })
}

async function mountJsonTool() {
  return mountTool('json-format')
}

describe('ToolView switch 选项', () => {
  test('JSON5 开关可关闭并把 false 传给工具执行器', async () => {
    const wrapper = await mountJsonTool()
    const toggle = wrapper.get('input[type="checkbox"][aria-label="JSON5 模式"]')

    expect(toggle.element.checked).toBe(true)
    await toggle.setValue(false)
    await wrapper.get('textarea').setValue('{"value": 1,}')
    await wrapper.get('button').trigger('click')

    expect(wrapper.text()).toContain('解析失败')
  })

  test('JSON 工具使用右侧稍宽的结构化编辑器', async () => {
    const wrapper = await mountJsonTool()

    expect(wrapper.get('.tool-layout').classes()).toContain('layout-horizontal')
    expect(wrapper.get('.tool-layout').classes()).toContain('layout-json-editor')
    expect(wrapper.findComponent(JsonEditorBox).exists()).toBe(true)
    expect(wrapper.get('.input-box').classes()).toContain('json-input-pane')
  })

  test('右侧编辑不回写左侧，再次格式化会覆盖右侧', async () => {
    const wrapper = await mountJsonTool()
    const input = wrapper.get('.input-box-textarea')
    await input.setValue('{"value":1}')
    await wrapper.get('.action-btn-primary').trigger('click')

    const editor = wrapper.getComponent(JsonEditorBox).vm.getEditorView()
    expect(editor.state.doc.toString()).toBe('{\n  "value": 1\n}')

    editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: '{"edited":true}' } })
    await nextTick()
    expect(input.element.value).toBe('{"value":1}')

    await wrapper.get('.action-btn-primary').trigger('click')
    expect(editor.state.doc.toString()).toBe('{\n  "value": 1\n}')
  })

  test('其他工具继续使用普通输出框', async () => {
    const wrapper = await mountTool('base64')

    expect(wrapper.findComponent(JsonEditorBox).exists()).toBe(false)
    expect(wrapper.find('.output-box').exists()).toBe(true)
  })
})
