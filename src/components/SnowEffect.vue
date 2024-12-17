<script setup>
import { onMounted } from 'vue'
import { gsap } from 'gsap'

const createSnowflake = () => {
  const snowflake = document.createElement('div')
  snowflake.className = 'snowflake'
  snowflake.innerHTML = '❄'
  document.querySelector('.snow-container').appendChild(snowflake)

  const startX = Math.random() * window.innerWidth
  const endX = startX + (Math.random() * 100 - 50)

  gsap.fromTo(snowflake, 
    {
      x: startX,
      y: -20,
      opacity: 1,
      scale: Math.random() * 0.5 + 0.5
    },
    {
      x: endX,
      y: window.innerHeight + 20,
      opacity: 0.3,
      duration: Math.random() * 5 + 3,
      ease: "none",
      onComplete: () => {
        snowflake.remove()
      }
    }
  )
}

onMounted(() => {
  const interval = setInterval(createSnowflake, 200)
  return () => clearInterval(interval)
})
</script>

<template>
  <div class="snow-container fixed inset-0 pointer-events-none overflow-hidden">
  </div>
</template>

<style scoped>
.snowflake {
  position: absolute;
  color: white;
  text-shadow: 0 0 5px rgba(255,255,255,0.8);
  font-size: 20px;
  z-index: 1;
}
</style> 