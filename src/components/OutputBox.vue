<template>
  <div class="output-box">
    <div class="output-box-header">
      <label class="output-box-label">{{ label }}</label>
      <div class="output-box-actions">
        <button v-if="modelValue" class="output-box-btn" @click="copyResult">
          {{ copied ? '已复制' : '复制' }}
        </button>
      </div>
    </div>
    <textarea
      class="output-box-textarea"
      :value="modelValue"
      :placeholder="placeholder"
      :rows="rows"
      readonly
    ></textarea>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '输出' },
  placeholder: { type: String, default: '结果将显示在这里...' },
  rows: { type: Number, default: 6 }
})

const copied = ref(false)

async function copyResult() {
  if (!props.modelValue) return

  try {
    await navigator.clipboard.writeText(props.modelValue)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = props.modelValue
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
}
</script>

<style scoped>
.output-box {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 0.5);
}

.output-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.output-box-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.output-box-btn {
  font-size: 12px;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.output-box-btn:hover {
  background: var(--color-bg);
}

.output-box-textarea {
  width: 100%;
  padding: calc(var(--spacing-unit) * 1.5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  background: var(--color-bg);
  color: var(--color-text);
}
</style>