<template>
  <div id="app" :class="{ 'app-wide': route.meta.layout === 'wide' }">
    <router-view />
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<style>
#app {
  max-width: 960px;
  margin: 0 auto;
  padding: calc(var(--spacing-unit) * 4) calc(var(--spacing-unit) * 2);
}

.app-wide {
  max-width: 1280px;
}
</style>
