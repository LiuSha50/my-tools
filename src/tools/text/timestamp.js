export default {
  id: 'timestamp',
  name: '时间戳转换',
  category: 'text',
  icon: '⏱',
  description: '时间戳与日期时间互转',
  customView: true,
  layout: 'horizontal',
  options: [],
  buttons: [],
  execute() {
    throw new Error('使用自定义视图')
  }
}