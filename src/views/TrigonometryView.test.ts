// @vitest-environment jsdom
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHashHistory, RouterLink } from 'vue-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { functionCatalog } from '../features/trigonometry/catalog'
import TrigonometryView from './TrigonometryView.vue'

interface MediaQueryHarness {
  dispatch(matches: boolean): void
  listenerCount(): number
}

const mountedPages: Array<{ unmount(): void }> = []
const routerHistories: Array<ReturnType<typeof createWebHashHistory>> = []

function installStorageHarness() {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => values.delete(key),
    setItem: (key: string, value: string) => values.set(key, String(value)),
  } satisfies Storage)
}

function installBrowserHarness(initialDark = false): MediaQueryHarness {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initialDark

  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  })
  vi.stubGlobal('matchMedia', vi.fn(() => ({
    get matches() { return matches },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  })))

  return {
    dispatch(nextMatches: boolean) {
      matches = nextMatches
      listeners.forEach(listener => listener({ matches } as MediaQueryListEvent))
    },
    listenerCount: () => listeners.size,
  }
}

function mountPage() {
  return mount(TrigonometryView, {
    global: {
      stubs: {
        RouterLink: { template: '<a href="/"><slot /></a>' },
      },
    },
  })
}

async function mountPageWithRouter() {
  const history = createWebHashHistory('/my-tools/')
  routerHistories.push(history)
  const router = createRouter({
    history,
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/tool/trigonometry', component: TrigonometryView },
    ],
  })
  await router.push('/tool/trigonometry')
  await router.isReady()

  const wrapper = mount(TrigonometryView, {
    attachTo: document.body,
    global: {
      plugins: [router],
    },
  })
  mountedPages.push(wrapper)

  return { router, wrapper }
}

async function dispatchAnchorClick(element: Element, init: MouseEventInit = {}) {
  window.addEventListener('click', event => event.preventDefault(), { once: true })
  element.dispatchEvent(new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  }))
  await flushPromises()
}

beforeEach(() => {
  installStorageHarness()
  document.documentElement.removeAttribute('data-theme')
})

