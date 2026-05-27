export default {
  id: 'base64',
  name: 'Base64',
  category: 'encoding',
  icon: 'B₆₄',
  description: 'Base64 编码与解码',
  layout: 'horizontal',
  options: [],
  execute(input, options, mode) {
    if (!input) throw new Error('请输入内容')

    if (mode === 'encode') {
      try {
        const encoded = btoa(
          Array.from(new TextEncoder().encode(input))
            .map(b => String.fromCharCode(b))
            .join('')
        )
        return { result: encoded }
      } catch (e) {
        throw new Error('编码失败: ' + e.message)
      }
    }

    if (mode === 'decode') {
      try {
        const binary = atob(input.trim())
        const bytes = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
        const decoded = new TextDecoder().decode(bytes)
        return { result: decoded }
      } catch (e) {
        throw new Error('解码失败: 无效的 Base64 字符串')
      }
    }

    throw new Error(`未知模式: ${mode}`)
  }
}