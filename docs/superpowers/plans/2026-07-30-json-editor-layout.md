# JSON 格式化双栏编辑器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 JSON 格式化工具升级为左侧原始输入、右侧稍宽且可编辑/折叠的结构化 JSON 双栏工作区。

**Architecture:** 保留现有 `jsonFormat.execute()` 作为唯一解析与转换入口，通过工具元数据让通用 `ToolView` 为 JSON 工具选择专用 `JsonEditorBox`。新组件直接管理 CodeMirror 6 生命周期和双向绑定；左右状态仍分别保存在 `inputText` 与 `outputText` 中，不建立回写关系。

**Tech Stack:** Vue 3 Composition API、CodeMirror 6（`@codemirror/state`、`@codemirror/view`、`@codemirror/commands`、`@codemirror/language`、`@codemirror/lang-json`）、Vitest、Vue Test Utils、pnpm。

## Global Constraints

- 仅调整 `json-format` 工具，不改变其他通用工具的布局和输出组件。
- 桌面端左栏约 44%、右栏约 56%；`640px` 及以下改为上下排列。
- 两侧内容互相独立；只有再次执行操作时，左侧结果才覆盖右侧。
- 对象和数组默认全部展开，折叠后在保留的括号之间显示 `…`，视觉结果为 `{…}` 或 `[…]`。
- 保留 JSON5、缩进、格式化、压缩、验证、清空与复制功能。
- 不实现拖动栏宽、JSON Schema、字段表单、自动补全或左右实时同步。

## File Structure

- Create: `src/components/JsonEditorBox.vue` — 封装 CodeMirror 编辑器、折叠扩展、外部值同步、编辑事件、复制和样式。
- Create: `src/components/JsonEditorBox.test.js` — 验证编辑、父级覆盖、折叠、复制和卸载清理。
- Modify: `src/tools/text/jsonFormat.js` — 声明横向布局与 JSON 编辑器结果类型。
- Modify: `src/tools/text/jsonFormat.test.js` — 验证 JSON 工具展示元数据。
- Modify: `src/views/ToolView.vue` — 按元数据选择输出组件并应用 JSON 专用栏宽/高度。
- Modify: `src/views/ToolView.test.js` — 验证集成数据流和其他工具回归。
- Modify: `package.json` — 增加 CodeMirror 6 模块依赖。
- Modify: `pnpm-lock.yaml` — 锁定新增依赖。

---

### Task 1: 可编辑、可折叠的 JSON 结果组件

**Files:**
- Create: `src/components/JsonEditorBox.vue`
- Create: `src/components/JsonEditorBox.test.js`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: `modelValue: string`、可选 `label: string`、可选 `placeholder: string`。
- Produces: `update:modelValue(value: string)`；组件测试接口 `getEditorView(): EditorView | null`；DOM 根类 `.json-editor-box`。

- [ ] **Step 1: 安装最小 CodeMirror 依赖**

Run:

```bash
pnpm add @codemirror/state @codemirror/view @codemirror/commands @codemirror/language @codemirror/lang-json
```

Expected: `package.json` 和 `pnpm-lock.yaml` 新增五个 CodeMirror 6 包，命令成功退出。

- [ ] **Step 2: 编写组件失败测试**

Create `src/components/JsonEditorBox.test.js`：

```js
// @vitest-environment jsdom
import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { foldCode } from '@codemirror/language'
import { describe, expect, test, vi } from 'vitest'
import JsonEditorBox from './JsonEditorBox.vue'

describe('JsonEditorBox', () => {
  test('渲染可编辑 JSON 文档并发送编辑结果', async () => {
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{\n  "a": 1\n}' },
    })
    const view = wrapper.vm.getEditorView()

    expect(view.state.doc.toString()).toBe('{\n  "a": 1\n}')
    expect(wrapper.find('.cm-content').attributes('contenteditable')).toBe('true')
    expect(wrapper.find('.cm-foldGutter').exists()).toBe(true)

    view.dispatch({
      changes: { from: 9, to: 10, insert: '2' },
    })
    await nextTick()

    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['{\n  "a": 2\n}'])
  })

  test('父级新值覆盖编辑器且不会反向重复发送', async () => {
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{"a":1}' },
    })
    const view = wrapper.vm.getEditorView()

    await wrapper.setProps({ modelValue: '[1,2,3]' })

    expect(view.state.doc.toString()).toBe('[1,2,3]')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  test('对象和数组默认展开并可折叠为省略占位', async () => {
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{\n  "items": [\n    1,\n    2\n  ]\n}' },
    })
    const view = wrapper.vm.getEditorView()

    expect(wrapper.find('.cm-foldPlaceholder').exists()).toBe(false)
    view.dispatch({ selection: { anchor: 0 } })
    expect(foldCode(view)).toBe(true)
    await nextTick()

    expect(wrapper.get('.cm-foldPlaceholder').text()).toBe('…')
    expect(view.state.doc.toString()).toContain('"items"')
  })

  test('复制当前编辑内容并在卸载时销毁编辑器', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const wrapper = mount(JsonEditorBox, {
      props: { modelValue: '{"edited":true}' },
    })
    const view = wrapper.vm.getEditorView()
    const destroy = vi.spyOn(view, 'destroy')

    await wrapper.get('[data-test="copy-json-result"]').trigger('click')
    expect(writeText).toHaveBeenCalledWith('{"edited":true}')

    wrapper.unmount()
    expect(destroy).toHaveBeenCalledOnce()
  })
})
```

