<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit'])

const form = ref({
  festival: 'newYear',
  from: '',
  to: '',
  message: ''
})

const festivals = [
  { value: 'newYear', label: '元旦' },
  { value: 'springFestival', label: '春节' },
  { value: 'christmas', label: '圣诞节' }
]

const submitForm = () => {
  emit('submit', { ...form.value })
}
</script>

<template>
  <form @submit.prevent="submitForm" class="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
    <div class="mb-4">
      <label class="block text-gray-700 mb-2">节日</label>
      <select 
        v-model="form.festival"
        class="w-full p-2 border rounded"
      >
        <option v-for="festival in festivals" :key="festival.value" :value="festival.value">
          {{ festival.label }}
        </option>
      </select>
    </div>

    <div class="mb-4">
      <label class="block text-gray-700 mb-2">发送者</label>
      <input 
        v-model="form.from"
        type="text"
        class="w-full p-2 border rounded"
        required
      >
    </div>

    <div class="mb-4">
      <label class="block text-gray-700 mb-2">接收者</label>
      <input 
        v-model="form.to"
        type="text"
        class="w-full p-2 border rounded"
        required
      >
    </div>

    <div class="mb-4">
      <label class="block text-gray-700 mb-2">祝福语</label>
      <textarea 
        v-model="form.message"
        class="w-full p-2 border rounded"
        rows="4"
        required
      ></textarea>
    </div>

    <button 
      type="submit"
      class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
    >
      生成祝福卡片
    </button>
  </form>
</template> 