# Trigonometry Handbook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 DevTools 中新增“数学”分类和一个完整、响应式、可交互的中文三角函数与反三角函数速查手册，同时保持现有工具行为不变。

**Architecture:** 使用懒加载的专用 Vue 视图接入现有路由，以 `src/features/trigonometry/catalog.ts` 作为唯一数学事实来源。纯 TypeScript 绘图模块负责连续分支、采样、π 刻度和 SVG 路径，Vue 组件只组合状态、SVG 和教学内容；KaTeX 由单一组件封装并随 Vite 本地打包。

**Tech Stack:** Vue 3、Vue Router、TypeScript、Vite、Vitest、Vue Test Utils、jsdom、KaTeX、原生 SVG、CSS Custom Properties。

## Global Constraints

- 全文默认使用弧度制，并明确显示 `k ∈ Z`。
- 只收录 6 个基础三角函数、4 个主要反三角函数，以及补充内容中的 arcsec、arccsc。
- arccot 固定采用主值范围 `(0, π)`。
- tan、cot、sec、csc 必须按连续分支绘制，禁止跨渐近线连接。
- 三角函数横轴使用 π 倍数刻度；反三角函数横轴使用实数刻度、纵轴使用 π 倍数刻度。
- 主图同一分区最多比较 4 个函数，默认选择 `sin x`。
- KaTeX 必须本地安装并由 Vite 打包，禁止使用 CDN，固定 `trust: false`。
- 页面路由必须懒加载，GitHub Pages 基础路径保持 `/my-tools/`，继续使用 hash 路由。
- 只有三角函数页面使用宽版布局和局部深浅主题；现有页面保持当前 960px 布局和视觉。
- 不修改现有通用输入框、输出框、收藏逻辑或普通 `ToolView` 行为。
- 保留工作区已有的 JSON 格式化、`package.json`、锁文件和工具注册改动，不覆盖或撤销用户工作。
- 使用稳定唯一 ID，Vue 列表禁止使用数组下标作为 key。
- 所有交互控件必须可由键盘操作，390px 视口不得产生页面级横向滚动。
- 每个任务遵循测试先行；任务完成后只提交该任务涉及的文件。

---

## File Map

### Existing files to modify

- `package.json`：增加 KaTeX、TypeScript、Vue 类型检查和组件测试依赖与脚本；保留现有 json5 改动。
- `pnpm-lock.yaml`：由 pnpm 更新，保留当前锁文件内容。
- `src/tools/index.js`：注册数学分类和三角函数卡片；保留 jsonFormat 注册。
- `src/router.js`：导出路由表，增加懒加载专用路由。
- `src/App.vue`：通过路由 meta 切换默认/宽版容器，不改变普通页面。

### New integration files

- `tsconfig.json`：仅为新增 TypeScript/Vue 代码提供类型检查。
- `src/env.d.ts`：声明 Vite/Vue 模块类型。
- `src/tools/math/trigonometry.js`：首页卡片元数据。
- `src/views/TrigonometryView.vue`：页面入口与模块编排。
- `src/tools/index.test.js`：工具分类与注册回归测试。
- `src/router.test.js`：专用路由和宽版 meta 测试。

### New feature files

- `src/features/trigonometry/types.ts`：领域类型。
- `src/features/trigonometry/catalog.ts`：12 个函数的统一数学目录。
- `src/features/trigonometry/catalog.test.ts`：目录完整性与数学基准测试。
- `src/features/trigonometry/plotting/piFormatting.ts`：π 分数格式化与刻度。
- `src/features/trigonometry/plotting/piFormatting.test.ts`：π 格式化测试。
- `src/features/trigonometry/plotting/coordinates.ts`：数据坐标与 SVG 坐标转换。
- `src/features/trigonometry/plotting/branches.ts`：可见连续分支计算。
- `src/features/trigonometry/plotting/sampling.ts`：分支采样、裁剪和 SVG path 生成。
- `src/features/trigonometry/plotting/sampling.test.ts`：断裂曲线和非有限值测试。
- `src/features/trigonometry/composables/usePlotViewport.ts`：缩放、平移和重置视口。
- `src/features/trigonometry/composables/usePlotViewport.test.ts`：视口纯函数测试。
- `src/features/trigonometry/composables/useTrigonometryWorkbench.ts`：分区选择和显示开关。
- `src/features/trigonometry/composables/useTrigonometryWorkbench.test.ts`：默认选择和上限测试。
- `src/features/trigonometry/composables/useTrigonometryTheme.ts`：局部主题与持久化。
- `src/features/trigonometry/mathRendering.ts`：KaTeX 安全调用和文本降级结果。
- `src/features/trigonometry/components/MathFormula.vue`：KaTeX 安全渲染与文本降级。
- `src/features/trigonometry/components/MathFormula.test.ts`：KaTeX 渲染测试。
- `src/features/trigonometry/components/FunctionSelector.vue`：函数多选和图像标记开关。
- `src/features/trigonometry/components/FunctionPlot.vue`：主 SVG 图像和交互入口。
- `src/features/trigonometry/components/PlotAxes.vue`：坐标轴、π 刻度和渐近线。
- `src/features/trigonometry/components/PlotSeries.vue`：独立分支 path。
- `src/features/trigonometry/components/PlotMarkers.vue`：关键点、零点和极值。
- `src/features/trigonometry/components/PlotTooltip.vue`：悬停、点击固定和触摸坐标。
- `src/features/trigonometry/components/PropertyPanel.vue`：桌面性质表和移动属性卡。
- `src/features/trigonometry/components/InverseRelationPanel.vue`：原函数限制与反函数对照。
- `src/features/trigonometry/components/InverseRelationPanel.test.ts`：三个显示开关测试。
- `src/features/trigonometry/components/MistakeList.vue`：10 个易错点和例题。
- `src/features/trigonometry/components/SupplementPanel.vue`：arcsec、arccsc 约定说明。
- `src/features/trigonometry/components/SymbolLegend.vue`：符号、颜色和线型说明。
- `src/features/trigonometry/components/TrigonometryWorkbench.vue`：科学工作台组合组件。
- `src/features/trigonometry/components/TrigonometryWorkbench.test.ts`：核心交互和可访问性测试。
- `src/features/trigonometry/styles.css`：页面级主题、桌面和移动响应式样式。

---