afterEach(() => {
  mountedPages.splice(0).forEach(wrapper => wrapper.unmount())
  routerHistories.splice(0).forEach(history => history.destroy())
  window.history.replaceState({}, '', '/')
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

describe('TrigonometryView', () => {
  test('按教学顺序公开全部分区和页内锚点', () => {
    installBrowserHarness()
    const wrapper = mountPage()
    const orderedIds = [
      'workbench',
      'trig-properties',
      'inverse-properties',
      'inverse-relation',
      'mistakes',
      'supplement',
      'symbols',
    ]

    expect(wrapper.find('main').attributes('data-theme')).toBe('light')
    expect(wrapper.findAll('main > section').map(section => section.attributes('id'))).toEqual(orderedIds)
    expect(wrapper.text()).toContain('默认采用弧度制')
    expect(wrapper.text()).toContain('k ∈ Z')
    expect(wrapper.text()).toContain('arccot 主值范围采用 (0, π)')
  })

  test('七个页内目录项精确映射文本、to 和 hash history href', async () => {
    installBrowserHarness()
    const { wrapper } = await mountPageWithRouter()
    const links = wrapper.findAllComponents(RouterLink).filter(
      link => link.attributes('data-page-anchor') !== undefined,
    )

    expect(links.map(link => ({
      text: link.text(),
      to: link.props('to'),
      href: link.attributes('href'),
    }))).toEqual([
      { text: '交互图像', to: { hash: '#workbench' }, href: '#/tool/trigonometry#workbench' },
      { text: '三角函数', to: { hash: '#trig-properties' }, href: '#/tool/trigonometry#trig-properties' },
      { text: '反三角函数', to: { hash: '#inverse-properties' }, href: '#/tool/trigonometry#inverse-properties' },
      { text: '反函数关系', to: { hash: '#inverse-relation' }, href: '#/tool/trigonometry#inverse-relation' },
      { text: '易错点', to: { hash: '#mistakes' }, href: '#/tool/trigonometry#mistakes' },
      { text: '补充内容', to: { hash: '#supplement' }, href: '#/tool/trigonometry#supplement' },
      { text: '符号说明', to: { hash: '#symbols' }, href: '#/tool/trigonometry#symbols' },
    ])
  })

  test.each([
    ['普通左键 click', { button: 0, detail: 1 }],
    ['Enter 合成的 click', { button: 0, detail: 0 }],
  ])('%s 滚动到对应分区、更新路由 hash 且保留链接焦点', async (_name, eventInit) => {
    installBrowserHarness()
    const { router, wrapper } = await mountPageWithRouter()
    const scrollIntoView = vi.fn()
    wrapper.get('#workbench').element.scrollIntoView = scrollIntoView
    const anchor = wrapper.get('[data-page-anchor]')
    const anchorElement = anchor.element as HTMLElement
    anchorElement.focus()

    await dispatchAnchorClick(anchorElement, eventInit)

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' })
    expect(router.currentRoute.value.hash).toBe('#workbench')
    expect(document.activeElement).toBe(anchorElement)
  })

  test.each([
    ['Meta click', { metaKey: true }],
    ['Ctrl click', { ctrlKey: true }],
    ['Alt click', { altKey: true }],
    ['Shift click', { shiftKey: true }],
    ['中键 click', { button: 1 }],
    ['右键 click', { button: 2 }],
  ])('%s 不滚动或改写当前路由', async (_name, eventInit) => {
    installBrowserHarness()
    const { router, wrapper } = await mountPageWithRouter()
    const scrollIntoView = vi.fn()
    wrapper.get('#workbench').element.scrollIntoView = scrollIntoView

    await dispatchAnchorClick(wrapper.get('[data-page-anchor]').element, eventInit)

    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(router.currentRoute.value.hash).toBe('')
  })

  test('target=_blank 的目录激活不滚动或改写当前路由', async () => {
    installBrowserHarness()
    const { router, wrapper } = await mountPageWithRouter()
    const scrollIntoView = vi.fn()
    wrapper.get('#workbench').element.scrollIntoView = scrollIntoView
    const anchor = wrapper.get('[data-page-anchor]')
    anchor.element.setAttribute('target', '_blank')

    await dispatchAnchorClick(anchor.element)

    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(router.currentRoute.value.hash).toBe('')
  })

  test('完整性质分区从 catalog 呈现十个主要函数且补充区只含 arcsec 和 arccsc', () => {
    installBrowserHarness()
    const wrapper = mountPage()
    const trigSection = wrapper.get('#trig-properties')
    const inverseSection = wrapper.get('#inverse-properties')
    const supplementSection = wrapper.get('#supplement')

    for (const definition of functionCatalog.filter(item => item.category === 'trig')) {
      expect(trigSection.text()).toContain(definition.name)
      expect(trigSection.findAll('[role="math"]').some(
        formula => formula.attributes('aria-label')?.includes(definition.formula),
      )).toBe(true)
    }
    for (const definition of functionCatalog.filter(item => item.category === 'inverse')) {
      expect(inverseSection.text()).toContain(definition.name)
      expect(inverseSection.text()).toContain('主值范围')
    }

    expect(supplementSection.findAll('[data-supplement-function]').map(node => node.attributes('data-supplement-function')))
      .toEqual(['arcsec', 'arccsc'])
    expect(supplementSection.text()).toContain('不同教材可能采用不同的主值范围约定')
  })

  test('逐条呈现十个易错点并提供至少三个原生展开例题', () => {
    installBrowserHarness()
    const wrapper = mountPage()
    const mistakes = wrapper.get('#mistakes')
    const items = mistakes.findAll('[data-mistake-item]')

    expect(items).toHaveLength(10)
    expect(mistakes.text()).toContain('sin⁻¹x 通常表示 arcsin x，不表示 1/sin x')
    expect(mistakes.text()).toContain('1/sin x = csc x')
    expect(mistakes.text()).toContain('1/cos x = sec x')
    expect(mistakes.text()).toContain('反三角函数本身不具有周期性')
    expect(mistakes.text()).toContain('求反函数时定义域和值域交换')
    expect(mistakes.text()).toContain('arcsin(sin x) = x 只在 x ∈ [-π/2, π/2] 时直接成立')
    expect(mistakes.text()).toContain('arccos(cos x) = x 只在 x ∈ [0, π] 时直接成立')
    expect(mistakes.text()).toContain('sin(arcsin x) = x 要求 x ∈ [-1, 1]')
    expect(mistakes.text()).toContain('tan(arctan x) = x 对所有实数成立')
    expect(mistakes.text()).toContain('反函数与倒数函数是完全不同的概念')
    expect(mistakes.findAll('details').length).toBeGreaterThanOrEqual(3)
    expect(mistakes.text()).toContain('arcsin(sin(2π/3)) = π/3')
  })

  test('符号说明覆盖区间、集合、渐近线、点标记和 catalog 的全部线型', () => {
    installBrowserHarness()
    const wrapper = mountPage()
    const legend = wrapper.get('#symbols')
    const catalogPatterns = [...new Set(functionCatalog.map(item => item.style.pattern))].sort()
    const renderedPatterns = legend.findAll('[data-legend-pattern]').map(
      node => node.attributes('data-legend-pattern'),
    ).sort()

    expect(legend.text()).toContain('R：全体实数')
    expect(legend.text()).toContain('Z：全体整数')
    expect(legend.text()).toContain('k ∈ Z：k 可取任意整数')
    expect(legend.text()).toContain('开区间')
    expect(legend.text()).toContain('闭区间')
    expect(legend.text()).toContain('∪')
    expect(legend.text()).toContain('\\')
    expect(legend.text()).toContain('竖直渐近线')
    expect(legend.text()).toContain('水平渐近线')
    expect(legend.text()).toContain('关键点、零点和极值点')
    expect(renderedPatterns).toEqual(catalogPatterns)
  })

  test('主题仅作用于页面根节点、只持久化专用键并在卸载时清理系统监听', async () => {
    localStorage.setItem('unrelated-setting', 'keep')
    const media = installBrowserHarness(true)
    const wrapper = mountPage()
    const page = wrapper.get('main')
    await wrapper.vm.$nextTick()

    expect(page.attributes('data-theme')).toBe('dark')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
    expect(media.listenerCount()).toBe(1)

    await wrapper.get('[data-action="toggle-theme"]').trigger('click')
    expect(page.attributes('data-theme')).toBe('light')
    expect(localStorage.getItem('trigonometry-theme')).toBe('light')
    expect(localStorage.getItem('unrelated-setting')).toBe('keep')

    media.dispatch(false)
    expect(page.attributes('data-theme')).toBe('light')

    wrapper.unmount()
    expect(media.listenerCount()).toBe(0)
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})
