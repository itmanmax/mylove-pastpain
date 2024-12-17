<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import QRCode from 'qrcode'

const router = useRouter()
const name = ref('')
const loved = ref('')
const showShare = ref(false)
const qrCodeUrl = ref('')
const shareUrl = ref('')

const generateQRCode = async (url) => {
  try {
    const qrCode = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    qrCodeUrl.value = qrCode
  } catch (err) {
    console.error('Failed to generate QR code:', err)
  }
}

const goToChristmas = async () => {
  if (!name.value || !loved.value) {
    alert('请输入名字')
    return
  }
  
  // 使用固定域名生成完整的URL
  const baseUrl = 'http://mylove.maxtral.fun'  // 修改为固定域名
  const fullUrl = `${baseUrl}/Christmas?name=${encodeURIComponent(name.value)}&loved=${encodeURIComponent(loved.value)}`
  shareUrl.value = fullUrl
  
  // 生成二维码
  await generateQRCode(fullUrl)
  showShare.value = true
}

const visitUrl = () => {
  // 本地导航仍然使用相对路径
  router.push(`/Christmas?name=${name.value}&loved=${loved.value}`)
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    alert('链接已复制到剪贴板')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
    <div class="container mx-auto px-4 flex gap-8 items-center max-w-6xl">
      <!-- 左侧内容 -->
      <div class="flex-1 space-y-6">
        <div class="relative overflow-hidden rounded-lg shadow-xl">
          <img 
            src="/back.jpg" 
            alt="Background" 
            class="w-full h-[400px] object-cover"
          >
          <div class="absolute inset-0 bg-black/40 flex items-end p-6">
            <p class="text-white text-lg font-medium leading-relaxed">
              曾经我有能力给她也做一个，但是因为个人愚昧，未能给她做，挺后悔一些事情的，希望你们不留遗憾。
            </p>
          </div>
        </div>
      </div>

      <!-- 右侧表单 -->
      <div class="flex-1">
        <div class="bg-white/10 backdrop-blur-md p-8 rounded-lg shadow-xl max-w-md ml-auto">
          <h1 class="text-4xl font-bold text-center text-white mb-8">圣诞快乐</h1>
          
          <div v-if="!showShare" class="space-y-4">
            <div>
              <label class="block text-white mb-2">你的名字</label>
              <input 
                v-model="name"
                type="text"
                class="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white"
                placeholder="请输入你的名字"
              >
            </div>

            <div>
              <label class="block text-white mb-2">TA的名字</label>
              <input 
                v-model="loved"
                type="text"
                class="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white"
                placeholder="请输入TA的名字"
              >
            </div>

            <button 
              @click="goToChristmas"
              class="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors mt-6"
            >
              生成祝福
            </button>

            <!-- 添加注释说明 -->
            <div class="mt-8 space-y-2 text-white/60 text-sm">
              <p class="flex items-center">
                <span class="text-yellow-500 mr-2">✨</span>
                即将更新：春节、元旦等节日祝福
              </p>
              <p class="flex items-center">
                <span class="text-blue-500 mr-2">🔄</span>
                持续优化：更多动画效果和互动内容
              </p>
              <a 
                href="https://maxtral.fun" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="flex items-center hover:text-white cursor-pointer transition-colors"
              >
                <span class="text-green-500 mr-2">💝</span>
                欢迎反馈：帮助我们做得更好
              </a>
              <p class="text-xs text-white/40 mt-4 text-center">
                Version 1.0 - Made with ❤️ by max
              </p>
            </div>
          </div>

          <!-- 分享界面 -->
          <div v-else class="space-y-6">
            <div class="flex justify-center">
              <img 
                :src="qrCodeUrl" 
                alt="QR Code"
                class="w-48 h-48 bg-white p-2 rounded-lg"
              >
            </div>
            
            <div class="text-center space-y-4">
              <p class="text-white text-sm">扫描二维码或分享链接</p>
              
              <div class="flex space-x-2">
                <button 
                  @click="copyUrl"
                  class="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  复制链接
                </button>
                <button 
                  @click="visitUrl"
                  class="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600 transition-colors"
                >
                  立即访问
                </button>
              </div>
              
              <button 
                @click="showShare = false"
                class="text-white/60 hover:text-white text-sm"
              >
                返回修改
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.container {
  min-height: 100vh;
}

.shadow-xl {
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2),
              0 10px 10px -5px rgba(0, 0, 0, 0.1);
}

.text-white\/60:hover {
  opacity: 0.8;
  transition: opacity 0.3s ease;
}
</style> 