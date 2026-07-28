// @vitest-environment node
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { afterEach, describe, expect, test } from 'vitest'
import { useTrigonometryTheme } from './useTrigonometryTheme'

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage')
})

describe('useTrigonometryTheme SSR', () => {
  test('没有 window 且全局 Storage getter 抛错时仍使用确定性的 system/light 初态', async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() { throw new Error('Storage is unavailable') },
    })
    expect(typeof window).toBe('undefined')

    const app = createSSRApp(defineComponent({
      setup() {
        const { theme, resolvedTheme } = useTrigonometryTheme()
        return () => h('div', {
          'data-theme': theme.value,
          'data-resolved': resolvedTheme.value,
        })
      },
    }))

    await expect(renderToString(app)).resolves.toContain(
      'data-theme="system" data-resolved="light"',
    )
  })
})
