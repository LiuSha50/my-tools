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

  try {
    await navigator.clipboard.writeText(props.modelValue)
    copied.value = true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = props.modelValue
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
  }

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

<style scoped>
.json-editor-box {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 0.5);
}

.json-editor-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.json-editor-box-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.json-editor-box-copy {
  padding: 2px 8px;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--color-primary);
  background: none;
  cursor: pointer;
  font-size: 12px;
}

.json-editor-box-copy:hover {
  background: var(--color-bg);
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
</style>