### Task 1: Feature registration, TypeScript, and lazy route shell

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `src/tools/index.js`
- Modify: `src/router.js`
- Modify: `src/App.vue`
- Create: `tsconfig.json`
- Create: `src/env.d.ts`
- Create: `src/tools/math/trigonometry.js`
- Create: `src/views/TrigonometryView.vue`
- Create: `src/tools/index.test.js`
- Create: `src/router.test.js`

**Interfaces:**
- Produces: tool metadata `{ id: 'trigonometry', category: 'math', customView: true }`.
- Produces: named export `routes` from `src/router.js`.
- Produces: route meta `{ layout: 'wide' }` for `/tool/trigonometry`.
- Produces: `pnpm typecheck`; component tests select jsdom with Vitest file pragmas.

- [ ] **Step 1: Write the failing registration tests**

Create `src/tools/index.test.js`:

```js
import { describe, expect, test } from 'vitest'
import { categoryNames, categoryOrder, getToolById, toolsByCategory } from './index.js'

describe('数学工具注册', () => {
  test('注册三角函数手册及数学分类', () => {
    expect(getToolById('trigonometry')).toMatchObject({
      id: 'trigonometry',
      category: 'math',
      customView: true,
    })
    expect(categoryNames.math).toBe('数学')
    expect(categoryOrder).toContain('math')
    expect(toolsByCategory.math.map(tool => tool.id)).toContain('trigonometry')
  })
})
```

Create `src/router.test.js`:

```js
import { describe, expect, test, vi } from 'vitest'

vi.mock('vue-router', () => ({
  createRouter: vi.fn(options => options),
  createWebHashHistory: vi.fn(() => ({})),
}))

import { routes } from './router.js'

describe('三角函数手册路由', () => {
  test('固定路由位于动态工具路由之前并使用宽版布局', () => {
    const fixedIndex = routes.findIndex(route => route.path === '/tool/trigonometry')
    const dynamicIndex = routes.findIndex(route => route.path === '/tool/:id')
    expect(fixedIndex).toBeGreaterThan(-1)
    expect(fixedIndex).toBeLessThan(dynamicIndex)
    expect(routes[fixedIndex].meta).toEqual({ layout: 'wide' })
    expect(typeof routes[fixedIndex].component).toBe('function')
  })
})
```

- [ ] **Step 2: Run the registration tests and verify failure**

Run:

```bash
pnpm test -- src/tools/index.test.js src/router.test.js
```

Expected: FAIL because `math`, `trigonometry`, exported `routes`, and the fixed route do not exist.

- [ ] **Step 3: Install dependencies without removing existing package entries**

Run:

```bash
pnpm add katex
pnpm add -D typescript vue-tsc @vue/test-utils jsdom
```

Add this script to `package.json` without changing existing scripts:

```json
"typecheck": "vue-tsc --noEmit"
```

- [ ] **Step 4: Add TypeScript configuration**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "noEmit": true,
    "allowJs": true,
    "checkJs": false,
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.vue"]
}
```

Create `src/env.d.ts`:

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 5: Add tool metadata and route shell**

Create `src/tools/math/trigonometry.js`:

```js
export default {
  id: 'trigonometry',
  name: '三角函数手册',
  category: 'math',
  icon: '∿',
  description: '常见三角函数与反三角函数交互式速查',
  customView: true,
}
```

Register it in `src/tools/index.js`, add a `math` getter, set `categoryNames.math = '数学'`, and append `math` to `categoryOrder`. Preserve `jsonFormat` and every current tool.

Export `routes` from `src/router.js` and insert:

```js
{
  path: '/tool/trigonometry',
  name: 'trigonometry',
  component: () => import('./views/TrigonometryView.vue'),
  meta: { layout: 'wide' },
}
```

Create a minimal semantic shell in `src/views/TrigonometryView.vue` containing the breadcrumb, page title, “默认弧度制” and `k ∈ Z`; Task 9 expands this shell into the complete page.

Update `App.vue` to read `useRoute()` and apply `app-wide` only when `route.meta.layout === 'wide'`. Keep `#app` at 960px by default and set `.app-wide { max-width: 1280px; }`.

- [ ] **Step 6: Run focused tests, typecheck, and build**

Run:

```bash
pnpm test -- src/tools/index.test.js src/router.test.js
pnpm typecheck
pnpm build
```

Expected: all commands PASS; build output contains a lazy `TrigonometryView` chunk and does not report unresolved KaTeX assets.

- [ ] **Step 7: Commit the integration shell**

```bash
git add package.json pnpm-lock.yaml tsconfig.json src/env.d.ts src/tools/math/trigonometry.js src/tools/index.js src/tools/index.test.js src/router.js src/router.test.js src/App.vue src/views/TrigonometryView.vue
git commit -m "feat: 注册三角函数手册专用页面"
```

---

### Task 2: Typed mathematical catalog

**Files:**
- Create: `src/features/trigonometry/types.ts`
- Create: `src/features/trigonometry/catalog.ts`
- Create: `src/features/trigonometry/catalog.test.ts`

**Interfaces:**
- Produces: `FunctionId`, `FunctionCategory`, `MathPoint`, `IntervalText`, `FunctionDefinition`, and `InverseRelation` types.
- Produces: `functionCatalog: readonly FunctionDefinition[]`.
- Produces: `getFunctionDefinition(id: FunctionId): FunctionDefinition`.
- Produces: `mainFunctionIds`, `trigFunctionIds`, `inverseFunctionIds`, and `supplementFunctionIds`.

- [ ] **Step 1: Write failing catalog coverage tests**

Create `catalog.test.ts` with these exact assertions:

