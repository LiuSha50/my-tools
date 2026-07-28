// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { defineComponent, nextTick } from 'vue'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { useTrigonometryTheme } from './useTrigonometryTheme'

interface ThemeSnapshot {
  theme: string
  resolvedTheme: string
}

const originalStorageDescriptor = Object.getOwnPropertyDescriptor(window, 'localStorage')

function setWindowStorage(storage: unknown) {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storage,
  })
}

function makeStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    get length() { return values.size },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => [...values.keys()][index] ?? null),
    removeItem: vi.fn((key: string) => values.delete(key)),
    setItem: vi.fn((key: string, value: string) => values.set(key, String(value))),
  } satisfies Storage
}

function makeMedia(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const media = {
    get matches() { return matches },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener)),
    removeEventListener: vi.fn((_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener)),
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  }
  vi.stubGlobal('matchMedia', vi.fn(() => media))
  return {
    change(nextMatches: boolean) {
      matches = nextMatches
      listeners.forEach(listener => listener({ matches } as MediaQueryListEvent))
    },
    count: () => listeners.size,
  }
}

function mountThemeHarness(setupSnapshot?: ThemeSnapshot) {
  return mount(defineComponent({
    setup() {
      const state = useTrigonometryTheme()
      if (setupSnapshot) {
        setupSnapshot.theme = state.theme.value
        setupSnapshot.resolvedTheme = state.resolvedTheme.value
      }
      return state
    },
    template: '<button :data-theme="theme" :data-resolved="resolvedTheme" @click="toggleTheme">切换</button>',
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
  if (originalStorageDescriptor) {
    Object.defineProperty(window, 'localStorage', originalStorageDescriptor)
  } else {
    Reflect.deleteProperty(window, 'localStorage')
  }
})

describe('useTrigonometryTheme', () => {
  test('服务端同构初态保持 system/light，挂载后才读取保存偏好和系统主题', async () => {
    setWindowStorage(makeStorage({ 'trigonometry-theme': 'dark' }))
    makeMedia(false)
    const setupSnapshot = { theme: '', resolvedTheme: '' }
    const wrapper = mountThemeHarness(setupSnapshot)

    expect(setupSnapshot).toEqual({ theme: 'system', resolvedTheme: 'light' })
    await nextTick()
    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'dark',
      'data-resolved': 'dark',
    })
  })

  test('未保存偏好时挂载后跟随系统并响应变化，卸载时清理监听', async () => {
    setWindowStorage(makeStorage())
    const media = makeMedia(false)
    const wrapper = mountThemeHarness()

    await nextTick()
    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'system',
      'data-resolved': 'light',
    })
    media.change(true)
    await nextTick()
    expect(wrapper.get('button').attributes('data-resolved')).toBe('dark')

    wrapper.unmount()
    expect(media.count()).toBe(0)
  })

  test('手动切换只保存 light 或 dark 且不受系统变化影响', async () => {
    const storage = makeStorage({ 'unrelated-setting': 'keep' })
    setWindowStorage(storage)
    const media = makeMedia(true)
    const wrapper = mountThemeHarness()
    await nextTick()

    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'light',
      'data-resolved': 'light',
    })
    expect(storage.getItem('trigonometry-theme')).toBe('light')
    expect(storage.getItem('unrelated-setting')).toBe('keep')

    media.change(false)
    await nextTick()
    expect(wrapper.get('button').attributes('data-resolved')).toBe('light')
  })

  test('localStorage 属性访问抛出 SecurityError 时仍可挂载和内存切换', async () => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() { throw new DOMException('denied', 'SecurityError') },
    })
    makeMedia(false)

    const wrapper = mountThemeHarness()
    await nextTick()
    await expect(wrapper.get('button').trigger('click')).resolves.toBeUndefined()
    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'dark',
      'data-resolved': 'dark',
    })
  })

  test('伪 localStorage 缺少方法时降级为仅内存主题', async () => {
    setWindowStorage({})
    makeMedia(false)

    const wrapper = mountThemeHarness()
    await nextTick()
    await expect(wrapper.get('button').trigger('click')).resolves.toBeUndefined()
    expect(wrapper.get('button').attributes('data-theme')).toBe('dark')
  })

  test('getItem 抛错时忽略存储并继续跟随系统', async () => {
    setWindowStorage({
      getItem: () => { throw new DOMException('denied', 'SecurityError') },
    })
    makeMedia(true)

    const wrapper = mountThemeHarness()
    await nextTick()
    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'system',
      'data-resolved': 'dark',
    })
  })

  test('非法值触发 removeItem 抛错时仍保持系统模式', async () => {
    const removeItem = vi.fn(() => { throw new DOMException('denied', 'SecurityError') })
    setWindowStorage({ getItem: () => 'sepia', removeItem })
    makeMedia(false)

    const wrapper = mountThemeHarness()
    await nextTick()
    expect(removeItem).toHaveBeenCalledWith('trigonometry-theme')
    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'system',
      'data-resolved': 'light',
    })
  })

  test('setItem 抛错时 toggle 仍更新内存主题', async () => {
    setWindowStorage({
      getItem: () => null,
      setItem: () => { throw new DOMException('denied', 'SecurityError') },
    })
    makeMedia(false)
    const wrapper = mountThemeHarness()
    await nextTick()

    await expect(wrapper.get('button').trigger('click')).resolves.toBeUndefined()
    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'dark',
      'data-resolved': 'dark',
    })
  })
})