- [ ] **Step 3: 运行组件测试并确认失败原因正确**

Run:

```bash
pnpm test -- src/components/JsonEditorBox.test.js
```

Expected: FAIL，因为 `src/components/JsonEditorBox.vue` 尚不存在。

- [ ] **Step 4: 实现最小 JsonEditorBox**

Create `src/components/JsonEditorBox.vue`，模板保留与 `OutputBox` 一致的标题/复制操作，编辑器挂载点使用 `ref="editorHost"`：

```vue
<template>
  <div class="json-editor-box">
    <div class="json-editor-box-header">
      <label class="json-editor-box-label">{{ label }}</label>
      <button
        v-if="modelValue"
        class="json-editor-box-copy"
        data-test="copy-json-result"
        @click="copyResult"
      >
        {{ copied ? '已复制' : '复制' }}
      </button>
    </div>
    <div ref="editorHost" class="json-editor-box-host" :data-placeholder="placeholder"></div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import {
  bracketMatching,
  codeFolding,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
  syntaxHighlighting,
} from '@codemirror/language'
import { json } from '@codemirror/lang-json'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '格式化结果' },
  placeholder: { type: String, default: '格式化结果将显示在这里...' },
})
const emit = defineEmits(['update:modelValue'])
const editorHost = ref(null)
const copied = ref(false)
let editorView = null
let applyingExternalValue = false

function getEditorView() {
  return editorView
}

function replaceDocument(value) {
  if (!editorView || value === editorView.state.doc.toString()) return
  applyingExternalValue = true
  editorView.dispatch({
    changes: { from: 0, to: editorView.state.doc.length, insert: value },
  })
  applyingExternalValue = false
}

async function copyResult() {
  if (!props.modelValue) return
  await navigator.clipboard.writeText(props.modelValue)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1500)
}

onMounted(() => {
  editorView = new EditorView({
    parent: editorHost.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        lineNumbers(),
        history(),
        foldGutter(),
        codeFolding({ placeholderText: '…' }),
        bracketMatching(),
        syntaxHighlighting(defaultHighlightStyle),
        keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap]),
        json(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !applyingExternalValue) {
            emit('update:modelValue', update.state.doc.toString())
          }
        }),
      ],
    }),
  })
})

watch(() => props.modelValue, replaceDocument)

onBeforeUnmount(() => {
  editorView?.destroy()
  editorView = null
})

defineExpose({ getEditorView })
</script>
```

在同一文件的 scoped style 中实现以下精确行为：

```css
.json-editor-box {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 0.5);
}

.json-editor-box-host {
  min-height: clamp(420px, 60vh, 720px);
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
}

.json-editor-box-host:focus-within {
  border-color: var(--color-primary);
}

.json-editor-box-host :deep(.cm-editor) {
  height: clamp(420px, 60vh, 720px);
  color: var(--color-text);
  background: var(--color-bg);
  font-family: var(--font-mono);
  font-size: 13px;
}

.json-editor-box-host :deep(.cm-scroller) {
  overflow: auto;
  font-family: inherit;
}

.json-editor-box-host :deep(.cm-gutters) {
  border-right-color: var(--color-border);
  color: var(--color-text-secondary);
  background: var(--color-surface);
}

.json-editor-box-host :deep(.cm-foldPlaceholder) {
  padding: 0 4px;
  border: 0;
  color: var(--color-primary);
  background: transparent;
}
```

标题和复制按钮样式复用 `OutputBox.vue` 的字号、颜色、间距与 hover 规则；保留其中基于临时 textarea 的剪贴板降级路径，不能只依赖测试片段里的 `navigator.clipboard`。

- [ ] **Step 5: 运行组件测试并修正测试环境差异**

Run:

```bash
pnpm test -- src/components/JsonEditorBox.test.js
```

