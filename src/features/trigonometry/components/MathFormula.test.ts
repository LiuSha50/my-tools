// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { renderFormula } from '../mathRendering'
import MathFormula from './MathFormula.vue'

describe('MathFormula', () => {
  test('渲染 KaTeX 和可访问名称', () => {
    const wrapper = mount(MathFormula, {
      props: { formula: '\\sin x', label: '正弦 x' },
    })

    expect(wrapper.find('.katex').exists()).toBe(true)
    expect(wrapper.attributes('role')).toBe('math')
    expect(wrapper.attributes('aria-label')).toBe('正弦 x')
  })

  test('将 label 作为必填的数学公式可访问名称', () => {
    const component = MathFormula as unknown as {
      props: { label: { required: boolean } }
    }

    expect(component.props.label.required).toBe(true)
  })

  test('渲染器抛错时返回原始文本降级结果', () => {
    const result = renderFormula('\\bad', false, () => { throw new Error('render failed') })

    expect(result).toEqual({ html: null, text: '\\bad' })
  })
})
