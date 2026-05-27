export default {
  id: 'timestamp',
  name: '时间戳转换',
  category: 'text',
  icon: '⏱',
  description: '时间戳与日期时间互转',
  layout: 'horizontal',
  options: [],
  buttons: [
    { mode: 'to-date', label: '时间戳 → 日期' },
    { mode: 'to-timestamp', label: '日期 → 时间戳' },
    { mode: 'now', label: '当前时间戳' },
  ],
  execute(input, options, mode) {
    if (mode === 'now') {
      const now = new Date()
      const seconds = Math.floor(now.getTime() / 1000)
      return {
        result: `秒级时间戳: ${seconds}\n毫秒级时间戳: ${now.getTime()}\n日期时间: ${formatDate(now)}`
      }
    }

    if (!input) throw new Error('请输入内容')

    if (mode === 'to-date') {
      let num = parseInt(input.trim(), 10)
      if (isNaN(num)) throw new Error('请输入有效的数字时间戳')
      if (num < 1e12) num *= 1000
      const date = new Date(num)
      if (isNaN(date.getTime())) throw new Error('无效的时间戳')
      return {
        result: `本地时间: ${formatDate(date)}\nUTC 时间: ${date.toISOString()}\n时间戳(秒): ${Math.floor(date.getTime() / 1000)}\n时间戳(毫秒): ${date.getTime()}`
      }
    }

    if (mode === 'to-timestamp') {
      const date = new Date(input.trim())
      if (isNaN(date.getTime())) throw new Error('请输入有效的日期时间格式')
      return {
        result: `时间戳(秒): ${Math.floor(date.getTime() / 1000)}\n时间戳(毫秒): ${date.getTime()}\nISO 格式: ${date.toISOString()}`
      }
    }

    throw new Error(`未知模式: ${mode}`)
  }
}

function formatDate(date) {
  const pad = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}