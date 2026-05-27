import caseConverter from './text/case'
import timestamp from './text/timestamp'

export const tools = [
  caseConverter, timestamp
]

export const toolsByCategory = {
  get crypto() { return tools.filter(t => t.category === 'crypto') },
  get hash() { return tools.filter(t => t.category === 'hash') },
  get encoding() { return tools.filter(t => t.category === 'encoding') },
  get text() { return tools.filter(t => t.category === 'text') },
}

export const categoryNames = {
  crypto: '加解密',
  hash: '哈希',
  encoding: '编码',
  text: '文本',
}

export const categoryOrder = ['crypto', 'hash', 'encoding', 'text']

export function getToolById(id) {
  return tools.find(t => t.id === id)
}