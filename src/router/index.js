import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../components/HomePage.vue'
import ChristmasTreeEffect from '../components/ChristmasTreeEffect.vue'
import NewYearEffect from '../components/NewYearEffect.vue'

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
    },
    {
      path: '/NewYear',
      name: 'NewYear',
      component: NewYearEffect,
      props: route => ({
        name: route.query.name || 'max',
        loved: route.query.loved || 'max',
        wish: route.query.wish || '新年快乐!'
      })
    }
  ]
})

export default router 