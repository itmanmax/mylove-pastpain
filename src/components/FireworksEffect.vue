<script setup>
import { onMounted } from 'vue'
import { gsap } from 'gsap'

const createFirework = () => {
  const container = document.querySelector('.fireworks-container')
  const firework = document.createElement('div')
  firework.className = 'firework'
  container.appendChild(firework)

  const x = Math.random() * window.innerWidth
  const y = Math.random() * (window.innerHeight * 0.7)
  
  // 创建爆炸粒子
  const particles = []
  for (let i = 0; i < 12; i++) {
    const particle = document.createElement('div')
    particle.className = 'particle'
    firework.appendChild(particle)
    particles.push(particle)
  }

  // 烟花上升动画
  gsap.fromTo(firework,
    { x, y: window.innerHeight, scale: 0.5, opacity: 1 },
    {
      y,
      duration: 1,
      ease: "power1.out",
      onComplete: () => {
        // 爆炸动画
        particles.forEach((particle, i) => {
          const angle = (i / particles.length) * Math.PI * 2
          gsap.to(particle, {
            x: Math.cos(angle) * 50,
            y: Math.sin(angle) * 50,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out"
          })
        })
        
        gsap.to(firework, {
          opacity: 0,
          duration: 0.8,
          onComplete: () => firework.remove()
        })
      }
    }
  )
}

onMounted(() => {
  const interval = setInterval(createFirework, 1000)
  return () => clearInterval(interval)
})
</script>

<template>
  <div class="fireworks-container fixed inset-0 pointer-events-none overflow-hidden">
  </div>
</template>

<style scoped>
.firework {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #ff0;
  border-radius: 50%;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: red;
  border-radius: 50%;
  transform-origin: center;
}
</style> 