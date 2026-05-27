<template>
  <div class="input-box">
    <div class="input-box-header">
      <label class="input-box-label">{{ label }}</label>
      <button v-if="modelValue" class="input-box-clear" @click="$emit('update:modelValue', '')">清空</button>
    </div>
    <textarea
      class="input-box-textarea"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :rows="rows"
    ></textarea>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '输入' },
  placeholder: { type: String, default: '请输入内容...' },
  rows: { type: Number, default: 6 }
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.input-box {
  display: flex;
  flex-direction: column;
  gap: calc(var(--spacing-unit) * 0.5);
}

.input-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-box-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
}

.input-box-clear {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.input-box-clear:hover {
  background: var(--color-bg);
  color: var(--color-text);
}

.input-box-textarea {
  width: 100%;
  padding: calc(var(--spacing-unit) * 1.5);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
  outline: none;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 0.2s;
}

.input-box-textarea:focus {
  border-color: var(--color-primary);
}

.input-box-textarea::placeholder {
  color: var(--color-text-secondary);
}
</style>