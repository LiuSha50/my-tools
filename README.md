# DevTools

开发者常用工具集，纯前端实现，无需后端服务。

## 工具列表

### 加解密

| 工具 | 说明 |
|------|------|
| 🔐 AES 加密 | AES 对称加密与解密（支持 CBC/CTR/GCM 模式） |
| 🔒 DES 加密 | 兼容 DES 8 字节短密钥的对称加密 |
| 🔑 RSA 加密 | RSA 非对称加密与解密（Web Crypto API） |

### 哈希

| 工具 | 说明 |
|------|------|
| # MD5 | MD5 哈希计算 |
| # SHA | SHA 哈希计算（SHA-1/256/384/512） |

### 编码

| 工具 | 说明 |
|------|------|
| B₆₄ Base64 | Base64 编码与解码 |
| % URL 编码 | URL 编码与解码 |
| U+ Unicode 编码 | Unicode 编码与解码 |

### 文本

| 工具 | 说明 |
|------|------|
| Aa 大小写转换 | 文本大小写转换 |
| ⏱ 时间戳转换 | 时间戳与日期互转，支持农历、时区选择 |

### 数学

| 工具 | 说明 |
|------|------|
| ∿ 三角函数手册 | 常见三角函数与反三角函数交互式速查 |

## 特性

- 纯前端，无需后端，数据不离开浏览器
- 常用工具置顶收藏（localStorage 存储）
- 响应式布局，支持移动端
- 基于 Web Crypto API 的原生加解密

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build

# 运行测试
pnpm test
```

## 技术栈

- Vue 3 + Vue Router
- Vite
- Vitest
- lunar-javascript（农历计算）
- Web Crypto API（加解密）

## 部署

详见 [docs/deployment.md](docs/deployment.md)

在线访问：[https://liusha50.github.io/my-tools/](https://liusha50.github.io/my-tools/)

## 添加新工具

详见 [docs/adding-new-tool.md](docs/adding-new-tool.md)
