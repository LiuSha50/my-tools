import { computed, reactive, ref } from 'vue'
import { inverseFunctionIds, trigFunctionIds } from '../catalog'
import type { MainFunctionId } from '../types'

const MAX_SELECTION_COUNT = 4

export function useTrigonometryWorkbench() {
  const trigSelection = ref<MainFunctionId[]>(['sin'])
  const inverseSelection = ref<MainFunctionId[]>(['arcsin'])
  const activeCategory = ref<'trig' | 'inverse'>('trig')
  const selectionError = ref('')
  const markerVisibility = reactive({
    keyPoints: true,
    zeros: true,
    extrema: true,
    asymptotes: true,
  })

  const selectedIds = computed(() => (
    activeCategory.value === 'trig' ? trigSelection.value : inverseSelection.value
  ))

  function toggleFunction(id: MainFunctionId) {
    const selection = activeCategory.value === 'trig' ? trigSelection : inverseSelection
    const allowedIds = activeCategory.value === 'trig' ? trigFunctionIds : inverseFunctionIds

    if (!allowedIds.includes(id as never)) return

    const selectedIndex = selection.value.indexOf(id)
    if (selectedIndex >= 0) {
      selection.value = selection.value.filter(selectedId => selectedId !== id)
      selectionError.value = ''
      return
    }

    if (selection.value.length >= MAX_SELECTION_COUNT) {
      selectionError.value = `最多比较 ${MAX_SELECTION_COUNT} 个函数`
      return
    }

    selection.value = [...selection.value, id]
    selectionError.value = ''
  }

  function restoreDefault() {
    if (activeCategory.value === 'trig') {
      trigSelection.value = ['sin']
    } else {
      inverseSelection.value = ['arcsin']
    }
    selectionError.value = ''
  }

  return {
    activeCategory,
    trigSelection,
    inverseSelection,
    selectedIds,
    toggleFunction,
    restoreDefault,
    markerVisibility,
    selectionError,
  }
}