Expected: 4 tests PASS。若 jsdom 缺少 `ResizeObserver`，只在测试文件中提供最小 no-op polyfill，不污染生产组件。

- [ ] **Step 6: 提交独立组件**

```bash
git add package.json pnpm-lock.yaml src/components/JsonEditorBox.vue src/components/JsonEditorBox.test.js
git commit -m "feat: 添加可折叠 JSON 编辑器"
```

---

### Task 2: 接入 JSON 工具双栏布局与独立数据流

**Files:**
- Modify: `src/tools/text/jsonFormat.js:3-18`
- Modify: `src/tools/text/jsonFormat.test.js:1-60`
- Modify: `src/views/ToolView.vue:74-92,314-345`
- Modify: `src/views/ToolView.test.js:1-32`

**Interfaces:**
- Consumes: `JsonEditorBox` 的 `v-model` 接口与 `.json-editor-box` 根类。
- Produces: 工具元数据 `layout: 'horizontal'`、`resultView: 'json-editor'`、`resultLabel: '格式化结果'`；JSON 页面根布局类 `.layout-json-editor`。

- [ ] **Step 1: 编写工具配置失败测试**

在 `src/tools/text/jsonFormat.test.js` 增加：

```js
test('声明横向 JSON 编辑器结果区', () => {
  expect(jsonFormat).toMatchObject({
    layout: 'horizontal',
    resultView: 'json-editor',
    resultLabel: '格式化结果',
  })
})
```

- [ ] **Step 2: 编写页面集成失败测试**

扩展 `src/views/ToolView.test.js`，引入 `nextTick` 和 `JsonEditorBox`，增加：

```js
test('JSON 工具使用右侧稍宽的结构化编辑器', async () => {
  const wrapper = await mountJsonTool()

  expect(wrapper.get('.tool-layout').classes()).toContain('layout-horizontal')
  expect(wrapper.get('.tool-layout').classes()).toContain('layout-json-editor')
  expect(wrapper.findComponent(JsonEditorBox).exists()).toBe(true)
  expect(wrapper.get('.input-box').classes()).toContain('json-input-pane')
})

test('右侧编辑不回写左侧，再次格式化会覆盖右侧', async () => {
  const wrapper = await mountJsonTool()
  const input = wrapper.get('.input-box-textarea')
  await input.setValue('{"value":1}')
  await wrapper.get('.action-btn-primary').trigger('click')

  const editor = wrapper.getComponent(JsonEditorBox).vm.getEditorView()
  expect(editor.state.doc.toString()).toBe('{\n  "value": 1\n}')

  editor.dispatch({ changes: { from: 0, to: editor.state.doc.length, insert: '{"edited":true}' } })
  await nextTick()
  expect(input.element.value).toBe('{"value":1}')

  await wrapper.get('.action-btn-primary').trigger('click')
  expect(editor.state.doc.toString()).toBe('{\n  "value": 1\n}')
})
```

新增 `mountTool(id)` 辅助函数，挂载一个现有非 JSON 通用工具，并增加回归断言：

```js
test('其他工具继续使用普通输出框', async () => {
  const wrapper = await mountTool('base64')
  expect(wrapper.findComponent(JsonEditorBox).exists()).toBe(false)
  expect(wrapper.find('.output-box').exists()).toBe(true)
})
```

- [ ] **Step 3: 运行目标测试并确认失败**

Run:

```bash
pnpm test -- src/tools/text/jsonFormat.test.js src/views/ToolView.test.js
```

Expected: FAIL，配置仍为 `vertical`，且 `ToolView` 尚未渲染 `JsonEditorBox`。

- [ ] **Step 4: 添加 JSON 工具展示元数据**

修改 `src/tools/text/jsonFormat.js`：

```js
layout: 'horizontal',
resultView: 'json-editor',
resultLabel: '格式化结果',
```

不修改 `execute()` 的任何解析或结果语义。

- [ ] **Step 5: 在 ToolView 选择结果组件**

修改模板和 import：

```vue
<div
  :class="[
    'tool-layout',
    `layout-${tool.layout}`,
    { 'layout-json-editor': tool.resultView === 'json-editor' },
  ]"
>
  <InputBox
    v-model="inputText"
    :class="{ 'json-input-pane': tool.resultView === 'json-editor' }"
    :rows="tool.layout === 'horizontal' ? 12 : 6"
  />
  <JsonEditorBox
    v-if="tool.resultView === 'json-editor'"
    v-model="outputText"
    :label="tool.resultLabel"
  />
  <OutputBox
    v-else
    v-model="outputText"
    :rows="tool.layout === 'horizontal' ? 12 : 6"
  />
</div>
```

