<script setup lang="ts">
import type { VideoInfoDto } from '../types/video';

defineProps<{
  videos: VideoInfoDto[]
}>();

const emit = defineEmits(['play', 'show-error']);
</script>

<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-slate-50/50 border-b border-slate-100">
        <tr>
          <th class="px-6 py-4 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">影片名稱</th>
          <th class="px-6 py-4 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">處理狀態</th>
          <th class="px-6 py-4 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">操作</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200 bg-white">
        <tr v-for="video in videos" :key="video.id" class="hover:bg-gray-50 transition-colors">
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 mr-3">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"></path></svg>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">{{ video.videoName }}</div>
                <div class="text-xs text-gray-500">ID: {{ video.id }}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 text-left whitespace-nowrap">
            <div v-if="video.status=='UPLOADING'" class="animate-pulse inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              上傳中
            </div>
  
            <div v-else-if="video.status=='PROCESSING'" class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <svg class="animate-spin h-3.5 w-3.5 text-amber-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              轉碼中
            </div>
  
            <div v-else-if="video.status=='READY'" class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
              準備就緒
            </div>
  
            <div v-else-if="video.status=='FAILED'" class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              處理失敗
            </div>
          </td>

          <td class="px-6 py-4 whitespace-nowrap text-left">
            <button 
              v-if="video.status === 'READY'"
              @click="emit('play', video)"
              class="inline-flex items-center h-10 px-4 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-95 transition-all duration-200 font-semibold text-sm shadow-md shadow-emerald-100"
            >
              <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.556-2.333 2.78-1.613l12.258 7.142a1.611 1.611 0 0 1 0 2.817L7.28 21.14c-1.224.72-2.78-.186-2.78-1.613V5.653Z" clip-rule="evenodd" />
              </svg>
              播放影片
            </button>

            <button 
              v-if="video.status === 'FAILED'"
              @click="emit('show-error', video.errorMsg)"
              class="inline-flex items-center h-10 px-4 bg-rose-600 text-white rounded-xl hover:bg-rose-700 active:scale-95 transition-all duration-200 font-semibold text-sm shadow-md shadow-rose-100"
            >
              <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
              查看原因
            </button>
          </td>
        </tr>
        <tr v-if="videos.length === 0">
          <td colspan="3" class="px-6 py-10 text-center text-gray-500 text-sm">
            目前沒有任何影片
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>