```ts
import { describe, expect, test } from 'vitest'
import {
  functionCatalog,
  getFunctionDefinition,
  inverseFunctionIds,
  mainFunctionIds,
  supplementFunctionIds,
  trigFunctionIds,
} from './catalog'

describe('三角函数目录', () => {
  test('包含 10 个主要函数和 2 个补充函数且 ID 唯一', () => {
    expect(trigFunctionIds).toEqual(['sin', 'cos', 'tan', 'cot', 'sec', 'csc'])
    expect(inverseFunctionIds).toEqual(['arcsin', 'arccos', 'arctan', 'arccot'])
    expect(supplementFunctionIds).toEqual(['arcsec', 'arccsc'])
    expect(mainFunctionIds).toHaveLength(10)
    expect(new Set(functionCatalog.map(item => item.id)).size).toBe(12)
  })

  test.each(mainFunctionIds)('%s 具有完整速查字段', id => {
    const item = getFunctionDefinition(id)
    expect(item.formula).toBeTruthy()
    expect(item.domain).toBeTruthy()
    expect(item.range).toBeTruthy()
    expect(item.parity).toBeTruthy()
    expect(item.increasingIntervals).toBeDefined()
    expect(item.decreasingIntervals).toBeDefined()
    expect(item.period).toBeTruthy()
    expect(item.zeros).toBeTruthy()
    expect(item.extrema).toBeTruthy()
    expect(item.continuousIntervals).toBeTruthy()
    expect(item.derivative).toBeTruthy()
    expect(item.keyPoints.length).toBeGreaterThan(0)
  })

  test('固定反三角函数主值约定', () => {
    expect(getFunctionDefinition('arcsin').principalRange).toBe('[-\\pi/2, \\pi/2]')
    expect(getFunctionDefinition('arccos').principalRange).toBe('[0, \\pi]')
    expect(getFunctionDefinition('arctan').principalRange).toBe('(-\\pi/2, \\pi/2)')
    expect(getFunctionDefinition('arccot').principalRange).toBe('(0, \\pi)')
    expect(getFunctionDefinition('arccot').evaluate(-1)).toBeCloseTo(3 * Math.PI / 4)
  })

  test('补充函数不进入主要反三角函数列表', () => {
    expect(supplementFunctionIds).not.toContain('arcsin')
    expect(getFunctionDefinition('arcsec').category).toBe('supplement')
    expect(getFunctionDefinition('arccsc').conventionNote).toContain('教材')
  })
})
```

- [ ] **Step 2: Run the catalog test and verify failure**

Run:

```bash
pnpm test -- src/features/trigonometry/catalog.test.ts
```

Expected: FAIL because the typed catalog does not exist.

- [ ] **Step 3: Define exact domain types**

Create `types.ts` with these public shapes:

```ts
export type FunctionId =
  | 'sin' | 'cos' | 'tan' | 'cot' | 'sec' | 'csc'
  | 'arcsin' | 'arccos' | 'arctan' | 'arccot'
  | 'arcsec' | 'arccsc'

export type MainFunctionId = Exclude<FunctionId, 'arcsec' | 'arccsc'>
export type FunctionCategory = 'trig' | 'inverse' | 'supplement'
export type LinePattern = 'solid' | 'dashed' | 'dash-dot' | 'dotted'
export type IntervalText = string

export interface MathPoint {
  id: string
  x: number
  y: number
  xLabel: string
  yLabel: string
  kind: 'key' | 'zero' | 'maximum' | 'minimum'
}

export interface InverseRelation {
  originalId: 'sin' | 'cos' | 'tan' | 'cot'
  inverseId: 'arcsin' | 'arccos' | 'arctan' | 'arccot'
  restriction: string
  restrictionBounds: { min: number; max: number; minOpen: boolean; maxOpen: boolean }
}

export interface FunctionDefinition {
  id: FunctionId
  category: FunctionCategory
  name: string
  formula: string
  domain: string
  range: string
  principalRange?: string
  parity: string
  increasingIntervals: readonly IntervalText[]
  decreasingIntervals: readonly IntervalText[]
  period: string
  zeros: string
  extrema: string
  verticalAsymptotes: readonly string[]
  horizontalAsymptotes: readonly string[]
  continuousIntervals: readonly IntervalText[]
  derivative: string
  endpointNotes: readonly string[]
  limitNotes: readonly string[]
  keyPoints: readonly MathPoint[]
  evaluate: (x: number) => number
  isDefined: (x: number) => boolean
  inverseRelation?: InverseRelation
  conventionNote?: string
  style: { color: string; darkColor: string; pattern: LinePattern; label: string }
}
```

- [ ] **Step 4: Implement all 12 catalog entries from the approved spec**

Implement `catalog.ts` using the exact mathematical content in `docs/superpowers/specs/2026-07-28-trigonometry-handbook-design.md` §§6.1–6.3. Use these evaluator definitions:

```ts
const evaluators = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  cot: (x: number) => 1 / Math.tan(x),
  sec: (x: number) => 1 / Math.cos(x),
  csc: (x: number) => 1 / Math.sin(x),
  arcsin: Math.asin,
  arccos: Math.acos,
  arctan: Math.atan,
  arccot: (x: number) => Math.atan2(1, x) > 0 ? Math.atan2(1, x) : Math.atan2(1, x) + Math.PI,
  arcsec: (x: number) => Math.acos(1 / x),
  arccsc: (x: number) => Math.asin(1 / x),
} satisfies Record<FunctionId, (x: number) => number>
```

Use an epsilon only for numeric `isDefined` checks; never use epsilon to change displayed symbolic domains. Assign stable point IDs such as `sin-zero-0` and `arccot-origin`. Include every representative coordinate listed in spec §6.

- [ ] **Step 5: Add mathematical spot checks**

Extend `catalog.test.ts`:

```ts
test('关键坐标可由计算函数复现', () => {
  for (const item of functionCatalog.filter(entry => entry.category !== 'supplement')) {
    for (const point of item.keyPoints) {
      expect(item.evaluate(point.x)).toBeCloseTo(point.y, 10)
    }
  }
})

test('sec 和 csc 的单调区间在渐近线处分开', () => {
  expect(getFunctionDefinition('sec').increasingIntervals).toEqual([
    '(2k\\pi, \\pi/2 + 2k\\pi)',
    '(\\pi/2 + 2k\\pi, \\pi + 2k\\pi)',
  ])
  expect(getFunctionDefinition('csc').decreasingIntervals).toEqual([
    '(2k\\pi, \\pi/2 + 2k\\pi)',
    '(3\\pi/2 + 2k\\pi, 2\\pi + 2k\\pi)',
  ])
})
```

- [ ] **Step 6: Run catalog tests and typecheck**

Run:

```bash
pnpm test -- src/features/trigonometry/catalog.test.ts
pnpm typecheck
```

Expected: PASS with 12 unique entries and no TypeScript errors.

- [ ] **Step 7: Commit the catalog**

```bash
git add src/features/trigonometry/types.ts src/features/trigonometry/catalog.ts src/features/trigonometry/catalog.test.ts
git commit -m "feat: 添加三角函数统一数学目录"
```

---

### Task 3: π formatting, coordinates, and branch-safe sampling

