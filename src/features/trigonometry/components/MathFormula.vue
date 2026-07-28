<script setup lang="ts">
import { computed } from 'vue'
import 'katex/dist/katex.min.css'
import { renderFormula } from '../mathRendering'

const props = withDefaults(defineProps<{
  formula: string
  display?: boolean
  label?: string
}>(), {
  display: false,
  label: '',
})

const rendered = computed(() => renderFormula(props.formula, props.display))
</script>

<template>
  <span
    class="math-formula"
    :class="{ 'math-formula--display': display }"
    :aria-label="label"
  >
    <span v-if="rendered.html !== null" v-html="rendered.html" />
    <span v-else v-text="rendered.text" />
  </span>
</template>
