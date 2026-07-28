<script setup lang="ts">
import { computed, nextTick } from 'vue'
import { functionCatalog } from '../catalog'
import type { MainFunctionId } from '../types'
import MathFormula from './MathFormula.vue'

type WorkbenchCategory = 'trig' | 'inverse'
type MarkerKey = 'keyPoints' | 'zeros' | 'extrema' | 'asymptotes'

interface MarkerVisibility {
  keyPoints: boolean
  zeros: boolean
  extrema: boolean
  asymptotes: boolean
}

const props = defineProps<{
  category: WorkbenchCategory
  selectedIds: MainFunctionId[]
  markerVisibility: MarkerVisibility
  selectionError: string
}>()

const emit = defineEmits<{
  'toggle-function': [id: MainFunctionId]
  'toggle-marker': [marker: MarkerKey]
  'restore-default': []
  'change-category': [category: WorkbenchCategory]
}>()

const categories = [
  { id: 'trig', label: '三角函数' },
  { id: 'inverse', label: '反三角函数' },
] as const

const markerOptions = [
  { key: 'keyPoints', label: '关键点' },
  { key: 'zeros', label: '零点' },
  { key: 'extrema', label: '极值点' },
  { key: 'asymptotes', label: '渐近线' },
] as const

const availableDefinitions = computed(() => functionCatalog.filter(
  definition => definition.category === props.category,
))

function checkboxId(id: MainFunctionId): string {
  return `trigonometry-function-${id}`
}

function onFunctionChange(event: Event, id: MainFunctionId) {
  const checkbox = event.currentTarget as HTMLInputElement
  emit('toggle-function', id)
  void nextTick(() => {
    checkbox.checked = props.selectedIds.includes(id)
  })
}
</script>

<template>
  <aside class="function-selector" data-function-selector aria-label="函数与图像标记设置">
    <div class="category-switch" aria-label="函数类别">
      <button
        v-for="item in categories"
        :key="item.id"
        type="button"
        :data-category="item.id"
        :aria-pressed="category === item.id"
        @click="emit('change-category', item.id)"
      >
        {{ item.label }}
      </button>
    </div>

    <fieldset class="function-options">
      <legend>选择函数（最多 4 个）</legend>
      <div class="function-option-list">
        <label
          v-for="definition in availableDefinitions"
          :key="definition.id"
          class="function-option"
          :class="{ 'function-option--selected': selectedIds.includes(definition.id as MainFunctionId) }"
          :for="checkboxId(definition.id as MainFunctionId)"
        >
          <input
            :id="checkboxId(definition.id as MainFunctionId)"
            type="checkbox"
            :value="definition.id"
            :checked="selectedIds.includes(definition.id as MainFunctionId)"
            @change="onFunctionChange($event, definition.id as MainFunctionId)"
          >
          <span
            class="function-swatch"
            data-function-swatch
            aria-hidden="true"
            :style="{ '--function-color': definition.style.color }"
          >
            <span
              class="line-pattern"
              data-line-pattern
              :data-pattern="definition.style.pattern"
            />
          </span>
          <span class="function-option__content">
            <span class="function-option__name">{{ definition.name }}</span>
            <MathFormula
              :formula="definition.formula"
              :label="`${definition.name}公式：${definition.formula}`"
            />
          </span>
        </label>
      </div>
      <p
        class="selection-error"
        data-selection-error
        aria-live="polite"
        aria-atomic="true"
      >
        {{ selectionError }}
      </p>
      <button
        v-if="selectedIds.length === 0"
        type="button"
        class="restore-button"
        data-action="restore-default"
        @click="emit('restore-default')"
      >
        恢复默认选择
      </button>
    </fieldset>

    <fieldset class="marker-options">
      <legend>图像标记</legend>
      <div class="marker-option-list">
        <button
          v-for="marker in markerOptions"
          :key="marker.key"
          type="button"
          :data-marker="marker.key"
          :aria-pressed="markerVisibility[marker.key]"
          @click="emit('toggle-marker', marker.key)"
        >
          {{ marker.label }}
        </button>
      </div>
    </fieldset>
  </aside>
</template>

<style scoped>
.function-selector {
  min-width: 0;
  color: var(--color-text, #30343b);
}

.category-switch,
.marker-option-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.category-switch {
  margin-bottom: 16px;
}

button {
  min-height: 38px;
  padding: 7px 12px;
  border: 1px solid var(--color-border, #d9dde3);
  border-radius: 8px;
  background: var(--color-surface, #fff);
  color: inherit;
  font: inherit;
  cursor: pointer;
}

button[aria-pressed="true"] {
  border-color: var(--color-primary, #2563eb);
  background: color-mix(in srgb, var(--color-primary, #2563eb) 10%, transparent);
  color: var(--color-primary, #2563eb);
}

button:focus-visible,
input:focus-visible + .function-swatch {
  outline: 2px solid var(--color-primary, #2563eb);
  outline-offset: 2px;
}

fieldset {
  min-width: 0;
  margin: 0;
  padding: 14px;
  border: 1px solid var(--color-border, #d9dde3);
  border-radius: 10px;
}

fieldset + fieldset {
  margin-top: 14px;
}

legend {
  padding: 0 6px;
  font-weight: 650;
}

.function-option-list {
  display: grid;
  gap: 8px;
}

.function-option {
  display: grid;
  grid-template-columns: auto 38px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
}

.function-option:hover,
.function-option--selected {
  border-color: var(--color-border, #d9dde3);
  background: var(--color-surface-soft, #f6f7f9);
}

.function-option input {
  width: 18px;
  height: 18px;
  margin: 0;
}

.function-swatch {
  display: grid;
  place-items: center;
  width: 38px;
  height: 24px;
  border-radius: 5px;
  background: color-mix(in srgb, var(--function-color) 13%, transparent);
}

.line-pattern {
  display: block;
  width: 26px;
  border-top: 3px solid var(--function-color);
}

.line-pattern[data-pattern="dashed"] {
  border-top-style: dashed;
}

.line-pattern[data-pattern="dotted"] {
  border-top-style: dotted;
}

.line-pattern[data-pattern="dash-dot"] {
  height: 3px;
  border: 0;
  background: repeating-linear-gradient(
    to right,
    var(--function-color) 0 8px,
    transparent 8px 11px,
    var(--function-color) 11px 13px,
    transparent 13px 17px
  );
}

.function-option__content {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 4px 10px;
  min-width: 0;
}

.function-option__name {
  font-weight: 600;
}

.selection-error {
  min-height: 1.4em;
  margin: 8px 0 0;
  color: var(--color-danger, #b42318);
  font-size: 0.875rem;
}

.restore-button {
  margin-top: 6px;
}

@media (max-width: 720px) {
  .function-selector {
    width: 100%;
  }
}
</style>
