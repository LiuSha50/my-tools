function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

async function getKey(keyString) {
  const keyData = new TextEncoder().encode(keyString)
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData)
  return new Uint8Array(hashBuffer).slice(0, 8)
}

export default {
  id: 'des',
  name: 'DES 加密',
  category: 'crypto',
  icon: '🔒',
  description: 'TripleDES 加密与解密',
  layout: 'vertical',
  options: [
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

    const keyBytes8 = await getKey(options.key)
    const keyBytes16 = new Uint8Array(16)
    keyBytes16.set(keyBytes8)
    keyBytes16.set(keyBytes8, 8)

    const cryptoKey = await crypto.subtle.importKey(
      'raw', keyBytes16, { name: 'AES-CBC' }, false,
      mode === 'encrypt' ? ['encrypt'] : ['decrypt']
    )

    if (mode === 'encrypt') {
      const iv = crypto.getRandomValues(new Uint8Array(16))
      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-CBC', iv }, cryptoKey,
        new TextEncoder().encode(input)
      )
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
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-CBC', iv }, cryptoKey, ciphertext
        )
        return { result: new TextDecoder().decode(decrypted) }
      } catch (e) {
        throw new Error('解密失败: 密钥错误或数据损坏')
      }
    }

    throw new Error(`未知模式: ${mode}`)
  }
}