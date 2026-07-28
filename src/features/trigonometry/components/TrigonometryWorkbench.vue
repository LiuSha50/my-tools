<script setup lang="ts">
import { computed } from 'vue'
import { getFunctionDefinition } from '../catalog'
import { useTrigonometryWorkbench } from '../composables/useTrigonometryWorkbench'
import type { MainFunctionId } from '../types'
import FunctionPlot from './FunctionPlot.vue'
import FunctionSelector from './FunctionSelector.vue'
import PropertyPanel from './PropertyPanel.vue'

type WorkbenchCategory = 'trig' | 'inverse'
type MarkerKey = 'keyPoints' | 'zeros' | 'extrema' | 'asymptotes'

const {
  activeCategory,
  selectedIds,
  toggleFunction,
  restoreDefault,
  markerVisibility,
  selectionError,
} = useTrigonometryWorkbench()

const selectedDefinitions = computed(() => selectedIds.value.map(
  id => getFunctionDefinition(id),
))

function changeCategory(category: WorkbenchCategory) {
  if (category === activeCategory.value) return
  activeCategory.value = category
  selectionError.value = ''
}

function toggleMarker(marker: MarkerKey) {
  markerVisibility[marker] = !markerVisibility[marker]
}

function toggleSelectedFunction(id: MainFunctionId) {
  toggleFunction(id)
}
</script>

<template>
  <section class="trigonometry-workbench" aria-label="三角函数交互工作台">
    <div class="workbench-main">
      <FunctionSelector
        :category="activeCategory"
        :selected-ids="selectedIds"
        :marker-visibility="markerVisibility"
        :selection-error="selectionError"
        @toggle-function="toggleSelectedFunction"
        @toggle-marker="toggleMarker"
        @restore-default="restoreDefault"
        @change-category="changeCategory"
      />

      <div class="workbench-visualization">
        <FunctionPlot
          v-if="selectedIds.length > 0"
          :function-ids="selectedIds"
          :category="activeCategory"
          :marker-visibility="markerVisibility"
        />
        <section v-else class="empty-state" aria-live="polite">
          <h2>尚未选择函数</h2>
          <p>请在函数列表中选择要查看或比较的函数。</p>
        </section>
      </div>
    </div>

    <PropertyPanel
      v-if="selectedDefinitions.length > 0"
      :definitions="selectedDefinitions"
    />
  </section>
</template>

<style scoped>
.trigonometry-workbench {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: clip;
}

.workbench-main {
  display: grid;
  grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
  min-width: 0;
  margin-bottom: 28px;
}

.workbench-visualization {
  min-width: 0;
}

.empty-state {
  display: grid;
  min-height: 320px;
  place-content: center;
  padding: 24px;
  border: 1px dashed var(--color-border, #d9dde3);
  border-radius: 10px;
  background: var(--color-surface-soft, #f6f7f9);
  text-align: center;
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

.empty-state p {
  margin-top: 8px;
  color: var(--color-text-secondary, #747b86);
}

@media (max-width: 900px) {
  .workbench-main {
    grid-template-columns: 1fr;
  }
}
</style>
