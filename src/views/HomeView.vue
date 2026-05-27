<template>
  <div class="home">
    <header class="home-header">
      <h1 class="home-title">DevTools</h1>
      <p class="home-subtitle">开发者常用工具集</p>
    </header>

    <section v-if="favTools.length" class="tool-section">
      <h2 class="section-title">★ 常用</h2>
      <div class="tool-grid">
        <ToolCard
          v-for="tool in favTools"
          :key="tool.id"
          :tool="tool"
        />
      </div>
    </section>

    <section v-for="category in categoryOrder" :key="category" class="tool-section">
      <h2 class="section-title">{{ categoryNames[category] }}</h2>
      <div class="tool-grid">
        <ToolCard
          v-for="tool in toolsByCategory[category]"
          :key="tool.id"
          :tool="tool"
        />
      </div>
    </section>

    <div v-if="tools.length === 0" class="empty-state">
      <p>暂无工具，请先添加工具。</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ToolCard from '../components/ToolCard.vue'
import { tools, toolsByCategory, categoryNames, categoryOrder, getToolById } from '../tools/index.js'
import { useFavorites } from '../composables/useFavorites.js'

const { favorites } = useFavorites()

const favTools = computed(() =>
  favorites.value.map(id => getToolById(id)).filter(Boolean)
)
</script>

<style scoped>
.home-header {
  text-align: center;
  margin-bottom: calc(var(--spacing-unit) * 5);
}

.home-title {
  font-size: 28px;
  font-weight: 300;
  letter-spacing: 3px;
  color: var(--color-text);
}

.home-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-unit);
}

.tool-section {
  margin-bottom: calc(var(--spacing-unit) * 4);
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  letter-spacing: 1px;
  margin-bottom: calc(var(--spacing-unit) * 1.5);
  padding-bottom: var(--spacing-unit);
  border-bottom: 1px solid var(--color-border);
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: calc(var(--spacing-unit) * 1.5);
}

.empty-state {
  text-align: center;
  padding: calc(var(--spacing-unit) * 8);
  color: var(--color-text-secondary);
}
</style>