**Files:**
- Create: `src/features/trigonometry/plotting/piFormatting.ts`
- Create: `src/features/trigonometry/plotting/piFormatting.test.ts`
- Create: `src/features/trigonometry/plotting/coordinates.ts`
- Create: `src/features/trigonometry/plotting/branches.ts`
- Create: `src/features/trigonometry/plotting/sampling.ts`
- Create: `src/features/trigonometry/plotting/sampling.test.ts`

**Interfaces:**
- Produces: `formatPiMultiple(value: number): string`.
- Produces: `createPiTicks(min: number, max: number, step: number): PlotTick[]`.
- Produces: `dataToSvg(point, viewport, size): SvgPoint` and `svgToData(point, viewport, size): DataPoint`.
- Produces: `getVisibleBranches(id, xMin, xMax): BranchInterval[]`.
- Produces: `sampleFunctionBranches(definition, viewport, options): SampledBranch[]`.
- Produces: `pointsToPath(points): string`.

- [ ] **Step 1: Write failing π formatting tests**

Create `piFormatting.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { createPiTicks, formatPiMultiple } from './piFormatting'

describe('π 格式化', () => {
  test.each([
    [0, '0'],
    [Math.PI / 4, 'π/4'],
    [-Math.PI / 2, '−π/2'],
    [Math.PI, 'π'],
    [2 * Math.PI, '2π'],
    [3 * Math.PI / 2, '3π/2'],
  ])('格式化 %s', (value, label) => {
    expect(formatPiMultiple(value)).toBe(label)
  })

  test('生成稳定且唯一的 π 刻度', () => {
    expect(createPiTicks(-Math.PI, Math.PI, Math.PI / 2).map(tick => tick.label)).toEqual([
      '−π', '−π/2', '0', 'π/2', 'π',
    ])
  })
})
```

- [ ] **Step 2: Write failing branch and sampling tests**

Create `sampling.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { getFunctionDefinition } from '../catalog'
import { getVisibleBranches } from './branches'
import { pointsToPath, sampleFunctionBranches } from './sampling'

const viewport = { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -4, yMax: 4 }

describe('断裂函数采样', () => {
  test.each([
    ['tan', 4],
    ['cot', 4],
    ['sec', 5],
    ['csc', 4],
  ] as const)('%s 生成多个连续分支', (id, minimum) => {
    expect(getVisibleBranches(id, viewport.xMin, viewport.xMax).length).toBeGreaterThanOrEqual(minimum)
  })

  test('tan 分支不跨越 π/2 渐近线', () => {
    const branches = getVisibleBranches('tan', -Math.PI, Math.PI)
    for (const branch of branches) {
      expect(branch.min < Math.PI / 2 && branch.max > Math.PI / 2).toBe(false)
      expect(branch.min < -Math.PI / 2 && branch.max > -Math.PI / 2).toBe(false)
    }
  })

  test('SVG 路径不包含非有限值', () => {
    const branches = sampleFunctionBranches(getFunctionDefinition('csc'), viewport, {
      width: 800,
      samplesPerPixel: 0.75,
    })
    const paths = branches.map(branch => pointsToPath(branch.points))
    expect(paths.join(' ')).not.toMatch(/NaN|Infinity/)
    expect(paths.every(path => path.startsWith('M'))).toBe(true)
  })
})
```

- [ ] **Step 3: Run tests and verify failure**

Run:

```bash
pnpm test -- src/features/trigonometry/plotting/piFormatting.test.ts src/features/trigonometry/plotting/sampling.test.ts
```

Expected: FAIL because formatting, branches, and sampling modules do not exist.

- [ ] **Step 4: Implement formatting and coordinate transforms**

Use rational denominators `[1, 2, 3, 4, 6]` and tolerance `1e-8` in `formatPiMultiple`. If no fraction matches, return a decimal with at most three fractional digits. Define:

```ts
export interface PlotViewport { xMin: number; xMax: number; yMin: number; yMax: number }
export interface PlotSize { width: number; height: number; padding: { top: number; right: number; bottom: number; left: number } }
export interface PlotTick { value: number; label: string }
export interface DataPoint { x: number; y: number }
export interface SvgPoint { x: number; y: number }
```

Make `dataToSvg` and `svgToData` exact inverses within floating-point tolerance.

- [ ] **Step 5: Implement symbolic branch generation**

`getVisibleBranches` must derive intervals from exact asymptote families:

- tan/sec boundaries: `π/2 + kπ`.
- cot/csc boundaries: `kπ`.
- sin/cos and inverse functions: one branch clipped to the definition domain.

Represent boundaries as:

```ts
export interface BranchInterval {
  id: string
  min: number
  max: number
  minOpen: boolean
  maxOpen: boolean
}
```

Use stable IDs built from the function ID and integer branch index.

- [ ] **Step 6: Implement sampling and SVG path generation**

For each branch, inset open boundaries by `max((xMax - xMin) / width / 4, 1e-8)`, sample independently, discard non-finite values, and clamp line segments to the visible y-range with a small overscan. Return no path for fewer than two points.

`pointsToPath` must emit one `M` followed by `L` commands and never concatenate different branch arrays.

- [ ] **Step 7: Run plotting tests and typecheck**

Run:

```bash
pnpm test -- src/features/trigonometry/plotting/piFormatting.test.ts src/features/trigonometry/plotting/sampling.test.ts
pnpm typecheck
```

Expected: PASS; no path contains a non-finite coordinate.

- [ ] **Step 8: Commit plotting primitives**

```bash
git add src/features/trigonometry/plotting
git commit -m "feat: 实现三角函数分支采样与坐标格式化"
```

---

### Task 4: Workbench and viewport state

**Files:**
- Create: `src/features/trigonometry/composables/usePlotViewport.ts`
- Create: `src/features/trigonometry/composables/usePlotViewport.test.ts`
- Create: `src/features/trigonometry/composables/useTrigonometryWorkbench.ts`
- Create: `src/features/trigonometry/composables/useTrigonometryWorkbench.test.ts`

**Interfaces:**
- Produces: `createDefaultViewport(category, selectedIds): PlotViewport`.
- Produces: `zoomViewport(viewport, factor, center): PlotViewport`.
- Produces: `panViewport(viewport, delta): PlotViewport`.
- Produces: `useTrigonometryWorkbench()` with `activeCategory`, `trigSelection`, `inverseSelection`, `selectedIds`, `toggleFunction`, `restoreDefault`, `markerVisibility`, and `selectionError`.

- [ ] **Step 1: Write failing state tests**

