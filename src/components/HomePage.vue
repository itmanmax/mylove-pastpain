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
const selectedFestival = ref(null)
const newYearWish = ref('')
const countdownType = ref('1') // 默认元旦倒计时
const customDateTime = ref('') // 存储自定义日期时间

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
  const baseUrl = 'https://mylove2.maxtral.fun'  // 修改为固定域名
  const fullUrl = `${baseUrl}/Christmas?name=${encodeURIComponent(name.value)}&loved=${encodeURIComponent(loved.value)}`
  shareUrl.value = fullUrl
  
  // 生成二维码
  await generateQRCode(fullUrl)
  
  showShare.value = true
}

const visitUrl = () => {
  if (selectedFestival.value === 'christmas') {
    router.push(`/Christmas?name=${name.value}&loved=${loved.value}`)
  }
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    alert('链接已复制到剪贴板')
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

const selectFestival = (festival) => {
  selectedFestival.value = festival
  // 重置表单
  name.value = ''
  loved.value = ''
  newYearWish.value = ''
  showShare.value = false
}

const goToNewYear = () => {
  if (!loved.value || !newYearWish.value) {
    alert('请填写必要信息')
    return
  }
  
  // 验证自定义时间
  if (countdownType.value === '3') {
    if (!customDateTime.value) {
      alert('请选择目标日期时间')
      return
    }
    
    const targetTime = new Date(customDateTime.value).getTime()
    const now = new Date().getTime()
    
    if (targetTime <= now) {
      alert('目标时间必须大于当前时间')
      return
    }
  }
  
  // 构建路由参数
  const params = new URLSearchParams()
  if (name.value) {
    params.append('name', encodeURIComponent(name.value))
  }
  params.append('loved', encodeURIComponent(loved.value))
  params.append('wish', encodeURIComponent(newYearWish.value))
  params.append('type', countdownType.value)
  
  // 如果是自定义时间，添加时间参数
  if (countdownType.value === '3' && customDateTime.value) {
    params.append('targetTime', customDateTime.value)
  }
  
  router.push(`/NewYear?${params.toString()}`)
}

// 获取当前时间的 ISO 字符串（用于日期时间选择器的最小值）
const getCurrentDateTime = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const handleSubmit = () => {
  router.push({
    path: '/NewYear',
    query: {
      name: form.name,
      loved: encodeURIComponent(form.loved),
      wish: encodeURIComponent(form.wish),
      type: form.type
    }
  })
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
          <h1 class="text-4xl font-bold text-center text-white mb-8">节日祝福</h1>
          
          <!-- 未选择节日时显示选择界面 -->
          <div v-if="!selectedFestival" class="space-y-4">
            <!-- 圣诞节选项 -->
            <button 
              @click="selectFestival('christmas')"
              class="w-full bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 flex flex-col items-center space-y-2 group"
            >
              <span class="text-4xl group-hover:scale-110 transition-transform duration-300">🎄</span>
              <span class="text-xl font-semibold">圣诞祝福</span>
              <span class="text-sm opacity-80">制作温馨的圣诞节贺卡</span>
            </button>

            <!-- 跨年选项 -->
            <button 
              @click="selectFestival('newYear')"
              class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 flex flex-col items-center space-y-2 group"
            >
              <span class="text-4xl group-hover:scale-110 transition-transform duration-300">🎆</span>
              <span class="text-xl font-semibold">跨年祝福</span>
              <span class="text-sm opacity-80">创建新年倒计时贺卡</span>
            </button>

            <!-- 注释说明部分保持不变 -->
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

          <!-- 圣诞节表单 -->
          <div v-else-if="selectedFestival === 'christmas'" class="space-y-4">
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

            <button 
              @click="selectedFestival = null"
              class="w-full bg-transparent text-white/60 py-2 hover:text-white transition-colors"
            >
              返回选择
            </button>
          </div>

          <!-- 跨年表单 -->
          <div v-else-if="selectedFestival === 'newYear'" class="space-y-4">
            <!-- 倒计时类型选择 -->
            <div class="space-y-2">
              <label class="block text-white mb-2">倒计时类型</label>
              <div class="grid grid-cols-2 gap-2">
                <button 
                  @click="countdownType = '1'"
                  :class="[
                    'p-3 rounded-lg transition-all duration-300',
                    countdownType === '1' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  ]"
                >
                  元旦倒计时
                  <div class="text-xs opacity-75 mt-1">2024年1月1日</div>
                </button>
                
                <button 
                  @click="countdownType = '2'"
                  :class="[
                    'p-3 rounded-lg transition-all duration-300',
                    countdownType === '2' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  ]"
                >
                  春节倒计时
                  <div class="text-xs opacity-75 mt-1">2024年2月10日</div>
                </button>
                
                <button 
                  @click="countdownType = '3'"
                  :class="[
                    'p-3 rounded-lg transition-all duration-300',
                    countdownType === '3' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  ]"
                >
                  自定义倒计时
                </button>
                
                <button 
                  @click="countdownType = '4'"
                  :class="[
                    'p-3 rounded-lg transition-all duration-300',
                    countdownType === '4' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  ]"
                >
                  20秒倒计时
                </button>
              </div>
            </div>
            
            <!-- 自定义时间选择器（仅在选择自定义倒计时时显示） -->
            <div v-if="countdownType === '3'" class="space-y-2">
              <label class="block text-white mb-2">目标日期时间</label>
              <input 
                v-model="customDateTime"
                type="datetime-local"
                :min="getCurrentDateTime()"
                class="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white"
                required
              />
            </div>

            <!-- 祝福人信息（选填） -->
            <div>
              <label class="block text-white mb-2">你的名字 (选填)</label>
              <input 
                v-model="name"
                type="text"
                class="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white"
                placeholder="请输入你的名字（可选）"
              >
            </div>

            <!-- 被祝福人信息（必填） -->
            <div>
              <label class="block text-white mb-2">TA的名字 (必填)</label>
              <input 
                v-model="loved"
                type="text"
                class="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white"
                placeholder="请输入TA的名字"
                required
              >
            </div>

            <!-- 祝福语（必填） -->
            <div>
              <label class="block text-white mb-2">新年祝福语 (必填)</label>
              <textarea 
                v-model="newYearWish"
                class="w-full p-2 rounded bg-white/20 text-white border border-white/30 focus:outline-none focus:border-white"
                rows="3"
                placeholder="写下你的新年祝福..."
                required
              ></textarea>
            </div>

            <!-- 提交按钮 -->
            <button 
              @click="goToNewYear"
              class="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors mt-6"
            >
              生成祝福
            </button>

            <!-- 返回按钮 -->
            <button 
              @click="selectedFestival = null"
              class="w-full bg-transparent text-white/60 py-2 hover:text-white transition-colors"
            >
              返回选择
            </button>
          </div>

          <!-- 分享界面 -->
          <div v-if="showShare" class="space-y-6">
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