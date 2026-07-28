// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { useTrigonometryTheme } from './useTrigonometryTheme'

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

function makeMedia(initialMatches: boolean) {
  let matches = initialMatches
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  const media = {
    get matches() { return matches },
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
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

const ThemeHarness = defineComponent({
  setup() {
    return useTrigonometryTheme()
  },
  template: '<button :data-theme="theme" :data-resolved="resolvedTheme" @click="toggleTheme">切换</button>',
})

beforeEach(() => installStorageHarness())
afterEach(() => vi.unstubAllGlobals())

describe('useTrigonometryTheme', () => {
  test('未保存偏好时跟随系统并响应后续变化', async () => {
    const media = makeMedia(false)
    const wrapper = mount(ThemeHarness)

    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'system',
      'data-resolved': 'light',
    })
    media.change(true)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('button').attributes('data-resolved')).toBe('dark')

    wrapper.unmount()
    expect(media.count()).toBe(0)
  })

  test('手动切换只保存 light 或 dark 且不受系统变化影响', async () => {
    localStorage.setItem('unrelated-setting', 'keep')
    const media = makeMedia(true)
    const wrapper = mount(ThemeHarness)

    await wrapper.get('button').trigger('click')
    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'light',
      'data-resolved': 'light',
    })
    expect(localStorage.getItem('trigonometry-theme')).toBe('light')
    expect(localStorage.getItem('unrelated-setting')).toBe('keep')

    media.change(false)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('button').attributes('data-resolved')).toBe('light')
  })

  test('忽略损坏的已保存值并保持系统模式', () => {
    localStorage.setItem('trigonometry-theme', 'sepia')
    makeMedia(false)

    const wrapper = mount(ThemeHarness)

    expect(wrapper.get('button').attributes()).toMatchObject({
      'data-theme': 'system',
      'data-resolved': 'light',
    })
    expect(localStorage.getItem('trigonometry-theme')).toBeNull()
  })
})