Create `useTrigonometryWorkbench.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { useTrigonometryWorkbench } from './useTrigonometryWorkbench'

describe('工作台状态', () => {
  test('默认选择 sin 并分别保留两个分区选择', () => {
    const state = useTrigonometryWorkbench()
    expect(state.selectedIds.value).toEqual(['sin'])
    state.activeCategory.value = 'inverse'
    expect(state.selectedIds.value).toEqual(['arcsin'])
    state.activeCategory.value = 'trig'
    expect(state.selectedIds.value).toEqual(['sin'])
  })

  test('最多允许选择 4 个函数', () => {
    const state = useTrigonometryWorkbench()
    for (const id of ['cos', 'tan', 'cot'] as const) state.toggleFunction(id)
    state.toggleFunction('sec')
    expect(state.selectedIds.value).toEqual(['sin', 'cos', 'tan', 'cot'])
    expect(state.selectionError.value).toContain('最多比较 4 个')
  })

  test('清空后可恢复当前分区默认函数', () => {
    const state = useTrigonometryWorkbench()
    state.toggleFunction('sin')
    expect(state.selectedIds.value).toEqual([])
    state.restoreDefault()
    expect(state.selectedIds.value).toEqual(['sin'])
  })
})
```

Create `usePlotViewport.test.ts` to assert that zoom keeps the requested data point fixed, pan preserves span, and reset selects `[-2π, 2π]` for trig functions.

- [ ] **Step 2: Run state tests and verify failure**

Run:

```bash
pnpm test -- src/features/trigonometry/composables/useTrigonometryWorkbench.test.ts src/features/trigonometry/composables/usePlotViewport.test.ts
```

Expected: FAIL because composables do not exist.

- [ ] **Step 3: Implement workbench state**

Use Vue `ref` and `computed`, with these defaults:

```ts
const trigSelection = ref<MainFunctionId[]>(['sin'])
const inverseSelection = ref<MainFunctionId[]>(['arcsin'])
const activeCategory = ref<'trig' | 'inverse'>('trig')
const markerVisibility = reactive({ keyPoints: true, zeros: true, extrema: true, asymptotes: true })
```

Reject a fifth selection without mutating the current array. Clear `selectionError` on the next successful selection change.

- [ ] **Step 4: Implement viewport math**

Use these reset ranges:

- sin/cos only: x `[-2π, 2π]`, y `[-1.5, 1.5]`.
- trig selection containing tan/cot/sec/csc: x `[-2π, 2π]`, y `[-4, 4]`.
- inverse selection: x `[-4, 4]`, y `[-π, π]`, with arcsin/arccos curves naturally clipped by their domains.

Clamp zoom so each axis span stays between `1e-4` and `1e4`; reject non-finite centers and deltas.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
pnpm test -- src/features/trigonometry/composables/useTrigonometryWorkbench.test.ts src/features/trigonometry/composables/usePlotViewport.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit workbench state**

```bash
git add src/features/trigonometry/composables/usePlotViewport.ts src/features/trigonometry/composables/usePlotViewport.test.ts src/features/trigonometry/composables/useTrigonometryWorkbench.ts src/features/trigonometry/composables/useTrigonometryWorkbench.test.ts
git commit -m "feat: 添加三角函数工作台状态与视口控制"
```

---

### Task 5: Safe KaTeX formula component

**Files:**
- Create: `src/features/trigonometry/mathRendering.ts`
- Create: `src/features/trigonometry/components/MathFormula.vue`
- Create: `src/features/trigonometry/components/MathFormula.test.ts`

**Interfaces:**
- Produces: `<MathFormula :formula="string" :display="boolean" :label="string" />`.
- Produces: `renderFormula(formula, display, renderer?): { html: string | null; text: string }`.
- Behavior: KaTeX `trust: false`, `throwOnError: false`, HTML+MathML output, escaped text fallback on thrown renderer errors.

- [ ] **Step 1: Write failing component tests**

Create `MathFormula.test.ts` with jsdom environment:

```ts
// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import { renderFormula } from '../mathRendering'
import MathFormula from './MathFormula.vue'

describe('MathFormula', () => {
  test('渲染 KaTeX 和可访问名称', () => {
    const wrapper = mount(MathFormula, {
      props: { formula: '\\sin x', label: '正弦 x' },
    })
    expect(wrapper.find('.katex').exists()).toBe(true)
    expect(wrapper.attributes('aria-label')).toBe('正弦 x')
  })

  test('渲染器抛错时返回原始文本降级结果', () => {
    const result = renderFormula('\\bad', false, () => { throw new Error('render failed') })
    expect(result).toEqual({ html: null, text: '\\bad' })
  })
})
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm test -- src/features/trigonometry/components/MathFormula.test.ts
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the KaTeX wrapper**

Implement `mathRendering.ts` with an injectable renderer for deterministic fallback tests. Import `katex/dist/katex.min.css` once in the component or feature entry. Compute rendered HTML only when `formula` or `display` changes:

```ts
katex.renderToString(props.formula, {
  displayMode: props.display,
  throwOnError: false,
  trust: false,
  output: 'htmlAndMathml',
  strict: 'warn',
})
```

Return `{ html: null, text: formula }` if rendering throws. The component renders `html` with `v-html` only when non-null and otherwise renders `text` with `v-text`; never accept user-provided formulas.

- [ ] **Step 4: Run test, typecheck, and build**

Run:

```bash
pnpm test -- src/features/trigonometry/components/MathFormula.test.ts
pnpm typecheck
pnpm build
```

Expected: PASS; build emits KaTeX font assets under Vite's generated assets directory.

- [ ] **Step 5: Commit formula rendering**

```bash
git add src/features/trigonometry/mathRendering.ts src/features/trigonometry/components/MathFormula.vue src/features/trigonometry/components/MathFormula.test.ts
git commit -m "feat: 添加安全的 KaTeX 公式组件"
```

---

### Task 6: SVG plot components and interaction

**Files:**
- Create: `src/features/trigonometry/components/FunctionPlot.vue`
- Create: `src/features/trigonometry/components/PlotAxes.vue`
- Create: `src/features/trigonometry/components/PlotSeries.vue`
- Create: `src/features/trigonometry/components/PlotMarkers.vue`
- Create: `src/features/trigonometry/components/PlotTooltip.vue`
- Create: `src/features/trigonometry/components/FunctionPlot.test.ts`

**Interfaces:**
- `FunctionPlot` props: `functionIds: MainFunctionId[]`, `category: 'trig' | 'inverse'`, `markerVisibility`.
- `FunctionPlot` emits: `viewport-change` with `PlotViewport`.
- `PlotSeries` receives one function definition plus `SampledBranch[]` and renders one path per branch using `branch.id` as key.
- `PlotTooltip` receives a nullable data point and formats x/y with π labels when the axis represents angles.

- [ ] **Step 1: Write failing SVG behavior tests**

Create `FunctionPlot.test.ts`:

```ts
// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import FunctionPlot from './FunctionPlot.vue'

