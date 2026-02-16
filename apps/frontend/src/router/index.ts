import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('../pages/DashboardPage.vue')
    },
    {
      path: '/packages',
      name: 'packages',
      component: () => import('../pages/PackageMapPage.vue')
    },
    {
      path: '/call-graph',
      name: 'call-graph',
      component: () => import('../pages/CallGraphPage.vue')
    }
  ]
})
