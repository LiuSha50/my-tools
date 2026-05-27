import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ToolView from './views/ToolView.vue'
import TimestampView from './views/TimestampView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/tool/timestamp', name: 'timestamp', component: TimestampView },
  { path: '/tool/:id', name: 'tool', component: ToolView },
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})