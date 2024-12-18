import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import ChristmasTreeEffect from '../components/ChristmasTreeEffect.vue'

const router = createRouter({
  history: createWebHistory('/'),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: HomePage
    },
    {
      path: '/Christmas',
      name: 'Christmas',
      component: ChristmasTreeEffect,
      props: route => ({
        name: route.query.name || 'max',
        loved: route.query.loved || 'max'
      })
    }
  ]
})

export default router 