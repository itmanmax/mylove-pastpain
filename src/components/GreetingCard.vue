<script setup>
import { ref, onMounted, computed } from 'vue'
import { gsap } from 'gsap'
import SnowEffect from './SnowEffect.vue'
import FireworksEffect from './FireworksEffect.vue'
import ChristmasTreeEffect from './ChristmasTreeEffect.vue'

const props = defineProps({
  festival: {
    type: String,
    required: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  }
})

const cardRef = ref(null)

onMounted(() => {
  gsap.from(cardRef.value, {
    duration: 1,
    y: 100,
    opacity: 0,
    ease: "bounce"
  })
})

const backgroundClass = computed(() => {
  switch(props.festival) {
    case 'christmas':
      return 'bg-red-100/80'
    case 'newYear':
      return 'bg-yellow-100/80'
    case 'springFestival':
      return 'bg-red-200/80'
    default:
      return 'bg-white/80'
  }
})

const festivalTitle = computed(() => {
  switch(props.festival) {
    case 'christmas':
      return '圣诞快乐'
    case 'newYear':
      return '新年快乐'
    case 'springFestival':
      return '春节快乐'
    default:
      return '节日快乐'
  }
})
</script>

<template>
  <div class="relative">
    <!-- 背景特效 -->
    <SnowEffect v-if="festival === 'christmas'" />
    <FireworksEffect v-if="festival === 'springFestival' || festival === 'newYear'" />
    
    <!-- 卡片内容 -->
    <div 
      ref="cardRef"
      :class="['p-8 rounded-lg shadow-lg max-w-md mx-auto animate__animated animate__fadeIn backdrop-blur-sm', backgroundClass]"
    >
      <div class="text-center mb-6">
        <ChristmasTreeEffect v-if="festival === 'christmas'" />
        <div v-else class="text-6xl animate__animated animate__bounce">
          {{ festival === 'springFestival' ? '🧧' : '🎉' }}
        </div>
      </div>
      
      <h2 class="text-3xl font-bold mb-4 text-center">{{ festivalTitle }}</h2>
      <p class="text-lg mb-6 text-gray-700">{{ message }}</p>
      
      <div class="text-right">
        <p class="text-sm text-gray-600">致: {{ to }}</p>
        <p class="text-sm text-gray-600">来自: {{ from }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}
</style> 