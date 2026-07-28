<script setup lang="ts">
import { useId } from 'vue'
import type { FunctionDefinition } from '../types'
import MathFormula from './MathFormula.vue'

defineProps<{
  definitions: FunctionDefinition[]
}>()

const titleId = `property-panel-${useId()}-title`

interface PropertyColumn {
  key: string
  label: string
  values: (definition: FunctionDefinition) => readonly string[]
}

const propertyColumns: readonly PropertyColumn[] = [
  { key: 'domain', label: '定义域', values: definition => [definition.domain] },
  { key: 'range', label: '值域', values: definition => [definition.range] },
  {
    key: 'principal-range',
    label: '主值范围',
    values: definition => definition.principalRange ? [definition.principalRange] : [],
  },
  { key: 'parity', label: '奇偶性', values: definition => [definition.parity] },
  {
    key: 'increasing',
    label: '单调递增区间',
    values: definition => definition.increasingIntervals,
  },
  {
    key: 'decreasing',
    label: '单调递减区间',
    values: definition => definition.decreasingIntervals,
  },
  { key: 'period', label: '最小正周期', values: definition => [definition.period] },
  { key: 'zeros', label: '零点', values: definition => [definition.zeros] },
  { key: 'extrema', label: '极值', values: definition => [definition.extrema] },
  {
    key: 'vertical-asymptotes',
    label: '竖直渐近线',
    values: definition => definition.verticalAsymptotes,
  },
  {
    key: 'horizontal-asymptotes',
    label: '水平渐近线',
    values: definition => definition.horizontalAsymptotes,
  },
  {
    key: 'continuous',
    label: '连续区间',
    values: definition => definition.continuousIntervals,
  },
  { key: 'derivative', label: '导数', values: definition => [definition.derivative] },
  {
    key: 'endpoint-notes',
    label: '端点说明',
    values: definition => definition.endpointNotes,
  },
  {
    key: 'limit-notes',
    label: '极限说明',
    values: definition => definition.limitNotes,
  },
  {
    key: 'key-points',
    label: '关键坐标',
    values: definition => definition.keyPoints.map(
      point => `\\left(${point.xLabel}, ${point.yLabel}\\right)`,
    ),
  },
  {
    key: 'convention-note',
    label: '约定说明',
    values: definition => definition.conventionNote ? [definition.conventionNote] : [],
  },
]

const propertyValueScrollStyle = {
  display: 'block',
  minWidth: '0px',
  maxWidth: '100%',
  overflowX: 'auto',
  overflowY: 'hidden',
} as const

function toFormula(value: string): string {
  return value.replace(
    /([\p{Script=Han}，。：；、]+)/gu,
    '\\text{$1}',
  )
}
</script>

<template>
  <section class="property-panel" :aria-labelledby="titleId">
    <h2 :id="titleId">函数性质</h2>
    <div class="property-table-scroll">
      <table class="property-table" aria-label="所选函数性质比较">
        <thead>
          <tr>
            <th scope="col">函数</th>
            <th
              v-for="column in propertyColumns"
              :key="column.key"
              scope="col"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="definition in definitions" :key="definition.id">
            <th scope="row" data-label="函数">
              <strong>{{ definition.name }}</strong>
              <MathFormula
                :formula="definition.formula"
                :label="`${definition.name}公式：${definition.formula}`"
              />
            </th>
            <td
              v-for="column in propertyColumns"
              :key="column.key"
              :data-label="column.label"
            >
              <template v-if="column.values(definition).length > 0">
                <span
                  v-for="(value, index) in column.values(definition)"
                  :key="`${definition.id}-${column.key}-${index}`"
                  class="property-value-scroll"
                  data-property-value-scroll
                  :style="propertyValueScrollStyle"
                >
                  <MathFormula
                    class="property-value"
                    :formula="toFormula(value)"
                    :label="`${definition.name}${column.label}${index + 1}：${value}`"
                  />
                </span>
              </template>
              <span v-else class="property-empty">无</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.property-panel {
  min-width: 0;
  max-width: 100%;
}

.property-panel h2 {
  margin: 0 0 12px;
}

.property-table-scroll {
  max-width: 100%;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  border: 1px solid var(--color-border, #d9dde3);
  border-radius: 10px;
}

.property-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  color: var(--color-text, #30343b);
  font-size: 0.875rem;
}

th,
td {
  max-width: 22rem;
  padding: 10px 12px;
  border-right: 1px solid var(--color-border, #d9dde3);
  border-bottom: 1px solid var(--color-border, #d9dde3);
  text-align: left;
  vertical-align: top;
}

tr:last-child > * {
  border-bottom: 0;
}

tr > *:last-child {
  border-right: 0;
}

thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--color-surface-soft, #f6f7f9);
  white-space: nowrap;
}

tbody th {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 10rem;
  background: var(--color-surface, #fff);
}

tbody th strong,
.property-value {
  display: block;
}

.property-value-scroll + .property-value-scroll {
  margin-top: 5px;
}

:deep(.math-formula) {
  min-width: 0;
  overflow-wrap: anywhere;
}

@media (max-width: 720px) {
  .property-table-scroll {
    overflow: visible;
    border: 0;
  }

  .property-table,
  .property-table tbody,
  .property-table tr,
  .property-table th,
  .property-table td {
    display: block;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  .property-table {
    width: 100%;
  }

  .property-table thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .property-table tr {
    margin-bottom: 14px;
    overflow: hidden;
    border: 1px solid var(--color-border, #d9dde3);
    border-radius: 10px;
    background: var(--color-surface, #fff);
  }

  .property-table tbody th {
    position: static;
    padding: 12px;
    border: 0;
    border-bottom: 1px solid var(--color-border, #d9dde3);
    background: var(--color-surface-soft, #f6f7f9);
  }

  .property-table td {
    display: grid;
    grid-template-columns: minmax(7.5rem, 36%) minmax(0, 1fr);
    gap: 10px;
    padding: 9px 12px;
    border-right: 0;
  }

  .property-table td::before {
    content: attr(data-label);
    color: var(--color-text-secondary, #747b86);
    font-weight: 650;
  }

  :deep(.katex-display) {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }
}
</style>
