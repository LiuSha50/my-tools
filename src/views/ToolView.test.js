// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, test } from 'vitest'
import ToolView from './ToolView.vue'

async function mountJsonTool() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/tool/:id', component: ToolView }],
  })
  await router.push('/tool/json-format')
  await router.isReady()

  return mount(ToolView, {
    global: { plugins: [router] },
  })
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
})
