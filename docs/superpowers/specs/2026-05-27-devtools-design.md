# DevTools 个人工具站设计文档

**创建日期**: 2026-05-27  
**版本**: 1.0

---

## 概述

一个纯前端的个人工具站，提供常用的加解密、编码转换、文本处理等功能。设计目标是简洁大方、干净纯净，采用卡片网格布局，支持轻松扩展新工具。

**部署方式**: GitHub Pages 静态托管  
**技术栈**: Vite + Vue 3 + Vue Router

---

## 功能范围

### 初始工具集

#### 加解密类 (crypto)
- AES 加密/解密（支持 ECB/CBC/CTR 模式，128/192/256 密钥长度）
- DES 加密/解密
- RSA 加密/解密（密钥对生成）

#### 哈希类 (hash)
- MD5
- SHA-1 / SHA-256 / SHA-512

#### 编码类 (encoding)
- Base64 编码/解码
- URL 编码/解码
- Unicode 编码/解码

#### 文本类 (text)
- 大小写转换（大写、小写、首字母大写等）
- 时间戳转换（时间戳 ↔ 日期时间）

---

## 项目结构

```
my-tools/
├── src/
│   ├── tools/              # 工具注册目录
│   │   ├── index.js        # 工具注册表，统一管理所有工具
│   │   ├── hash/           # 哈希工具组
│   │   │   ├── md5.js
│   │   │   └── sha.js
│   │   ├── crypto/         # 加解密工具组
│   │   │   ├── aes.js
│   │   │   ├── des.js
│   │   │   └── rsa.js
│   │   ├── encoding/       # 编码工具组
│   │   │   ├── base64.js
│   │   │   ├── url.js
│   │   │   └── unicode.js
│   │   └── text/           # 文本工具组
│   │       ├── case.js     # 大小写转换
│   │       └── timestamp.js # 时间戳转换
│   ├── components/         # 通用组件
│   │   ├── ToolCard.vue    # 首页工具卡片
│   │   ├── ToolLayout.vue  # 工具页通用布局
│   │   ├── InputBox.vue    # 输入框组件
│   │   └── OutputBox.vue   # 输出框组件
│   ├── views/
│   │   ├── HomeView.vue    # 首页（卡片网格）
│   │   └── ToolView.vue    # 工具详情页
│   ├── App.vue
│   ├── main.js
│   └── router.js           # Vue Router 路由配置
├── index.html
├── vite.config.js
└── package.json
```

---

## 工具注册机制

### 工具配置文件格式

每个工具是一个独立的 `.js` 文件，导出一个标准配置对象：

```js
// tools/crypto/aes.js
export default {
  id: 'aes',
  name: 'AES 加密',
  category: 'crypto',        // 分类：hash / crypto / encoding / text
  icon: '🔐',
  description: 'AES 对称加密与解密',
  
  // 工具交互布局：'vertical'（上下）| 'horizontal'（左右）
  layout: 'vertical',
  
  // 额外配置项（如密钥输入、模式选择等）
  options: [
    { 
      key: 'mode', 
      label: '模式', 
      type: 'select', 
      values: ['ECB', 'CBC', 'CTR'], 
      default: 'CBC' 
    },
    { 
      key: 'keyLength', 
      label: '密钥长度', 
      type: 'select', 
      values: [128, 192, 256], 
      default: 128 
    },
    { 
      key: 'key', 
      label: '密钥', 
      type: 'input', 
      placeholder: '输入密钥...' 
    },
  ],
  
  // 执行函数：接收输入文本和选项，返回结果
  execute(input, options, mode) {
    // mode: 'encrypt' | 'decrypt' | 'hash' | 'encode' | 'decode'
    // 返回 { result: string } 或 Promise<{ result: string }>
    // 出错时抛出 Error
  }
}
```

### 工具注册表

`tools/index.js` 汇总注册所有工具：

```js
import aes from './crypto/aes'
import des from './crypto/des'
import rsa from './crypto/rsa'
import md5 from './hash/md5'
import sha from './hash/sha'
import base64 from './encoding/base64'
import url from './encoding/url'
import unicode from './encoding/unicode'
import caseConverter from './text/case'
import timestamp from './text/timestamp'

export const tools = [
  aes, des, rsa,
  md5, sha,
  base64, url, unicode,
  caseConverter, timestamp
]

// 按分类分组（供首页使用）
export const toolsByCategory = {
  crypto: tools.filter(t => t.category === 'crypto'),
  hash: tools.filter(t => t.category === 'hash'),
  encoding: tools.filter(t => t.category === 'encoding'),
  text: tools.filter(t => t.category === 'text'),
}

// 分类中文名映射
export const categoryNames = {
  crypto: '加解密',
  hash: '哈希',
  encoding: '编码',
  text: '文本',
}
```

