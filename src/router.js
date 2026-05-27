import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import ToolView from './views/ToolView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/tool/:id', name: 'tool', component: ToolView }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})