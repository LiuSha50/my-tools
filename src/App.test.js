// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, test } from 'vitest'
import App from './App.vue'

async function mountApp(path) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<main>首页</main>' } },
      {
        path: '/tool/trigonometry',
        component: { template: '<main>三角函数手册</main>' },
        meta: { layout: 'wide' },
      },
    ],
  })
  await router.push(path)
  await router.isReady()

  return mount(App, {
    global: {
      plugins: [router],
    },
  })
}

describe('App 布局壳层', () => {
  test('普通页面只渲染一个无重复挂载 ID 的 960px 布局壳层', async () => {
    const wrapper = await mountApp('/')

    expect(wrapper.findAll('#app')).toHaveLength(0)
    expect(wrapper.get('.app-shell').classes()).not.toContain('app-wide')
    expect(wrapper.text()).toContain('首页')
  })

  test('手册路由在同一布局壳层上启用宽版类', async () => {
    const wrapper = await mountApp('/tool/trigonometry')

    expect(wrapper.findAll('#app')).toHaveLength(0)
    expect(wrapper.get('.app-shell').classes()).toContain('app-wide')
    expect(wrapper.text()).toContain('三角函数手册')
  })
})
