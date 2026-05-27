import aes from './crypto/aes'
import des from './crypto/des'
import rsa from './crypto/rsa'
import md5 from './hash/md5'
import sha from './hash/sha'
import base64 from './encoding/base64'
import urlTool from './encoding/url'
import unicode from './encoding/unicode'
import caseConverter from './text/case'
import timestamp from './text/timestamp'

export const tools = [
  aes, des, rsa,
  md5, sha,
  base64, urlTool, unicode,
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