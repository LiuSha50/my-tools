# 如何添加新工具

本文档详细说明如何为 DevTools 添加新工具，方便后续扩展。

---

## 快速概览

添加新工具只需 **3 步**：

1. 在 `src/tools/` 对应分类目录下创建工具文件
2. 按标准格式导出工具配置对象
3. 在 `src/tools/index.js` 中注册

**无需修改任何组件代码**，系统会自动识别并渲染。

---

## 第一步：创建工具文件

### 确定分类

首先确定工具属于哪个分类：

| 分类 | 目录 | 适用工具 |
|------|------|----------|
| crypto | `src/tools/crypto/` | 对称加密、非对称加密 |
| hash | `src/tools/hash/` | 哈希计算（MD5、SHA 等） |
| encoding | `src/tools/encoding/` | 编解码（Base64、URL、Unicode 等） |
| text | `src/tools/text/` | 文本处理（大小写、时间戳、格式化等） |

### 创建文件

在对应目录下创建 `.js` 文件，如 `src/tools/encoding/hex.js`：

```js
// src/tools/encoding/hex.js

export default {
  // 唯一标识符（用于路由和内部引用）
  id: 'hex',
  
  // 显示名称
  name: 'Hex 编码',
  
  // 所属分类（必须与目录对应）
  category: 'encoding',
  
  // 图标（emoji 或图标类名）
  icon: '🔢',
  
  // 简短描述（显示在卡片上）
  description: '十六进制编码与解码',
  
  // 布局方式：'vertical'（上下）或 'horizontal'（左右）
  // - vertical: 适合输入输出较长的工具（加密、格式化等）
  // - horizontal: 适合实时预览的工具（大小写、编码等）
  layout: 'horizontal',
  
  // 额外配置项（可选）
  options: [
    // 下拉选择
    {
      key: 'format',
      label: '格式',
      type: 'select',
      values: ['uppercase', 'lowercase'],
      default: 'uppercase'
    },
    // 文本输入
    {
      key: 'separator',
      label: '分隔符',
      type: 'input',
      placeholder: '如空格、逗号等',
      default: ''
    },
    // 开关
    {
      key: 'addPrefix',
      label: '添加 0x 前缀',
      type: 'switch',
      default: false
    }
  ],
  
  // 执行函数
  // @param {string} input - 用户输入的文本
  // @param {Object} options - 用户选择的配置
  // @param {string} mode - 操作模式：'encode' | 'decode' | 'hash' | 'encrypt' | 'decrypt'
  // @returns {Object|Promise<Object>} - 返回 { result: string } 或异步版本
  execute(input, options, mode) {
    if (!input) {
      throw new Error('请输入内容')
    }
    
    if (mode === 'encode') {
      // 编码逻辑
      let hex = Array.from(input)
        .map(c => c.charCodeAt(0).toString(16))
        .join(options.separator || '')
      
      if (options.format === 'uppercase') {
        hex = hex.toUpperCase()
      }
      
      if (options.addPrefix) {
        hex = '0x' + hex
      }
      
      return { result: hex }
      
    } else if (mode === 'decode') {
      // 解码逻辑
      let hexStr = input.replace(/0x/gi, '').replace(/\s+/g, '')
      const bytes = []
      for (let i = 0; i < hexStr.length; i += 2) {
        bytes.push(String.fromCharCode(parseInt(hexStr.substr(i, 2), 16)))
      }
      return { result: bytes.join('') }
    }
  }
}
```

---

## 第二步：注册工具

编辑 `src/tools/index.js`，添加 import 和注册：

```js
// src/tools/index.js

// ... 其他 import
import hex from './encoding/hex'  // 新增

export const tools = [
  // ... 其他工具
  hex  // 新增
]

// 后续代码无需修改，toolsByCategory 会自动包含新工具
```

---

## 第三步：完成

保存文件后，开发服务器会自动热更新：

- ✅ 首页自动显示新工具卡片
- ✅ 点击卡片进入工具详情页
- ✅ 布局、选项、按钮自动渲染

---

## 配置项详解

### options 字段

`options` 是一个数组，每个元素定义一个配置项：

#### type: 'select'（下拉选择）

```js
{
  key: 'mode',           // 字段名（用于 options.mode 访问）
  label: '模式',         // 显示标签
  type: 'select',        // 类型
  values: ['ECB', 'CBC', 'CTR'],  // 选项值
  default: 'CBC'         // 默认值
}
```

