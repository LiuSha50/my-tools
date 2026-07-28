import jsonFormat from './jsonFormat'

const { execute } = jsonFormat
const defaults = { indent: '2空格', json5: true }

describe('JSON 格式化', () => {
  test('格式化标准 JSON', () => {
    const result = execute('{"a":1,"b":2}', defaults, 'format')
    expect(result.result).toBe('{\n  "a": 1,\n  "b": 2\n}')
  })

  test('格式化 - 4空格缩进', () => {
    const result = execute('{"a":1}', { indent: '4空格', json5: true }, 'format')
    expect(result.result).toBe('{\n    "a": 1\n}')
  })

  test('格式化 - Tab 缩进', () => {
    const result = execute('{"a":1}', { indent: 'Tab', json5: true }, 'format')
    expect(result.result).toBe('{\n\t"a": 1\n}')
  })

  test('JSON5 模式 - 支持尾逗号', () => {
    const result = execute('{"a":1,}', defaults, 'format')
    expect(result.result).toBe('{\n  "a": 1\n}')
  })

  test('JSON5 模式 - 支持注释', () => {
    const result = execute('{// comment\n"a":1}', defaults, 'format')
    expect(result.result).toBe('{\n  "a": 1\n}')
  })

  test('JSON5 模式关闭 - 尾逗号报错', () => {
    expect(() => execute('{"a":1,}', { indent: '2空格', json5: false }, 'format'))
      .toThrow('解析失败')
  })

  test('压缩 JSON', () => {
    const result = execute('{\n  "a": 1,\n  "b": 2\n}', defaults, 'minify')
    expect(result.result).toBe('{"a":1,"b":2}')
  })

  test('验证有效 JSON', () => {
    const result = execute('{"a":1}', defaults, 'validate')
    expect(result.result).toBe('JSON 格式有效')
  })

  test('验证无效 JSON', () => {
    expect(() => execute('{invalid}', defaults, 'validate')).toThrow('JSON 格式无效')
  })

  test('空输入报错', () => {
    expect(() => execute('', defaults, 'format')).toThrow('请输入 JSON 内容')
  })
})