describe('FunctionPlot', () => {
  test('tan 渲染多个独立 path 和渐近线', async () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['tan'],
        category: 'trig',
        markerVisibility: { keyPoints: true, zeros: true, extrema: true, asymptotes: true },
      },
      attachTo: document.body,
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.findAll('[data-series="tan"] path').length).toBeGreaterThan(1)
    expect(wrapper.findAll('[data-asymptote]').length).toBeGreaterThan(0)
  })

  test('提供键盘可操作的缩放和重置按钮', () => {
    const wrapper = mount(FunctionPlot, {
      props: {
        functionIds: ['sin'],
        category: 'trig',
        markerVisibility: { keyPoints: true, zeros: true, extrema: true, asymptotes: true },
      },
    })
    expect(wrapper.get('button[aria-label="放大图像"]').exists()).toBe(true)
    expect(wrapper.get('button[aria-label="缩小图像"]').exists()).toBe(true)
    expect(wrapper.get('button[aria-label="重置图像范围"]').exists()).toBe(true)
    expect(wrapper.get('svg').attributes('role')).toBe('img')
  })
})
```

- [ ] **Step 2: Run the plot test and verify failure**

Run:

```bash
pnpm test -- src/features/trigonometry/components/FunctionPlot.test.ts
```

Expected: FAIL because plot components do not exist.

- [ ] **Step 3: Implement axes and series**

Use a `ResizeObserver` in `FunctionPlot` and skip path generation until width and height are positive. Render axes, grid, origin labels, normal numeric ticks, π ticks, and dashed asymptotes in `PlotAxes`. Render each sampled branch as a separate `<path>` in `PlotSeries`; add `<title>` with the function name and use both stroke color and dash pattern.

- [ ] **Step 4: Implement markers and tooltip**

Render catalog key points only when they are inside the viewport and definition domain. Give every marker a `<title>` containing function name and exact coordinate labels. Implement pointer hover, click-to-pin, Escape-to-clear, and touch/pointer dragging for a crosshair.

- [ ] **Step 5: Implement zoom, pan, and textual summary**

Wheel zoom centers on the pointer. Pointer drag pans only after exceeding a 3px threshold. Buttons call the same pure viewport functions. Under the SVG, render a visually concise but screen-reader-available summary listing selected functions, viewport ranges, visible asymptotes, and visible key points.

Remove `ResizeObserver`, pointer listeners, and pending animation frames on unmount.

- [ ] **Step 6: Run plot tests, typecheck, and build**

Run:

```bash
pnpm test -- src/features/trigonometry/components/FunctionPlot.test.ts src/features/trigonometry/plotting/sampling.test.ts
pnpm typecheck
pnpm build
```

Expected: PASS; tan/cot/sec/csc are represented by multiple branch paths.

- [ ] **Step 7: Commit the plot**

```bash
git add src/features/trigonometry/components/FunctionPlot.vue src/features/trigonometry/components/PlotAxes.vue src/features/trigonometry/components/PlotSeries.vue src/features/trigonometry/components/PlotMarkers.vue src/features/trigonometry/components/PlotTooltip.vue src/features/trigonometry/components/FunctionPlot.test.ts
git commit -m "feat: 实现可缩放的三角函数 SVG 图像"
```

---

### Task 7: Selector, property presentation, and workbench composition

**Files:**
- Create: `src/features/trigonometry/components/FunctionSelector.vue`
- Create: `src/features/trigonometry/components/PropertyPanel.vue`
- Create: `src/features/trigonometry/components/TrigonometryWorkbench.vue`
- Create: `src/features/trigonometry/components/TrigonometryWorkbench.test.ts`

**Interfaces:**
- `FunctionSelector` props: current category, selected IDs, marker visibility, selection error.
- `FunctionSelector` emits: `toggle-function`, `toggle-marker`, `restore-default`, `change-category`.
- `PropertyPanel` props: `definitions: FunctionDefinition[]`; renders a semantic table and CSS-driven mobile attribute cards from the same values.
- `TrigonometryWorkbench` owns `useTrigonometryWorkbench()` and passes state to selector, plot, and property panel.

- [ ] **Step 1: Write failing workbench interaction tests**

Create `TrigonometryWorkbench.test.ts`:

```ts
// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import TrigonometryWorkbench from './TrigonometryWorkbench.vue'

