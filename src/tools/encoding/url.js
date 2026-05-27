export default {
  id: 'url',
  name: 'URL 编码',
  category: 'encoding',
  icon: '%',
  description: 'URL 编码与解码',
  layout: 'horizontal',
  options: [
    {
      key: 'method',
      label: '方法',
      type: 'select',
      values: ['encodeURIComponent', 'encodeURI'],
      default: 'encodeURIComponent'
    }
  ],
  execute(input, options, mode) {
    if (!input) throw new Error('请输入内容')

    if (mode === 'encode') {
      const result = options.method === 'encodeURI'
        ? encodeURI(input)
        : encodeURIComponent(input)
      return { result }
    }

    if (mode === 'decode') {
      try {
        const result = options.method === 'encodeURI'
          ? decodeURI(input)
          : decodeURIComponent(input)
        return { result }
      } catch (e) {
        throw new Error('解码失败: 无效的编码字符串')
      }
    }

    throw new Error(`未知模式: ${mode}`)
  }
}