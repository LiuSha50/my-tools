export default {
  id: 'unicode',
  name: 'Unicode 编码',
  category: 'encoding',
  icon: 'U+',
  description: 'Unicode 编码与解码',
  layout: 'horizontal',
  options: [
    {
      key: 'format',
      label: '格式',
      type: 'select',
      values: ['\\uXXXX', '&#xXXXX;', 'U+XXXX'],
      default: '\\uXXXX'
    }
  ],
  execute(input, options, mode) {
    if (!input) throw new Error('请输入内容')
    const format = options.format || '\\uXXXX'

    if (mode === 'encode') {
      const result = Array.from(input).map(char => {
        const code = char.codePointAt(0)
        const hex = code.toString(16).toUpperCase().padStart(4, '0')
        switch (format) {
          case '\\uXXXX': return code > 0xFFFF ? `\\u{${hex}}` : `\\u${hex}`
          case '&#xXXXX;': return `&#x${hex};`
          case 'U+XXXX': return `U+${hex}`
          default: return `\\u${hex}`
        }
      }).join('')
      return { result }
    }

    if (mode === 'decode') {
      let result
      if (format === '\\uXXXX') {
        result = input.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) =>
          String.fromCodePoint(parseInt(hex, 16))
        ).replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        )
      } else if (format === '&#xXXXX;') {
        result = input.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
          String.fromCodePoint(parseInt(hex, 16))
        )
      } else if (format === 'U+XXXX') {
        result = input.replace(/U\+([0-9a-fA-F]+)/g, (_, hex) =>
          String.fromCodePoint(parseInt(hex, 16))
        )
      }
      return { result }
    }

    throw new Error(`未知模式: ${mode}`)
  }
}