#### type: 'input'（文本输入）

```js
{
  key: 'key',
  label: '密钥',
  type: 'input',
  placeholder: '输入密钥...',
  default: ''
}
```

#### type: 'switch'（开关）

```js
{
  key: 'addPrefix',
  label: '添加前缀',
  type: 'switch',
  default: false
}
```

#### type: 'number'（数字输入）

```js
{
  key: 'rounds',
  label: '迭代次数',
  type: 'number',
  min: 1,
  max: 100,
  default: 10
}
```

### layout 字段

- **vertical**: 上输入 → 中间操作 → 下输出（适合长文本、加密等）
- **horizontal**: 左输入 → 右输出（适合实时预览、编码转换等）

### execute 函数

```js
execute(input, options, mode) {
  // input: 用户输入的文本（string）
  // options: 用户选择的配置（object）
  // mode: 操作模式
  //   - 'encode' / 'decode'（编码类工具）
  //   - 'encrypt' / 'decrypt'（加密类工具）
  //   - 'hash'（哈希类工具）
  //   - 'convert'（转换类工具）
  
  // 返回值：
  // - 同步：return { result: '处理结果' }
  // - 异步：return Promise.resolve({ result: '处理结果' })
  
  // 错误处理：
  // throw new Error('错误信息')
}
```

---

## 异步操作示例

如果工具需要异步操作（如 RSA 密钥生成），使用 async/await：

```js
async execute(input, options, mode) {
  if (mode === 'generate') {
    // 生成 RSA 密钥对
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: options.keyLength,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )
    
    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    
    return {
      result: `公钥：\n${btoa(String.fromCharCode(...new Uint8Array(publicKey)))}\n\n私钥：\n${btoa(String.fromCharCode(...new Uint8Array(privateKey)))}`
    }
  }
}
```

---

## 完整示例：添加一个 JSON 格式化工具

### 1. 创建文件 `src/tools/text/json.js`

```js
export default {
  id: 'json',
  name: 'JSON 格式化',
  category: 'text',
  icon: '{}',
  description: 'JSON 格式化与压缩',
  layout: 'horizontal',
  
  options: [
    {
      key: 'indent',
      label: '缩进',
      type: 'select',
      values: [2, 4, '\t'],
      default: 2
    }
  ],
  
  execute(input, options, mode) {
    if (!input) {
      throw new Error('请输入 JSON')
    }
    
    try {
      const obj = JSON.parse(input)
      
      if (mode === 'format') {
        return { result: JSON.stringify(obj, null, options.indent) }
      } else if (mode === 'minify') {
        return { result: JSON.stringify(obj) }
      }
    } catch (e) {
      throw new Error('JSON 格式错误：' + e.message)
    }
  }
}
```

### 2. 注册到 `src/tools/index.js`

```js
import json from './text/json'

export const tools = [
  // ... 其他工具
  json
]
```

### 3. 完成

首页自动显示 "JSON 格式化" 卡片，点击进入即可使用。

---

## 常见问题

### Q: 如何添加工具到新的分类？

在 `src/tools/index.js` 的 `toolsByCategory` 和 `categoryNames` 中添加新分类即可：

```js
export const toolsByCategory = {
  // ... 现有分类
  newCategory: tools.filter(t => t.category === 'newCategory'),
}

export const categoryNames = {
  // ... 现有分类
  newCategory: '新分类名',
}
```

### Q: 如何自定义按钮文字？

系统根据 `category` 自动选择按钮：
- crypto → 「加密」「解密」
- hash → 「计算」
- encoding → 「编码」「解码」
- text → 「转换」

如需自定义，可在工具配置中添加 `buttons` 字段：

```js
buttons: [
  { mode: 'format', label: '格式化' },
  { mode: 'minify', label: '压缩' }
]
```

### Q: 如何处理文件上传？

目前暂不支持文件上传，所有工具基于文本输入。如需支持大文件，可考虑添加 `type: 'file'` 的 option 类型。

---

## 检查清单

添加新工具前，确认：

- [ ] 选择了正确的分类目录
- [ ] `id` 是唯一的（不与其他工具冲突）
- [ ] `execute` 函数正确处理了所有 `mode`
- [ ] 错误情况使用 `throw new Error()` 而非返回错误字符串
- [ ] 在 `src/tools/index.js` 中注册了工具
- [ ] 测试了所有操作模式和配置选项
