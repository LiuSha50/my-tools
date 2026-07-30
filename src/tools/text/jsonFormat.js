import JSON5 from 'json5'

export default {
  id: 'json-format',
  name: 'JSON 格式化',
  category: 'text',
  icon: '{}',
  description: 'JSON 格式化、压缩与校验',
  layout: 'horizontal',
  resultView: 'json-editor',
  resultLabel: '格式化结果',
  options: [
    { key: 'indent', label: '缩进', type: 'select', values: ['2空格', '4空格', 'Tab'], default: '2空格' },
    { key: 'json5', label: 'JSON5 模式', type: 'switch', default: true }
  ],
  buttons: [
    { mode: 'format', label: '格式化' },
    { mode: 'minify', label: '压缩' },
    { mode: 'validate', label: '验证' }
  ],
  execute(input, options, mode) {
    if (!input.trim()) throw new Error('请输入 JSON 内容')

    const useJson5 = options.json5 !== false
    const parse = useJson5 ? JSON5.parse : JSON.parse

    if (mode === 'validate') {
      try {
        parse(input)
        return { result: 'JSON 格式有效' }
      } catch (e) {
        throw new Error(`JSON 格式无效: ${e.message}`)
      }
    }

    let obj
    try {
      obj = parse(input)
    } catch (e) {
      throw new Error(`解析失败: ${e.message}`)
    }

    if (mode === 'format') {
      const indentMap = { '2空格': 2, '4空格': 4, 'Tab': '\t' }
      const indent = indentMap[options.indent] || 2
      return { result: JSON.stringify(obj, null, indent) }
    }

    if (mode === 'minify') {
      return { result: JSON.stringify(obj) }
    }
  }
}
