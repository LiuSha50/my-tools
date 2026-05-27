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

async function generateKeyPair(modulusLength) {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256'
    },
    true,
    ['encrypt', 'decrypt']
  )
  const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
  return {
    publicKey: arrayBufferToBase64(publicKey),
    privateKey: arrayBufferToBase64(privateKey)
  }
}

export default {
  id: 'rsa',
  name: 'RSA 加密',
  category: 'crypto',
  icon: '🔑',
  description: 'RSA 非对称加密与密钥生成',
  layout: 'vertical',
  options: [
    {
      key: 'modulusLength',
      label: '密钥长度',
      type: 'select',
      values: [2048, 4096],
      default: 2048
    },
    {
      key: 'publicKey',
      label: '公钥 (Base64)',
      type: 'input',
      placeholder: '粘贴公钥用于加密...'
    },
    {
      key: 'privateKey',
      label: '私钥 (Base64)',
      type: 'input',
      placeholder: '粘贴私钥用于解密...'
    }
  ],
  buttons: [
    { mode: 'encrypt', label: '加密' },
    { mode: 'decrypt', label: '解密' },
    { mode: 'generate', label: '生成密钥对' },
  ],
  async execute(input, options, mode) {
    if (mode === 'generate') {
      const { publicKey, privateKey } = await generateKeyPair(options.modulusLength || 2048)
      return {
        result: `=== 公钥 ===\n${publicKey}\n\n=== 私钥 ===\n${privateKey}\n\n密钥已自动填入上方输入框，可直接用于加密和解密。`,
        fillOptions: { publicKey, privateKey }
      }
    }

    if (mode === 'encrypt') {
      if (!input) throw new Error('请输入要加密的内容')
      if (!options.publicKey) throw new Error('请输入公钥')
      const keyData = base64ToArrayBuffer(options.publicKey.trim())
      const cryptoKey = await crypto.subtle.importKey(
        'spki', keyData, { name: 'RSA-OAEP', hash: 'SHA-256' },
        false, ['encrypt']
      )
      const encrypted = await crypto.subtle.encrypt(
        { name: 'RSA-OAEP' }, cryptoKey,
        new TextEncoder().encode(input)
      )
      return { result: arrayBufferToBase64(encrypted) }
    }

    if (mode === 'decrypt') {
      if (!input) throw new Error('请输入要解密的内容')
      if (!options.privateKey) throw new Error('请输入私钥')
      try {
        const keyData = base64ToArrayBuffer(options.privateKey.trim())
        const cryptoKey = await crypto.subtle.importKey(
          'pkcs8', keyData, { name: 'RSA-OAEP', hash: 'SHA-256' },
          false, ['decrypt']
        )
        const decrypted = await crypto.subtle.decrypt(
          { name: 'RSA-OAEP' }, cryptoKey,
          base64ToArrayBuffer(input.trim())
        )
        return { result: new TextDecoder().decode(decrypted) }
      } catch (e) {
        throw new Error('解密失败: 私钥错误或数据不匹配')
      }
    }

    throw new Error(`未知模式: ${mode}`)
  }
}