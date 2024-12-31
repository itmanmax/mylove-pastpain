<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import gsap from 'gsap'

const props = defineProps({
  name: {
    type: String,
    default: 'max'
  },
  loved: {
    type: String,
    default: 'max'
  },
  wish: {
    type: String,
    default: '新年快乐!'
  }
})

// 添加烟花相关的变量
const canvasRef = ref(null)
let ctx
const fireworks = []
const particles = []

// 在 script setup 顶部添加状态控制变量
const isSpecialFireworkActive = ref(false)  // 控制特殊烟花状态
const specialFireworkQueue = ref([])        // 特殊烟花队列

// 在 script setup 顶部添加音效相关变量
const isFireworkSoundEnabled = ref(false)
const isBackgroundMusicEnabled = ref(false)
const showSoundControl = ref(false)

// 在 script setup 顶部添加 goldColors 变量
const goldColors = [
  '255, 215, 0',  // 金色
  '255, 223, 0',  // 明亮金色
  '218, 165, 32', // 暗金色
  '255, 200, 0'   // 亮金色
]

// 修改背景音乐路径
const backgroundMusic = new Audio('/music/孙燕姿 - 我怀念的.mp3')
backgroundMusic.loop = true // 循环播放
backgroundMusic.volume = 0.5 // 设置音量为50%

// 修改音效相关变量
const explosionSounds = [
  new Audio('/sounds/A_single_explosive_firework_sound_effect..wav'),
  new Audio('/sounds/A_single_explosive_firework_sound_effect1.wav'),
  new Audio('/sounds/A_single_explosive_firework_sound_effect2.wav'),
  new Audio('/sounds/A_single_explosive_firework_sound_effect3.wav'),
  new Audio('/sounds/A_powerful_sound_effect_of_a_large_firework_exploding..wav'),
  new Audio('/sounds/Sound_effect_of_a_spectacular_fireworks_explosion..wav')
]

// 修改音效控制函数
const playExplosionSound = (volume = 0.3) => {
  if (!isFireworkSoundEnabled.value) return
  const sound = explosionSounds[Math.floor(Math.random() * explosionSounds.length)]
  sound.volume = volume
  sound.currentTime = 0
  sound.play().catch(error => {
    console.log('Audio play failed:', error)
  })
}

// 添加音效控制函数
const toggleFireworkSound = () => {
  isFireworkSoundEnabled.value = !isFireworkSoundEnabled.value
  if (isFireworkSoundEnabled.value) {
    isBackgroundMusicEnabled.value = false
    backgroundMusic.pause()
  }
}

const toggleBackgroundMusic = () => {
  isBackgroundMusicEnabled.value = !isBackgroundMusicEnabled.value
  if (isBackgroundMusicEnabled.value) {
    isFireworkSoundEnabled.value = false
    backgroundMusic.currentTime = 0 // 从头开始播放
    backgroundMusic.play().catch(error => {
      console.log('Background music play failed:', error)
    })
  } else {
    backgroundMusic.pause()
  }
}

// 添加显示控制按钮的函数
const toggleSoundControl = () => {
  showSoundControl.value = !showSoundControl.value
}

// 烟花粒子类
class Particle {
  constructor(x, y, color) {
    this.x = x
    this.y = y
    // 支持多色彩粒子
    this.color = Array.isArray(color) 
      ? color[Math.floor(Math.random() * color.length)]
      : color
    this.radius = Math.random() * 1.5 + 0.5  // 减小粒子大小
    
    const angle = Math.random() * Math.PI * 2
    this.speed = 2 + Math.random() * 2  // 减小初始速度，从4-8改为2-4
    
    this.velocity = {
      x: Math.cos(angle) * this.speed,
      y: Math.sin(angle) * this.speed
    }
    
    this.alpha = 1
    this.friction = 0.98
    this.gravity = 0.15  // 略微增加重力
    this.decay = 0.015
    this.life = 0
    this.maxLife = 1.5 + Math.random() * 0.5  // 减少生命周期
  }

