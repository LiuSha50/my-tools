async function shaHash(input, algorithm) {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default {
  id: 'sha',
  name: 'SHA',
  category: 'hash',
  icon: '#',
  description: 'SHA 系列哈希计算',
  layout: 'horizontal',
  options: [
    {
      key: 'algorithm',
      label: '算法',
      type: 'select',
      values: ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'],
      default: 'SHA-256'
    }
  ],
  async execute(input, options, mode) {
    if (!input && input !== '') throw new Error('请输入文本')
    const algorithm = options.algorithm || 'SHA-256'
    const hash = await shaHash(input, algorithm)
    return { result: hash }
  }
}