---

## 页面与组件设计

### 首页（HomeView.vue）

- **顶部**: 简洁标题 "DevTools"
- **主体**: 按分类分组展示卡片网格
- **分类标题**: 每个分类有小标题（如"加解密"、"哈希"、"编码"、"文本"）
- **卡片内容**: 图标 + 工具名 + 简短描述
- **交互**: 点击卡片跳转到 `/tool/:id`

### 工具详情页（ToolView.vue）

- **面包屑导航**: 首页 > 分类 > 工具名，方便返回
- **自动布局**: 根据工具的 `layout` 字段渲染
  - `vertical`: 上输入框 → 中间操作栏（按钮 + options）→ 下输出框
  - `horizontal`: 左输入框 → 右输出框，操作栏在上方
- **动态选项**: `options` 自动渲染为对应的表单控件（select / input 等）
- **操作按钮**: 
  - 加解密类：「加密」「解密」两个按钮
  - 哈希类：「计算」按钮
  - 编码类：「编码」「解码」按钮
- **一键复制**: 输出框右上角有一键复制按钮

### 通用组件

- **ToolCard.vue**: 首页卡片，接收工具配置，展示图标+名称+描述
- **InputBox.vue**: textarea 输入框，支持清空按钮
- **OutputBox.vue**: 只读输出框，支持一键复制、清空

### 路由配置

```js
// router.js
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ToolView from './views/ToolView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/tool/:id', component: ToolView }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
```

使用 `createWebHashHistory`（hash 模式），兼容 GitHub Pages 静态部署。

---

## 错误处理

- **就近显示**: 工具执行出错时，输出区域显示红色错误提示（如"密钥不能为空"、"输入格式无效"）
- **无干扰**: 不弹模态框、不跳页，错误就近显示在操作区域下方
- **Loading 状态**: 异步操作（如 RSA 密钥生成）显示 loading 状态

---

## 样式系统

### CSS Variables

全局 CSS Variables 定义设计 token：

```css
:root {
  --color-bg: #fafafa;
  --color-surface: #ffffff;
  --color-border: #e5e5e5;
  --color-text: #333333;
  --color-text-secondary: #888888;
  --color-primary: #4a9eda;
  --color-error: #e53e3e;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --spacing-unit: 8px;
}
```

### 设计原则

- **极简白净**: Apple 风格，大面积留白，浅灰背景，细线条
- **无 UI 框架**: 不引入 Element Plus / Ant Design 等，手写基础样式
- **响应式**: 卡片网格在窄屏自动变为 2 列 / 1 列

---

## 加密实现

### Web Crypto API

使用浏览器原生 Web Crypto API：
- **哈希**: `crypto.subtle.digest()` 支持 SHA-1 / SHA-256 / SHA-384 / SHA-512
- **对称加密**: `crypto.subtle.encrypt()` / `decrypt()` 支持 AES-CBC / AES-CTR / AES-GCM
- **RSA**: `crypto.subtle.generateKey()` / `encrypt()` / `decrypt()`

### MD5 / DES 处理

Web Crypto API 不直接支持 MD5 和 DES：
- **MD5**: 使用轻量 polyfill（约 1KB）
- **DES**: 使用轻量 polyfill 或第三方库

---

## 如何添加新工具

详见 `docs/adding-new-tool.md`

---

## 部署配置

详见 `docs/deployment.md`

---

## 技术决策

### 为什么选择 Web Crypto API？

- 浏览器原生支持，零外部依赖
- 安全且经过充分测试
- 体积小，加载快

### 为什么选择 Vue 3？

- 组件化开发，扩展性好
- Vue Router hash 模式兼容 GitHub Pages
- 学习曲线平缓，适合个人项目

### 为什么选择卡片网格布局？

- 视觉清晰，工具一目了然
- 像应用抽屉，符合现代设计趋势
- 新增工具只需添加卡片，无需修改导航结构

---

## 未来扩展

- 更多工具：JSON 格式化、正则测试、颜色转换、JWT 解析等
- 工具收藏功能（localStorage）
- 搜索功能（工具多时快速定位）
- PWA 支持（离线使用）