```js
import JsonEditorBox from '../components/JsonEditorBox.vue'
```

保留 `inputText`、`outputText` 和 `execute()` 的现有职责，使右侧编辑只改变 `outputText`，而 `execute()` 仍只读取 `inputText`。

- [ ] **Step 6: 应用 44/56 栏宽与大工作区**

替换通用横向子项等宽规则，使 JSON 专用规则覆盖它：

```css
.layout-horizontal > * {
  flex: 1 1 0;
  min-width: 0;
}

.layout-json-editor > .json-input-pane {
  flex: 44 1 0;
}

.layout-json-editor > .json-editor-box {
  flex: 56 1 0;
}

.layout-json-editor :deep(.input-box-textarea) {
  height: clamp(420px, 60vh, 720px);
  resize: none;
}

@media (max-width: 640px) {
  .layout-horizontal {
    flex-direction: column;
  }

  .layout-json-editor > .json-input-pane,
  .layout-json-editor > .json-editor-box {
    flex: 1 1 auto;
  }

  .layout-json-editor :deep(.input-box-textarea),
  .layout-json-editor :deep(.cm-editor) {
    height: 420px;
  }
}
```

- [ ] **Step 7: 运行目标测试**

Run:

```bash
pnpm test -- src/tools/text/jsonFormat.test.js src/views/ToolView.test.js src/components/JsonEditorBox.test.js
```

Expected: 全部 PASS；JSON 页面使用专用编辑器，其他工具保持普通输出框。

- [ ] **Step 8: 提交页面集成**

```bash
git add src/tools/text/jsonFormat.js src/tools/text/jsonFormat.test.js src/views/ToolView.vue src/views/ToolView.test.js
git commit -m "feat: 升级 JSON 格式化双栏布局"
```

---

### Task 3: 完整回归与视觉验收

**Files:**
- Modify only if verification exposes a defect in files already listed above.

**Interfaces:**
- Consumes: 完整 JSON 双栏页面。
- Produces: 通过测试、类型检查、生产构建和桌面/窄屏视觉验收的交付结果。

- [ ] **Step 1: 运行完整自动化验证**

Run:

```bash
pnpm test
pnpm run typecheck
pnpm run build
git diff --check
```

Expected: 所有命令退出码为 0，无失败测试、类型错误、构建错误或空白字符错误。

- [ ] **Step 2: 启动本地页面并检查桌面视口**

Run:

```bash
pnpm run dev -- --host 127.0.0.1
```

打开 `/my-tools/#/tool/json-format`，使用包含嵌套对象和数组的 JSON 验证：

- 左侧约 44%、右侧约 56%，两侧高度一致；
- 右侧有行号、语法高亮和折叠箭头；
- 初始全部展开，点击对象和数组折叠箭头后显示 `{…}` 或 `[…]`；
- 修改右侧不会改变左侧，重新格式化会覆盖右侧；
- 复制按钮复制右侧当前内容；
- 长内容在编辑器内部滚动，页面不会无限增高。

- [ ] **Step 3: 检查窄屏视口**

将视口宽度设为 `390px`，确认左右栏变为上下排列、各自高度为 `420px`，按钮、输入框、编辑器和折叠边栏没有横向溢出。

- [ ] **Step 4: 修复验收中发现的问题并重新验证**

只在存在缺陷时修改对应组件或测试，然后重新运行 Step 1 的四条命令，并重新检查受影响视口。所有检查通过后才能进入完成阶段。

- [ ] **Step 5: 提交验收修正（仅在有改动时）**

```bash
git add src/components/JsonEditorBox.vue src/components/JsonEditorBox.test.js src/tools/text/jsonFormat.js src/tools/text/jsonFormat.test.js src/views/ToolView.vue src/views/ToolView.test.js
git commit -m "fix: 完善 JSON 编辑器响应式交互"
```

若 Step 4 没有产生改动，则跳过此提交。

---

## Completion Checklist

- [ ] `json-format` 桌面端为 44/56 左右双栏，窄屏为上下布局。
- [ ] 两侧工作区高度为 `clamp(420px, 60vh, 720px)`，窄屏固定为 `420px`。
- [ ] 右侧支持编辑、JSON 高亮、行号、括号匹配和对象/数组折叠。
- [ ] 右侧编辑不回写左侧，重新执行会覆盖右侧。
- [ ] 复制、JSON5、缩进、格式化、压缩、验证与错误行为无回归。
- [ ] 其他工具继续使用 `OutputBox`。
- [ ] 完整测试、类型检查、构建、diff 检查和视觉检查通过。
