function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

function stringToArrayBuffer(str) {
  return new TextEncoder().encode(str).buffer
}

function arrayBufferToString(buffer) {
  return new TextDecoder().decode(buffer)
}

async function getKey(keyString, keyLength) {
  const keyData = new TextEncoder().encode(keyString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData)
  return new Uint8Array(hashBuffer).slice(0, keyLength / 8)
}

export default {
  id: 'aes',
  name: 'AES 加密',
  category: 'crypto',
  icon: '🔐',
  description: 'AES 对称加密与解密',
  layout: 'vertical',
  options: [
    {
      key: 'mode',
      label: '模式',
      type: 'select',
      values: ['CBC', 'CTR', 'GCM'],
      default: 'CBC'
    },
    {
      key: 'keyLength',
      label: '密钥长度',
      type: 'select',
      values: [128, 192, 256],
      default: 256
    },
    {
      key: 'key',
      label: '密钥',
      type: 'input',
      placeholder: '输入密钥...'
    }
  ],
  async execute(input, options, mode) {
    if (!input) throw new Error('请输入内容')
    if (!options.key) throw new Error('请输入密钥')

    const keyBytes = await getKey(options.key, options.keyLength)
    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes, { name: `AES-${options.mode}` }, false,
      mode === 'encrypt' ? ['encrypt'] : ['decrypt']
    )

    if (mode === 'encrypt') {
      const iv = crypto.getRandomValues(new Uint8Array(16))
      const algo = { name: `AES-${options.mode}`, iv }
      if (options.mode === 'CTR') {
        algo.counter = iv
        algo.length = 64
      }
      const encrypted = await crypto.subtle.encrypt(algo, cryptoKey, stringToArrayBuffer(input))
      const combined = new Uint8Array(iv.length + encrypted.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encrypted), iv.length)
      return { result: arrayBufferToBase64(combined.buffer) }
    }

    if (mode === 'decrypt') {
      try {
        const combined = new Uint8Array(base64ToArrayBuffer(input.trim()))
        const iv = combined.slice(0, 16)
        const ciphertext = combined.slice(16)
        const algo = { name: `AES-${options.mode}`, iv }
        if (options.mode === 'CTR') {
          algo.counter = iv
          algo.length = 64
        }
        const decrypted = await crypto.subtle.decrypt(algo, cryptoKey, ciphertext)
        return { result: arrayBufferToString(decrypted) }
      } catch (e) {
        throw new Error('解密失败: 密钥错误或数据损坏')
      }
    }

    throw new Error(`未知模式: ${mode}`)
  }
}