describe('TrigonometryWorkbench', () => {
  test('默认选中 sin 并显示完整性质', () => {
    const wrapper = mount(TrigonometryWorkbench)
    expect((wrapper.get('input[value="sin"]').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.text()).toContain('定义域')
    expect(wrapper.text()).toContain('最小正周期')
    expect(wrapper.text()).toContain('导数')
  })

  test('第五个函数被拒绝并显示就近提示', async () => {
    const wrapper = mount(TrigonometryWorkbench)
    for (const id of ['cos', 'tan', 'cot']) {
      await wrapper.get(`input[value="${id}"]`).setValue(true)
    }
    await wrapper.get('input[value="sec"]').setValue(true)
    expect(wrapper.text()).toContain('最多比较 4 个函数')
    expect((wrapper.get('input[value="sec"]').element as HTMLInputElement).checked).toBe(false)
  })

  test('无选择时提供恢复默认按钮', async () => {
    const wrapper = mount(TrigonometryWorkbench)
    await wrapper.get('input[value="sin"]').setValue(false)
    expect(wrapper.text()).toContain('尚未选择函数')
    expect(wrapper.get('button[data-action="restore-default"]').text()).toContain('恢复默认')
  })
})
```

- [ ] **Step 2: Run test and verify failure**

Run:

```bash
pnpm test -- src/features/trigonometry/components/TrigonometryWorkbench.test.ts
```

Expected: FAIL because selector, property panel, and workbench do not exist.

- [ ] **Step 3: Implement accessible selector**

Use `fieldset` and `legend`; render one real checkbox per function with stable `:key="definition.id"`. Show swatch color, line pattern, formula, and selected state. Render marker toggles as buttons with `aria-pressed`. Keep selection-error text in an `aria-live="polite"` region adjacent to the checkboxes.

- [ ] **Step 4: Implement property table and mobile cards**

For each selected definition render name/formula, domain, range, parity, increasing/decreasing intervals, period, zeros, extrema, vertical/horizontal asymptotes, continuous intervals, derivative, endpoint/limit notes, and key coordinates. Use semantic `<table>` on desktop. Use CSS at `max-width: 720px` to visually convert each function row into labeled blocks; do not duplicate the data in a second component.

- [ ] **Step 5: Compose the workbench**

Render category controls, selector, FunctionPlot, empty state, and current properties. Preserve separate trig/inverse selections. When selected IDs change, reset only when the previous viewport is incompatible with the new category; ordinary multi-select changes retain the current zoom.

- [ ] **Step 6: Run workbench tests and typecheck**

Run:

```bash
pnpm test -- src/features/trigonometry/components/TrigonometryWorkbench.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit the workbench UI**

```bash
git add src/features/trigonometry/components/FunctionSelector.vue src/features/trigonometry/components/PropertyPanel.vue src/features/trigonometry/components/TrigonometryWorkbench.vue src/features/trigonometry/components/TrigonometryWorkbench.test.ts
git commit -m "feat: 添加函数筛选与性质工作台"
```

---

### Task 8: Inverse-function relationship module

**Files:**
- Create: `src/features/trigonometry/components/InverseRelationPanel.vue`
- Create: `src/features/trigonometry/components/InverseRelationPanel.test.ts`
- Create: `src/features/trigonometry/inverseRelations.test.ts`

**Interfaces:**
- Produces: pair selector for arcsin/arccos/arctan/arccot.
- Produces: independent booleans `showOriginal`, `showInverse`, `showSymmetryAxis`.
- Consumes: `inverseRelation` from catalog; no hard-coded restriction text in the component.

- [ ] **Step 1: Write failing relation and component tests**

Create `inverseRelations.test.ts`:

```ts
import { describe, expect, test } from 'vitest'
import { getFunctionDefinition, inverseFunctionIds } from './catalog'

describe('反函数关系', () => {
  test.each(inverseFunctionIds)('%s 具有原函数限制', id => {
    const relation = getFunctionDefinition(id).inverseRelation
    expect(relation).toBeDefined()
    expect(relation?.inverseId).toBe(id)
    expect(relation?.restriction).toBeTruthy()
  })
})
```

Create `InverseRelationPanel.test.ts`:

```ts
// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import InverseRelationPanel from './InverseRelationPanel.vue'

describe('InverseRelationPanel', () => {
  test('三个显示开关彼此独立', async () => {
    const wrapper = mount(InverseRelationPanel)
    const original = wrapper.get('button[aria-label="显示或隐藏受限原函数"]')
    const inverse = wrapper.get('button[aria-label="显示或隐藏反函数"]')
    const axis = wrapper.get('button[aria-label="显示或隐藏对称轴 y=x"]')
    await original.trigger('click')
    expect(original.attributes('aria-pressed')).toBe('false')
    expect(inverse.attributes('aria-pressed')).toBe('true')
    expect(axis.attributes('aria-pressed')).toBe('true')
  })

  test('arccot 显示约定与限制区间', async () => {
    const wrapper = mount(InverseRelationPanel)
    await wrapper.get('select').setValue('arccot')
    expect(wrapper.text()).toContain('(0, π)')
    expect(wrapper.text()).toContain('主值')
  })
})
```

- [ ] **Step 2: Run tests and verify failure**

Run:

```bash
pnpm test -- src/features/trigonometry/inverseRelations.test.ts src/features/trigonometry/components/InverseRelationPanel.test.ts
```

Expected: FAIL because the relation component does not exist.

- [ ] **Step 3: Implement relationship plot**

Use one square SVG coordinate system so reflection about `y = x` is visually truthful. Generate the restricted original from `restrictionBounds`, generate the inverse from its domain, and render `y = x` as a labeled dashed line. Open endpoints use hollow markers; closed endpoints use filled markers.

Display these exact explanations next to the pair selector:

- sin: `[-π/2, π/2]`.
- cos: `[0, π]`.
- tan: `(-π/2, π/2)`.
- cot: `(0, π)`.

- [ ] **Step 4: Run relation tests, typecheck, and build**

Run:

```bash
pnpm test -- src/features/trigonometry/inverseRelations.test.ts src/features/trigonometry/components/InverseRelationPanel.test.ts
pnpm typecheck
pnpm build
```

Expected: PASS.

- [ ] **Step 5: Commit inverse relationships**

```bash
git add src/features/trigonometry/inverseRelations.test.ts src/features/trigonometry/components/InverseRelationPanel.vue src/features/trigonometry/components/InverseRelationPanel.test.ts
git commit -m "feat: 添加原函数与反函数对称关系图"
```

---

### Task 9: Teaching content, theme, and complete page composition

**Files:**
- Create: `src/features/trigonometry/components/MistakeList.vue`
- Create: `src/features/trigonometry/components/SupplementPanel.vue`
- Create: `src/features/trigonometry/components/SymbolLegend.vue`
- Create: `src/features/trigonometry/composables/useTrigonometryTheme.ts`
- Create: `src/features/trigonometry/styles.css`
- Modify: `src/views/TrigonometryView.vue`
- Create: `src/views/TrigonometryView.test.ts`

**Interfaces:**
- `useTrigonometryTheme()` returns `theme`, `resolvedTheme`, and `toggleTheme` and stores only `trigonometry-theme`.
- `TrigonometryView` composes all sections in the exact document order from the spec.

- [ ] **Step 1: Write the failing full-page test**

Create `TrigonometryView.test.ts`:

```ts
// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, test, vi } from 'vitest'
import TrigonometryView from './TrigonometryView.vue'

beforeAll(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    disconnect() {}
  })
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }))
})

describe('TrigonometryView', () => {
  test('包含全部教学分区且范围只限三角函数', () => {
    const wrapper = mount(TrigonometryView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    for (const heading of [
      '三角函数',
      '反三角函数',
      '反函数从哪里来',
      '易错点',
      '补充内容',
      '符号说明',
    ]) {
      expect(wrapper.text()).toContain(heading)
    }
    expect(wrapper.text()).toContain('默认采用弧度制')
    expect(wrapper.text()).toContain('k ∈ Z')
    expect(wrapper.text()).toContain('不同教材可能采用不同的主值范围')
  })

  test('包含规定的易错例题', () => {
    const wrapper = mount(TrigonometryView, {
      global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
    })
    expect(wrapper.text()).toContain('sin⁻¹x')
    expect(wrapper.text()).toContain('arcsin(sin(2π/3)) = π/3')
    expect(wrapper.findAll('details').length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run the page test and verify failure**

Run:

```bash
pnpm test -- src/views/TrigonometryView.test.ts
```

Expected: FAIL because the route shell lacks the complete page.

- [ ] **Step 3: Implement all 10 mistakes and supplemental content**

`MistakeList.vue` must render the ten exact statements from spec §11. Use native `details/summary` for the arcsin example and at least two additional short examples. `SupplementPanel.vue` must present arcsec and arccsc only as supplemental functions and state that textbooks use different principal-value conventions.

`SymbolLegend.vue` must explain `R`, `Z`, `k ∈ Z`, open/closed intervals, `∪`, `\\`, vertical/horizontal asymptotes, point markers, and every line pattern used by the catalog.

- [ ] **Step 4: Implement isolated theme state**

Default to `prefers-color-scheme`, allow manual light/dark switching, and store only `light` or `dark` under `trigonometry-theme`. Apply `data-theme` to the page root, not `document.documentElement`. Remove `matchMedia` listeners on unmount.

- [ ] **Step 5: Implement the approved B layout and complete document order**

Replace the route shell with:

- semantic breadcrumb and header;
- sticky page-anchor navigation;
- `TrigonometryWorkbench` in the science-workbench layout;
- full trig and inverse property sections;
- `InverseRelationPanel`;
- `MistakeList`;
- `SupplementPanel`;
- `SymbolLegend`.

Import `styles.css` only from this feature page. Use a page-owned fixed background layer so dark mode covers the viewport without changing global variables.

- [ ] **Step 6: Add responsive and focus styles**

At widths above 900px, use a 220px selector column and flexible plot column. At 720px and below, turn the selector into horizontally scrollable pills, move the plot above properties, and convert property rows into cards. Add `:focus-visible`, `prefers-reduced-motion`, high-contrast curve patterns, local formula overflow, and `overflow-wrap` for long interval text. Never set page-level `overflow-x: auto`.

- [ ] **Step 7: Run page tests, all feature tests, typecheck, and build**

Run:

```bash
pnpm test -- src/views/TrigonometryView.test.ts src/features/trigonometry
pnpm typecheck
pnpm build
```

Expected: PASS.

- [ ] **Step 8: Commit the complete page**

```bash
git add src/features/trigonometry/components/MistakeList.vue src/features/trigonometry/components/SupplementPanel.vue src/features/trigonometry/components/SymbolLegend.vue src/features/trigonometry/composables/useTrigonometryTheme.ts src/features/trigonometry/styles.css src/views/TrigonometryView.vue src/views/TrigonometryView.test.ts
git commit -m "feat: 完成三角函数交互式速查手册页面"
```

---

### Task 10: Regression, responsive, GitHub Pages, and accessibility verification

**Files:**
- Modify only files found defective by the checks below.
- Update: `README.md` only if the tool list is maintained there after implementation.

**Interfaces:**
- Consumes the complete feature.
- Produces a verified build with no known acceptance failures.

- [ ] **Step 1: Run the complete automated suite**

Run:

```bash
pnpm test
pnpm typecheck
pnpm build
```

Expected: every existing and new test passes; typecheck exits 0; Vite production build exits 0.

- [ ] **Step 2: Serve the production build at the configured base path**

Run:

```bash
pnpm preview --host 127.0.0.1
```

Open `/my-tools/#/tool/trigonometry`. Confirm refresh stays on the handbook route and homepage navigation still works.

- [ ] **Step 3: Verify graph correctness interactively**

At desktop width 1280px:

- enable each of sin, cos, tan, cot, sec, csc separately;
- confirm tan/cot/sec/csc contain separate branches on both sides of every visible asymptote;
- zoom across `π/2`, `π`, and `3π/2` and confirm no bridge appears;
- compare four functions and confirm a fifth is rejected;
- inspect exact key points, zeros, local extrema, and asymptote labels;
- switch to inverse functions and confirm x uses numeric ticks while y uses π ticks;
- test all three inverse-relation display switches independently.

- [ ] **Step 4: Verify responsive behavior**

At 390×844:

- confirm document `scrollWidth === clientWidth`;
- confirm selector pills scroll locally;
- confirm plot appears before property cards;
- confirm formulas scroll only inside their own container;
- confirm no control overlaps the SVG or page navigation.

- [ ] **Step 5: Verify accessibility and themes**

Using keyboard only:

- traverse all function checkboxes, marker toggles, zoom buttons, theme button, inverse switches, and `details` summaries;
- confirm focus is always visible;
- confirm Escape clears a pinned plot tooltip;
- confirm light and dark themes retain readable axes, labels, curves, tables, and KaTeX formulas;
- enable reduced motion and confirm transitions are suppressed;
- inspect the SVG accessible name and textual plot summary.

- [ ] **Step 6: Verify GitHub Pages assets**

Inspect the production page network and console:

- no KaTeX font request returns 404;
- lazy chunks use `/my-tools/assets/` URLs;
- no console error or unhandled rejection occurs;
- no SVG path contains `NaN` or `Infinity`.

- [ ] **Step 7: Fix each discovered defect with a failing regression test**

For every defect, add the smallest focused test that reproduces it, run the test to observe failure, patch the owning module, rerun the focused test, then rerun `pnpm test`, `pnpm typecheck`, and `pnpm build`.

- [ ] **Step 8: Update README tool list if present**

Add under a new “数学” heading:

```markdown
| 工具 | 说明 |
|------|------|
| ∿ 三角函数手册 | 常见三角函数与反三角函数交互式速查 |
```

- [ ] **Step 9: Commit verification fixes and documentation**

Stage only files changed during this task, then run:

```bash
git commit -m "test: 完成三角函数手册回归验证"
```

- [ ] **Step 10: Record final evidence**

Report the exact passing command summaries, tested viewport sizes, branch functions checked, theme states checked, and whether the GitHub Pages asset inspection found any 404. Do not claim completion without fresh output from all three automated commands.
