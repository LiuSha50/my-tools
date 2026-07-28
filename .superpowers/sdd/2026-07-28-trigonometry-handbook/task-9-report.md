# Task 9 实现报告

## 完成内容

- 将 `TrigonometryView.vue` 从路由壳层扩展为完整教学页面，按规格依次编排：科学工作台、三角函数性质、反三角函数性质、反函数关系、易错点、补充内容、符号说明。
- 增加 sticky 页内锚点、语义标题层级、面包屑、默认弧度制与 `k ∈ Z` 提示，并在顶部及反三角函数分区突出 `(0, π)` 的 arccot 主值约定。
- 新增十条规格原文含义一致的易错点；包含 3 个原生 `details/summary` 例题，其中完整解释 `arcsin(sin(2π/3)) = π/3`。
- 补充区只通过统一 catalog 读取 `arcsec`、`arccsc`，明确提示不同教材的主值范围约定不同。
- 符号图例覆盖 `R`、`Z`、`k ∈ Z`、开闭区间、`∪`、集合差 `\`、竖直/水平渐近线、点标记，以及 catalog 实际使用的 `solid`、`dashed`、`dash-dot`、`dotted` 四种线型。
- 新增 `useTrigonometryTheme()`：默认跟随系统，只在 `trigonometry-theme` 保存 `light`/`dark`；系统监听在卸载时清理；主题仅通过页面根节点 `data-theme` 解析，不修改 `document.documentElement`。
- 新增页面自有 fixed 全视口背景与局部主题变量。主函数曲线同时使用 catalog 的浅色/深色配色，并由页面主题切换。
- 桌面工作台使用 220px 选择器列和弹性内容列，主图与当前性质均位于右侧；720px 及以下函数选择变为局部横向滚动胶囊，主图先于性质卡，长公式只在局部容器滚动。
- 为重复使用的 `PropertyPanel` 标题生成实例级唯一 ID，避免完整页面出现重复的关联 ID。

## TDD 记录

1. 先新增页面分区顺序、十条易错点、补充函数范围、完整图例和主题隔离测试；初次运行按预期因页面仍为壳层、主题 composable 不存在而失败。
2. 实现页面、教学组件和主题 composable 后，新增测试转绿：2 个测试文件、8 项测试通过。
3. 先增加科学工作台右侧内容列测试，确认缺少 `data-workbench-content` 而失败，再调整组件结构并转绿。
4. 自检时先增加主函数曲线浅/深配色测试，确认缺少主题颜色变量而失败，再改为 catalog 颜色驱动并转绿。

## 自动验证

- 聚焦：`pnpm exec vitest run src/views/TrigonometryView.test.ts src/features/trigonometry`
  - 12 个测试文件通过，97 项测试通过。
- 全量：`pnpm test`
  - 16 个测试文件通过，131 项测试通过。
- 类型检查：`pnpm typecheck`
  - 退出码 0。
- 生产构建：`pnpm build`
  - 退出码 0，三角函数页面继续独立输出懒加载 JS/CSS 和 KaTeX 字体资源。
- `git diff --check`
  - 无空白错误。

全量 Vitest 仍输出此前任务已记录的 Node `--localstorage-file was provided without a valid path` 环境警告；聚焦测试输出无该警告，且测试均通过。

## 浏览器验收

- 1280×900：选择器实测 220px；主图与当前性质同处右侧内容列；分区顺序正确；页面根 `overflow-x: clip`；固定背景生效。
- 390×844：`documentElement.scrollWidth === clientWidth === 375`，无整页横向滚动；函数胶囊列表为局部 `overflow-x: auto`；性质行转换为 `display: block` 卡片；主图位于性质之前。
- 手动主题切换后页面根从 `dark` 变为 `light`，`document.documentElement` 保持无 `data-theme`。
- 浏览器控制台 error/warning 数量为 0。

## 自检结论

- 10 条易错点、3 个展开例题、2 个补充函数、4 种 catalog 线型均有自动测试保护。
- 页面主题、响应式布局、语义顺序、公式标签与 arccot 约定均满足 Task 9 简报。
- 未修改 main，只在 `codex/trigonometry-handbook` 专用工作树完成。