  update() {
    this.life += 0.02

    if (this.life < 0.3) {
      // 初始阶段：向外扩散，但范围更小
      this.x += this.velocity.x * 0.8  // 减小扩散速度
      this.y += this.velocity.y * 0.8
      this.velocity.x *= 0.98  // 更快的速度衰减
      this.velocity.y *= 0.98
    } else {
      // 后期：受重力影响下落
      this.velocity.y += this.gravity * 0.15
      this.x += this.velocity.x * this.friction
      this.y += this.velocity.y * this.friction
    }

    // 根据生命周期调整透明度
    if (this.life < 0.3) {
      this.alpha = 1
    } else {
      this.alpha = Math.max(0, 1 - (this.life / this.maxLife))
    }
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
    ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`
    ctx.fill()
  }
}

// 烟花类
class Firework {
  constructor(isGiant = false) {
    const colors = [
      '255, 0, 0',    // 红色
      '0, 255, 0',    // 绿色
      '0, 0, 255',    // 蓝色
      '255, 255, 0',  // 黄色
      '255, 192, 203', // 粉色
      '255, 165, 0',  // 橙色
      '238, 130, 238', // 紫色
      '0, 255, 255',  // 青色
      // 添加多色彩烟花
      ['255, 0, 0', '255, 255, 0', '0, 255, 0'], // 红黄绿
      ['0, 191, 255', '138, 43, 226', '255, 0, 255'], // 蓝紫粉
      ['255, 69, 0', '255, 215, 0', '255, 140, 0']  // 红橙黄
    ]
    
    this.x = Math.random() * window.innerWidth
    this.y = window.innerHeight
    
    // 根据概率选择颜色
    const rand = Math.random()
    if (rand < 0.2) { // 20%概率是金色系列
      this.color = goldColors
    } else {
      this.color = colors[Math.floor(Math.random() * colors.length)]
    }

    this.targetHeight = window.innerHeight * (0.1 + Math.random() * 0.2)
    this.isGiant = isGiant // 是否是巨大烟花
    
    // 根据是否是巨大烟花调整速度
    this.velocity = {
      x: Math.random() * 0.8 - 0.4,
      y: -(Math.random() * 2 + (isGiant ? 3 : 4)) // 巨大烟花上升速度稍慢
    }
    
    this.gravity = 0.0008
    this.friction = 0.999
    this.shouldExplode = false
    
    // 添加连环烟花属性
    this.shouldSpawnChain = Math.random() < 0.2 // 20%概率产生连环烟花
    this.chainCount = this.shouldSpawnChain ? Math.floor(Math.random() * 3) + 2 : 0 // 2-4个连环
    this.chainDelay = 100 // 连环延迟时间(ms)
    this.chainTimer = 0

    this.isGrouped = false // 添加同色组标记
    this.isSpecial = isGiant || this.shouldSpawnChain || this.isGrouped // 更新特殊标记条件
  }

  update() {
    // 应用重力和摩擦力
    this.velocity.y += this.gravity
    this.velocity.x *= this.friction
    this.velocity.y *= this.friction
    
    // 更新位置
    this.x += this.velocity.x
    this.y += this.velocity.y

    // 检查是否到达目标高度
    if (this.y <= this.targetHeight) {
      this.shouldExplode = true
    }
  }

  draw() {
    ctx.beginPath()
    ctx.arc(this.x, this.y, 1, 0, Math.PI * 2, false)  // 减小上升光点的大小
    ctx.fillStyle = `rgba(${this.color}, 1)`
    ctx.fill()
  }

  explode() {
    // 根据烟花类型设置不同的音量
    const volume = this.isGiant ? 0.4 : (this.isGrouped ? 0.25 : 0.3)
    playExplosionSound(volume)
    
    // 根据是否是巨大烟花调整粒子数量
    const baseCount = this.isGiant ? 150 : 50
    const randomCount = this.isGiant ? 50 : 30
    const particleCount = baseCount + Math.floor(Math.random() * randomCount)
    
    // 调整粒子初始速度和大小
    const speedMultiplier = this.isGiant ? 1.5 : 1
    const sizeMultiplier = this.isGiant ? 1.5 : 1
    
    for (let i = 0; i < particleCount; i++) {
      const particle = new Particle(this.x, this.y, this.color)
      // 调整巨大烟花的粒子参数
      if (this.isGiant) {
        particle.radius *= sizeMultiplier
        particle.speed *= speedMultiplier
        particle.velocity.x *= speedMultiplier
        particle.velocity.y *= speedMultiplier
      }
      particles.push(particle)
    }

    // 如果是同色组的烟花，不触发连环效果
    if (this.shouldSpawnChain && this.chainCount > 0 && !this.isGrouped) {
      this.spawnChainFirework()
    }
  }

  // 添加连环烟花方法
  spawnChainFirework() {
    const spawnChain = async () => {
      if (this.chainCount <= 0) return
      
      const chainFirework = new Firework(this.isGiant)
      chainFirework.x = this.x + (Math.random() * 100 - 50)
      chainFirework.y = this.y + (Math.random() * 100 - 50)
      chainFirework.targetHeight = this.y - 100 - Math.random() * 100
      chainFirework.shouldExplode = true
      chainFirework.chainCount = 0
      
      // 等待前一个连环烟花完全消失
      while (particles.length > 0) {
        await new Promise(r => setTimeout(r, 50))
      }
      
      fireworks.push(chainFirework)
      this.chainCount--
      
      if (this.chainCount > 0) {
        setTimeout(() => spawnChain(), this.chainDelay)
      } else {
        // 最后一个连环烟花结束后，重置特殊状态
        setTimeout(() => {
          isSpecialFireworkActive.value = false
        }, 1000)
      }
    }
    
    spawnChain()
  }
}

// 初始化画布
const initCanvas = () => {
  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
}

// 动画循环
const animate = () => {
  requestAnimationFrame(animate)
  ctx.fillStyle = 'rgba(0, 0, 34, 0.15)'
  ctx.fillRect(0, 0, canvasRef.value.width, canvasRef.value.height)

  // 更新和绘制烟花
  for (let i = fireworks.length - 1; i >= 0; i--) {
    fireworks[i].draw()
    fireworks[i].update()

    if (fireworks[i].shouldExplode) {
      fireworks[i].explode()
      fireworks.splice(i, 1)
    }
  }

  // 更新和绘制粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].draw()
    particles[i].update()

    if (particles[i].alpha <= 0 || 
        particles[i].y > canvasRef.value.height || 
        particles[i].x < 0 || 
        particles[i].x > canvasRef.value.width) {
      particles.splice(i, 1)
    }
  }

  // 只在没有特殊烟花时生成随机烟花
  if (!isSpecialFireworkActive.value) {
    if (Math.random() < 0.04) {
      const rand = Math.random()
      if (rand < 0.2) { // 20% 概率生成同色连环烟花
        // 生成2-4个同色烟花
        const count = Math.floor(Math.random() * 3) + 2
        const positions = []
        
        // 预先计算所有位置
        for (let i = 0; i < count; i++) {
          const segment = window.innerWidth / (count + 1)
          positions.push(segment * (i + 1) + (Math.random() * 60 - 30))
        }
        
        // 创建同色烟花组
        const color = goldColors[Math.floor(Math.random() * goldColors.length)]
        const groupFireworks = positions.map(x => {
          const fw = new Firework(false)
          fw.x = x
          fw.color = color
          fw.isGrouped = true // 标记为同色组烟花
          return fw
        })
        
        // 统一发射同色烟花
        handleGroupFireworks(groupFireworks)
      } else if (rand < 0.25) { // 5% 概率生成巨大烟花
        const giantFirework = new Firework(true)
        handleSpecialFirework(giantFirework)
      } else { // 75% 概率生成普通烟花
        // 随机生成1-3个普通烟花，依次延迟发射
        const count = Math.floor(Math.random() * 3) + 1
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            const newFirework = new Firework(false)
            // 为多个烟花设置不同的水平位置
            if (count > 1) {
              const segment = window.innerWidth / (count + 1)
              newFirework.x = segment * (i + 1) + (Math.random() * 100 - 50)
            }
            fireworks.push(newFirework)
          }, i * (Math.random() * 300 + 200)) // 200-500ms的随机延迟
        }
      }
    }
  }
}

// 处理窗口大小变化
const handleResize = () => {
  if (canvasRef.value) {
    canvasRef.value.width = window.innerWidth
    canvasRef.value.height = window.innerHeight
  }
}

// 添加特殊烟花控制函数
const handleSpecialFirework = (firework) => {
  return new Promise(async (resolve) => {
    isSpecialFireworkActive.value = true
    
    // 等待现有烟花消失
    while (fireworks.length > 0 || particles.length > 0) {
      await new Promise(r => setTimeout(r, 100))
    }
    
    // 发射特殊烟花
    fireworks.push(firework)
    
    // 等待特殊烟花及其粒子消失
    while (fireworks.length > 0 || particles.length > 0) {
      await new Promise(r => setTimeout(r, 100))
    }
    
    // 延迟一小段时间后恢复正常烟花
    setTimeout(() => {
      isSpecialFireworkActive.value = false
      resolve()
    }, 500)
  })
}

// 添加处理同色烟花组的函数
const handleGroupFireworks = (groupFireworks) => {
  return new Promise(async (resolve) => {
    isSpecialFireworkActive.value = true
    
    // 等待现有烟花消失
    while (fireworks.length > 0 || particles.length > 0) {
      await new Promise(r => setTimeout(r, 100))
    }
    
    // 同时发射所有同色烟花
    fireworks.push(...groupFireworks)
    
    // 监听烟花爆炸时机
    const checkExplosion = setInterval(() => {
      if (fireworks.some(fw => fw.shouldExplode)) {
        // 同步播放多个爆炸音效
        groupFireworks.forEach((_, index) => {
          setTimeout(() => {
            playExplosionSound(0.2)  // 降低音量避免太吵
          }, index * 50)  // 添加少许延迟，使声音更自然
        })
        clearInterval(checkExplosion)
      }
    }, 50)
    
    // 等待同色烟花及其粒子消失
    while (fireworks.length > 0 || particles.length > 0) {
      await new Promise(r => setTimeout(r, 100))
    }
    
    // 延迟后恢复正常烟花
    setTimeout(() => {
      isSpecialFireworkActive.value = false
      resolve()
    }, 500)
  })
}

// 修改点击事件处理函数
const handleCanvasClick = async (event) => {
  if (isSpecialFireworkActive.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  
  const rand = Math.random()
  if (rand < 0.2) { // 20% 概率生成同色连环烟花
    const count = Math.floor(Math.random() * 3) + 2
    const positions = []
    const baseX = x
    
    // 在点击位置周围生成同色烟花
    for (let i = 0; i < count; i++) {
      positions.push(baseX + (Math.random() * 200 - 100))
    }
    
    const color = goldColors[Math.floor(Math.random() * goldColors.length)]
    const groupFireworks = positions.map(xPos => {
      const fw = new Firework(false)
      fw.x = xPos
      fw.color = color
      fw.isGrouped = true
      fw.targetHeight = Math.max(y - 100, window.innerHeight * 0.1)
      return fw
    })
    
    await handleGroupFireworks(groupFireworks)
  } else if (rand < 0.25) { // 5% 概率生成巨大烟花
    const giantFirework = new Firework(true)
    giantFirework.x = x
    giantFirework.targetHeight = Math.max(y - 100, window.innerHeight * 0.1)
    await handleSpecialFirework(giantFirework)
  } else { // 75% 概率生成普通烟花
    const clickFirework = new Firework(false)
    clickFirework.x = x
    clickFirework.targetHeight = Math.max(y - 100, window.innerHeight * 0.1)
    fireworks.push(clickFirework)
  }
}

onMounted(() => {
  // 预加载音频文件
  explosionSounds.forEach(sound => {
    sound.load()
    sound.preload = 'auto'
  })
  
  initCanvas()
  animate()
  window.addEventListener('resize', handleResize)
  
  // 添加点击事件监听
  canvasRef.value.addEventListener('click', handleCanvasClick)
  
  // 初始化倒计时
  updateCountdown()
  const timer = setInterval(updateCountdown, 1000)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    canvasRef.value.removeEventListener('click', handleCanvasClick)
    clearInterval(timer)
  })
})

// 时间状态
const days = ref('00')
const hours = ref('00')
const minutes = ref('00')
const seconds = ref('00')

// 添加前一个数字的状态
const prevDays = ref('00')
const prevHours = ref('00')
const prevMinutes = ref('00')
const prevSeconds = ref('00')

// 添加翻转状态
const flipping = ref({
  days: false,
  hours: false,
  minutes: false,
  seconds: false
})

// 获取到新年的时间差
const getTimeUntilNewYear = () => {
  const now = new Date()
  const newYear = new Date(now.getFullYear() + 1, 0, 1)
  const diff = newYear - now
  
  // 确保天数正确计算，不会频繁变化
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  
  return {
    days: String(days).padStart(2, '0'),
    hours: String(hours).padStart(2, '0'),
    minutes: String(minutes).padStart(2, '0'),
    seconds: String(seconds).padStart(2, '0')
  }
}

const updateCountdown = () => {
  const time = getTimeUntilNewYear()
  
  // 检查天数变化
  if (days.value !== time.days) {
    const oldNumber = days.value
    days.value = time.days
    updateNumberWithFlip('days', oldNumber, time.days)
  }
  
  // 检查小时变化
  if (hours.value !== time.hours) {
    const oldNumber = hours.value
    hours.value = time.hours
    updateNumberWithFlip('hours', oldNumber, time.hours)
  }
  
  // 检查分钟变化
  if (minutes.value !== time.minutes) {
    const oldNumber = minutes.value
    minutes.value = time.minutes
    updateNumberWithFlip('minutes', oldNumber, time.minutes)
  }
  
  // 检查秒数变化
  if (seconds.value !== time.seconds) {
    const oldNumber = seconds.value
    seconds.value = time.seconds
    updateNumberWithFlip('seconds', oldNumber, time.seconds)
  }
}

// 处理数字翻转的函数
const updateNumberWithFlip = (type, oldNumber, newNumber) => {
  // 获取对应的元素
  const group = document.querySelector(`.number-group.${type}`)
  if (!group) return
  
  const topNumber = group.querySelector('.number-container.top .number')
  const bottomNumber = group.querySelector('.number-container.bottom .number')
  const topFlipNumber = group.querySelector('.number-container.top-flip .number')
  
  // 设置初始状态
  if (topNumber) topNumber.textContent = oldNumber
  if (bottomNumber) bottomNumber.textContent = oldNumber
  if (topFlipNumber) topFlipNumber.textContent = newNumber
  
  // 开始翻转动画
  requestAnimationFrame(() => {
    group.classList.add('flipping')
    
    // 当上半部分翻转到一半时，更新下半部分
    setTimeout(() => {
      if (bottomNumber) {
        bottomNumber.textContent = newNumber
      }
    }, 150)
    
    // 翻转结束后
    setTimeout(() => {
      group.classList.remove('flipping')
      if (topNumber) {
        topNumber.textContent = newNumber
      }
    }, 300)
  })
}

// 监听 flipping 状态并触发动画
watch(flipping, (newVal, oldVal) => {
  Object.keys(newVal).forEach(key => {
    if (newVal[key]) {
      const numberGroup = document.querySelector(`.number-group.${key}`)
      if (numberGroup) {
        gsap.to(numberGroup, {
          duration: 0.5,
          rotationX: -90,
          onComplete: () => {
            gsap.to(numberGroup, {
              duration: 0.5,
              rotationX: 0,
              onComplete: () => {
                flipping.value[key] = false
              }
            })
          }
        })
      }
    }
  })
})
</script>

<template>
  <div class="new-year-scene">
    <canvas ref="canvasRef" class="fireworks-canvas"></canvas>
    
    <!-- 添加元旦快乐按钮和音效控制 -->
    <div class="sound-control-wrapper">
      <button class="happy-new-year-btn" @click="toggleSoundControl">
        元旦快乐
      </button>
      
      <!-- 音效控制面板 -->
      <transition name="fade">
        <div v-if="showSoundControl" class="sound-control-panel">
          <button 
            class="sound-btn" 
            :class="{ active: isFireworkSoundEnabled }"
            @click="toggleFireworkSound"
          >
            烟花音效
          </button>
          <button 
            class="sound-btn" 
            :class="{ active: isBackgroundMusicEnabled }"
            @click="toggleBackgroundMusic"
          >
            背景音乐
          </button>
        </div>
      </transition>
    </div>

    <!-- 原有的倒计时容器 -->
    <div class="countdown-container">
      <div class="countdown-display">
        <!-- 天数 -->
        <div class="number-group days">
          <div class="number-container top">
            <div class="number">{{ days }}</div>
          </div>
          <div class="number-container bottom">
            <div class="number">{{ days }}</div>
          </div>
          <div class="number-container top-flip">
            <div class="number">{{ days }}</div>
          </div>
        </div>

        <!-- 小时 -->
        <div class="number-group hours">
          <div class="number-container top">
            <div class="number">{{ hours }}</div>
          </div>
          <div class="number-container bottom">
            <div class="number">{{ hours }}</div>
          </div>
          <div class="number-container top-flip">
            <div class="number">{{ hours }}</div>
          </div>
        </div>

        <!-- 分钟 -->
        <div class="number-group minutes">
          <div class="number-container top">
            <div class="number">{{ minutes }}</div>
          </div>
          <div class="number-container bottom">
            <div class="number">{{ minutes }}</div>
          </div>
          <div class="number-container top-flip">
            <div class="number">{{ minutes }}</div>
          </div>
        </div>

        <!-- 秒数 -->
        <div class="number-group seconds">
          <div class="number-container top">
            <div class="number">{{ seconds }}</div>
          </div>
          <div class="number-container bottom">
            <div class="number">{{ seconds }}</div>
          </div>
          <div class="number-container top-flip">
            <div class="number">{{ seconds }}</div>
          </div>
        </div>
      </div>

      <!-- 标签行 -->
      <div class="labels-row">
        <span class="label">天</span>
        <span class="label">时</span>
        <span class="label">分</span>
        <span class="label">秒</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.new-year-scene {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(180deg, #000022 0%, #000044 100%);
}

.countdown-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.375);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  border-radius: 20px;
  z-index: 10;
  width: fit-content;
  transform-origin: center center;
}

.countdown-display {
  display: flex;
  justify-content: center;
  gap: 0;
  margin-bottom: 10px;
  width: 100%;
}

.number-group {
  position: relative;
  width: 200px;
  height: 180px;
  background: #242849;
  border-radius: 8px;
  perspective: 1000px;
  display: inline-block;
  margin: 0 30px;
}

/* 数字容器基础样式 */
.number-container {
  position: absolute;
  width: 100%;
  height: 90px;
  background: #242849;
  overflow: hidden;
  backface-visibility: hidden; /* 隐藏背面 */
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 实际的数字样式 */
.number {
  width: 100%;
  height: 180px;
  color: white;
  font-size: 140px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #242849;
  letter-spacing: -2px;
}

/* 上半部分容器 */
.number-container.top {
  top: 0;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background: linear-gradient(180deg, #242849 0%, #1a1f3d 100%);
  transform-origin: bottom;
  transition: transform 0.3s ease-in;
}

/* 上半部分的数字定位 */
.number-container.top .number {
  position: absolute;
  top: 0; /* 数字顶部对齐容器顶部 */
}

/* 下半部分容器 */
.number-container.bottom {
  bottom: 0;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  background: linear-gradient(180deg, #1a1f3d 0%, #151933 100%);
  transition: opacity 0.15s ease-in;
}

/* 下半部分的数字定位 */
.number-container.bottom .number {
  position: absolute;
  bottom: 0; /* 数字底部对齐容器底部 */
}

/* 分割线 */
.number-group::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 2px; /* 稍微加粗分割线 */
  background: rgba(0, 0, 0, 0.3);
  z-index: 2;
}

.label {
  position: absolute;
  width: 200px;
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 2rem;
  font-weight: 500;
  transform: translateX(-50%);
}

.label:nth-child(1) {
  left: 130px;
}

.label:nth-child(2) {
  left: 390px;
}

.label:nth-child(3) {
  left: 650px;
}

.label:nth-child(4) {
  left: 910px;
}

.labels-row .label {
  text-align: center;
}

/* 添加分隔符 */
.number-group:not(:last-child)::after {
  content: ':';
  position: absolute;
  right: -35px;
  top: 50%;
  transform: translateY(-50%);
  color: #242849;
  font-size: 5rem;
  font-weight: bold;
}

.number-part {
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 80px;
}

.number-part.bottom {
  transform-origin: 50% 0;
}

/* 容器样式 */
.countdown-container {
  background: rgba(255, 255, 255, 0.05);
  padding: 40px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.countdown-display {
  display: flex;
  justify-content: center;
  gap: 20px;
}

/* 调整数字显示效果 */
.number-part {
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* 上半部分翻转容器 */
.number-container.top-flip {
  position: absolute;
  top: 0;
  height: 90px; /* 与基础容器高度一致 */
  background: linear-gradient(180deg, #242849 0%, #1a1f3d 100%);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  transform-origin: bottom;
  transform: rotateX(90deg);
  backface-visibility: hidden;
  transition: transform 0.3s ease-out;
}

/* 下半部分翻转容器 */
.number-container.bottom-flip {
  position: absolute;
  bottom: 0;
  height: 70px;
  background: linear-gradient(180deg, #1a1f3d 0%, #151933 100%);
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;
  transform-origin: top;
  transform: rotateX(90deg);
}

/* 翻转动画 */
.number-group.flipping .top {
  transform: rotateX(-90deg);
}

.number-group.flipping .top-flip {
  transform: rotateX(0deg);
}

.number-group.flipping .bottom-flip {
  transform: rotateX(0);
}

/* 添加阴影效果增强立体感 */
.number-container {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.number-container.top,
.number-container.top-flip {
  border-bottom: 1px solid rgba(0, 0, 0, 0.3);
}

.number-container.bottom,
.number-container.bottom-flip {
  border-top: 1px solid rgba(0, 0, 0, 0.3);
}

/* 下半部分的淡入淡出效果 */
.number-group.flipping .bottom {
  opacity: 0.3; /* 不要完全隐藏，保持一点可见度 */
  transition: opacity 0.15s ease-in;
}

.number-group:not(.flipping) .bottom {
  opacity: 1;
  transition: opacity 0.15s ease-out;
}

/* 确保翻转时数字保持居中 */
.number-container.top-flip .number,
.number-container.bottom-flip .number {
  width: 100%;
  text-align: center;
}

/* 调整标签行容器 */
.labels-row {
  position: relative;
  width: 100%;
  margin-top: 20px;
}

/* 添加画布样式 */
.fireworks-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* 确保倒计时显示在烟花上方 */
.countdown-container {
  z-index: 2;
  position: relative;
}

/* 添加音效控制相关样式 */
.sound-control-wrapper {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.happy-new-year-btn {
  background: linear-gradient(45deg, #ff0000, #ff6b6b);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 30px;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.happy-new-year-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 0, 0, 0.4);
}

.sound-control-panel {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 15px;
  border-radius: 15px;
  display: flex;
  gap: 10px;
}

.sound-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sound-btn.active {
  background: #ff4444;
  box-shadow: 0 0 10px rgba(255, 68, 68, 0.5);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 