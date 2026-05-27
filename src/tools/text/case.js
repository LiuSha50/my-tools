export default {
  id: 'case',
  name: '大小写转换',
  category: 'text',
  icon: 'Aa',
  description: '文本大小写转换',
  layout: 'horizontal',
  options: [],
  buttons: [
    { mode: 'upper', label: '转大写' },
    { mode: 'lower', label: '转小写' },
    { mode: 'title', label: '首字母大写' },
    { mode: 'camel', label: '驼峰命名' },
    { mode: 'snake', label: '蛇形命名' },
  ],
  execute(input, options, mode) {
    if (!input) throw new Error('请输入文本')

    switch (mode) {
      case 'upper':
        return { result: input.toUpperCase() }
      case 'lower':
        return { result: input.toLowerCase() }
      case 'title':
        return { result: input.replace(/\b\w/g, c => c.toUpperCase()) }
      case 'camel':
        return {
          result: input
            .toLowerCase()
            .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
        }
      case 'snake':
        return {
          result: input
            .replace(/([A-Z])/g, '_$1')
            .toLowerCase()
            .replace(/^_/, '')
            .replace(/[-\s]+/g, '_')
        }
      default:
        throw new Error(`未知模式: ${mode}`)
    }
  }
}