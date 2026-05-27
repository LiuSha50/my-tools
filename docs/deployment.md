# 部署到 GitHub Pages

本文档详细说明如何将 DevTools 部署到 GitHub Pages。

---

## 前置准备

1. 拥有 GitHub 账号
2. 已安装 Git
3. 已安装 Node.js（建议 18+）
4. 已安装 pnpm（或其他包管理器）

---

## 第一步：创建 GitHub 仓库

1. 访问 https://github.com/new
2. 填写仓库名称：`my-tools`（或其他名称）
3. 选择 **Public**（GitHub Pages 免费版仅支持公开仓库）
4. 点击 **Create repository**

---

## 第二步：初始化本地项目

```bash
cd my-tools

# 初始化 Git
git init
git add .
git commit -m "Initial commit"

# 关联远程仓库（替换为你的用户名）
git remote add origin https://github.com/YOUR_USERNAME/my-tools.git
git branch -M main
git push -u origin main
```

---

## 第三步：配置 Vite

编辑 `vite.config.js`，设置 `base` 为仓库名称：

```js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 重要：设置为你的仓库名称
  base: '/my-tools/',
})
```

> ⚠️ **注意**: `base` 必须与 GitHub 仓库名称一致，否则资源路径会错误。

---

## 第四步：添加 GitHub Actions 工作流

创建文件 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

---

## 第五步：启用 GitHub Pages

1. 进入仓库页面：`https://github.com/YOUR_USERNAME/my-tools`
2. 点击 **Settings**
3. 左侧菜单点击 **Pages**
4. **Source** 选择 **GitHub Actions**
5. 保存

---

## 第六步：部署

```bash
git add .github/workflows/deploy.yml vite.config.js
git commit -m "Add GitHub Pages deployment"
git push
```

推送后 GitHub Actions 会自动构建和部署。

---

## 访问网站

部署完成后（约 1-2 分钟），访问：

```
https://YOUR_USERNAME.github.io/my-tools/
```

---

## 更新部署

每次推送到 `main` 分支都会自动重新部署：

```bash
git add .
git commit -m "Update something"
git push
```

---

## 常见问题

### Q: 部署后页面空白或资源 404？

检查 `vite.config.js` 的 `base` 是否与仓库名称一致：

```js
base: '/my-tools/'  // 必须与仓库名完全一致（包括斜杠）
```

### Q: 如何查看部署状态？

1. 进入仓库页面
2. 点击 **Actions** 标签
3. 查看最新的工作流运行状态

### Q: 部署失败怎么办？

1. 点击失败的工作流查看日志
2. 常见错误：
   - `pnpm install` 失败 → 检查 `package.json`
   - `pnpm build` 失败 → 检查代码错误
   - 权限错误 → 检查仓库 Settings → Pages → Source 是否为 GitHub Actions

### Q: 如何使用自定义域名？

1. 在仓库根目录创建 `CNAME` 文件，内容为你的域名（如 `tools.example.com`）
2. 在域名 DNS 设置中添加 CNAME 记录指向 `YOUR_USERNAME.github.io`
3. 在 GitHub Settings → Pages 中填写自定义域名
4. 勾选 **Enforce HTTPS**

---

## 手动部署（备选方案）

如果不想使用 GitHub Actions，可以手动部署：

```bash
# 构建
pnpm build

# 安装 gh-pages
pnpm add -D gh-pages

# 部署
npx gh-pages -d dist
```

在 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "deploy": "pnpm build && gh-pages -d dist"
  }
}
```

然后在 Settings → Pages 中将 Source 改为 **Deploy from a branch**，选择 `gh-pages` 分支。

---

## 检查清单

部署前确认：

- [ ] `vite.config.js` 的 `base` 与仓库名称一致
- [ ] `.github/workflows/deploy.yml` 已创建
- [ ] 仓库 Settings → Pages → Source 已设置为 GitHub Actions
- [ ] 代码已推送到 `main` 分支
- [ ] Actions 工作流运行成功
