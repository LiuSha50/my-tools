<template>
  <router-link :to="`/tool/${tool.id}`" class="tool-card">
    <div class="tool-card-icon">{{ tool.icon }}</div>
    <div class="tool-card-body">
      <h3 class="tool-card-name">{{ tool.name }}</h3>
      <p class="tool-card-desc">{{ tool.description }}</p>
    </div>
  </router-link>
</template>

<script setup>
defineProps({
  tool: {
    type: Object,
    required: true
  }
})
</script>

<style scoped>
.tool-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(var(--spacing-unit) * 3) calc(var(--spacing-unit) * 2);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
}

.tool-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.tool-card-icon {
  font-size: 28px;
  margin-bottom: var(--spacing-unit);
}

.tool-card-body {
  text-align: center;
}

.tool-card-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.tool-card-desc {
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>