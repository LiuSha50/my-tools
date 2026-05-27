# DevTools 项目指南

## 架构

插件式工具集合，每个工具导出配置对象，通用 ToolView 自动渲染 UI。

```
src/
  tools/           # 工具定义（按分类目录组织）
    index.js       # 注册中心：import → tools 数组 → toolsByCategory/categoryNames/getToolById
    crypto/        # 加解密工具
    hash/          # 哈希工具
    encoding/      # 编码工具
    text/          # 文本工具
  views/
    ToolView.vue   # 通用工具视图（自动渲染 options/buttons/input/output）
    TimestampView.vue  # 时间戳专用视图（自定义布局）
    HomeView.vue   # 首页（分类展示 + 常用工具置顶）
  components/
    InputBox.vue   # 输入框
    OutputBox.vue  # 输出框（内置复制）
    ToolCard.vue   # 首页卡片（含收藏星标）
  composables/
    useFavorites.js  # 收藏夹（localStorage，单例）
  tools/text/
    timestampUtils.js  # 时间戳工具函数（农历、时区、周数等）
```

## 工具配置对象

```js
export default {
  id: 'my-tool',          // 唯一标识，用于路由 /tool/:id
  name: '工具名称',
  category: 'text',       // crypto | hash | encoding | text
  icon: '🔧',
  description: '简短描述',
  layout: 'horizontal',   // horizontal（左右）| vertical（上下）
  options: [],            // 配置项：{ key, label, type, default, values?, placeholder? }
  buttons: [],            // 自定义按钮：{ mode, label }，不设则按 category 自动生成
  execute(input, options, mode) {
    // 同步或异步，返回 { result } 或 throw new Error()
    // mode 对应 buttons 中的 mode
  }
}
```

### options 类型

| type | 用途 | 属性 |
|------|------|------|
| select | 下拉选择 | values: string[] |
| input | 文本输入 | placeholder |
| datetime-local | 日期时间选择器 | step |
| switch | 开关 | - |
| number | 数字输入 | - |

### 自定义视图

当工具需要特殊布局时，设置 `customView: true`，在 `router.js` 中添加专用路由指向自定义 Vue 组件，放在 `timestamp` 路由之前（避免被 `/tool/:id` 匹配）。

## 添加新工具

1. 在 `src/tools/<category>/` 下创建 `.js` 文件，导出配置对象
2. 在 `src/tools/index.js` 中 import 并添加到 `tools` 数组
3. 新增分类需更新 `toolsByCategory`、`categoryNames`、`categoryOrder`

详见 [docs/adding-new-tool.md](docs/adding-new-tool.md)

## 开发命令

```bash
pnpm install    # 安装依赖
pnpm dev        # 开发服务器
pnpm build      # 生产构建
pnpm test       # 运行测试
pnpm test:watch # 监听模式测试
```

## 约定

- 错误处理：`execute` 中 `throw new Error()`，不返回错误字符串
- 加解密：使用 Web Crypto API，不引入第三方加解密库
- 样式：CSS 变量定义在 `src/styles/variables.css`，组件使用 scoped style
- 路由：hash 模式（`createWebHashHistory`）
- 部署 base：`/my-tools/`
- 包管理：pnpm
- 测试：Vitest（全局模式），工具函数测试放在同目录 `.test.js`