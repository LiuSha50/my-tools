<template>
  <div class="tool-page" v-if="tool">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link to="/">首页</router-link>
      <span class="breadcrumb-sep">/</span>
      <span class="breadcrumb-current">{{ tool.name }}</span>
    </nav>

    <h1 class="tool-title">{{ tool.icon }} {{ tool.name }}</h1>
    <p class="tool-description">{{ tool.description }}</p>

    <!-- Options -->
    <div v-if="tool.options && tool.options.length" class="options-bar">
      <div v-for="opt in tool.options" :key="opt.key" class="option-item">
        <label class="option-label">{{ opt.label }}</label>

        <select
          v-if="opt.type === 'select'"
          v-model="optionValues[opt.key]"
          class="option-select"
        >
          <option v-for="v in opt.values" :key="v" :value="v">{{ v }}</option>
        </select>

        <input
          v-else-if="opt.type === 'input'"
          v-model="optionValues[opt.key]"
          type="text"
          class="option-input"
          :placeholder="opt.placeholder || ''"
        />

        <input
          v-else-if="opt.type === 'datetime-local'"
          v-model="optionValues[opt.key]"
          type="datetime-local"
          class="option-input"
          step="1"
        />

        <label v-else-if="opt.type === 'switch'" class="option-switch">
          <input
            v-model="optionValues[opt.key]"
            type="checkbox"
            class="option-switch-input"
            :aria-label="opt.label"
          />
          <span>{{ optionValues[opt.key] ? '开启' : '关闭' }}</span>
        </label>
      </div>
    </div>

    <!-- Action buttons -->
    <div class="action-bar">
      <button
        v-for="btn in actionButtons"
        :key="btn.mode"
        class="action-btn"
        :class="{ 'action-btn-primary': btn.mode === actionButtons[0]?.mode }"
        :disabled="loading"
        @click="execute(btn.mode)"
      >
        {{ btn.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-msg">处理中...</div>

    <!-- Error message -->
    <div v-if="error" class="error-msg">{{ error }}</div>

    <!-- Layout: vertical or horizontal -->
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
  </div>

  <div v-else class="not-found">
    <p>工具未找到</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import InputBox from '../components/InputBox.vue'
import JsonEditorBox from '../components/JsonEditorBox.vue'
import OutputBox from '../components/OutputBox.vue'
import { getToolById } from '../tools/index.js'

const route = useRoute()
const inputText = ref('')
const outputText = ref('')
const error = ref('')
const loading = ref(false)

const tool = computed(() => getToolById(route.params.id))

const optionValues = ref({})

watch(tool, (newTool) => {
  if (newTool) {
    const defaults = {}
    if (newTool.options) {
      newTool.options.forEach(opt => {
        if (opt.default !== undefined) {
          defaults[opt.key] = typeof opt.default === 'function' ? opt.default() : opt.default
        } else {
          defaults[opt.key] = ''
        }
      })
    }
    optionValues.value = defaults
    inputText.value = ''
    outputText.value = ''
    error.value = ''
  }
}, { immediate: true })

const actionButtons = computed(() => {
  if (!tool.value) return []
  if (tool.value.buttons) return tool.value.buttons
  switch (tool.value.category) {
    case 'crypto': return [
      { mode: 'encrypt', label: '加密' },
      { mode: 'decrypt', label: '解密' }
    ]
    case 'hash': return [
      { mode: 'hash', label: '计算' }
    ]
    case 'encoding': return [
      { mode: 'encode', label: '编码' },
      { mode: 'decode', label: '解码' }
    ]
    default: return [
      { mode: 'convert', label: '转换' }
    ]
  }
})

async function execute(mode) {
  error.value = ''
  outputText.value = ''
  loading.value = true

  try {
    const result = await tool.value.execute(inputText.value, optionValues.value, mode)
    outputText.value = result.result
    if (result.fillOptions) {
      Object.assign(optionValues.value, result.fillOptions)
    }
  } catch (e) {
    error.value = e.message || '执行出错'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.breadcrumb {
  font-size: 13px;
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.breadcrumb a {
  color: var(--color-primary);
  text-decoration: none;
}

.breadcrumb a:hover {
  text-decoration: underline;
}

.breadcrumb-sep {
  margin: 0 6px;
  color: var(--color-text-secondary);
}

.breadcrumb-current {
  color: var(--color-text-secondary);
}

.tool-title {
  font-size: 22px;
  font-weight: 500;
  margin-bottom: 4px;
}

.tool-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: calc(var(--spacing-unit) * 3);
}

.options-bar {
  display: flex;
  flex-wrap: wrap;
  gap: calc(var(--spacing-unit) * 2);
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.option-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.option-select,
.option-input {
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);
  min-width: 140px;
}

.option-select:focus,
.option-input:focus {
  border-color: var(--color-primary);
}

.option-switch {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  cursor: pointer;
  color: var(--color-text);
  font-size: 13px;
}

.option-switch-input {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.option-switch-input:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.action-bar {
  display: flex;
  gap: var(--spacing-unit);
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.action-btn {
  padding: 8px 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn-primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.action-btn-primary:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  color: white;
}

.loading-msg {
  padding: calc(var(--spacing-unit) * 1.5);
  background: var(--color-info-bg);
  border: 1px solid var(--color-info-border);
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  font-size: 13px;
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.error-msg {
  padding: calc(var(--spacing-unit) * 1.5);
  background: var(--color-error-bg);
  border: 1px solid var(--color-error-border);
  border-radius: var(--radius-sm);
  color: var(--color-error);
  font-size: 13px;
  margin-bottom: calc(var(--spacing-unit) * 2);
}

.tool-layout {
  display: flex;
  gap: calc(var(--spacing-unit) * 2);
}

.layout-horizontal {
  flex-direction: row;
}

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

.layout-vertical {
  flex-direction: column;
}

.not-found {
  text-align: center;
  padding: calc(var(--spacing-unit) * 8);
}

.not-found a {
  color: var(--color-primary);
  text-decoration: none;
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
  .layout-json-editor :deep(.json-editor-box-host) {
    height: 420px;
    min-height: 420px;
  }

  .layout-json-editor :deep(.cm-editor) {
    height: 420px;
  }
}
</style>
