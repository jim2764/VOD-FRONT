<script setup lang="ts">
import { ref } from 'vue';

const fileInput = ref<HTMLInputElement | null>(null);
const selectedFile = ref<File | null>(null);

const emit = defineEmits(['upload-start']);

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0] || null;
  }
};

const startUpload = () => {
  if (!selectedFile.value) return;
  
  emit('upload-start', selectedFile.value);
  
  selectedFile.value = null;
  if (fileInput.value) fileInput.value.value = '';
};
</script>

<template>
  <div class="p-6 bg-white rounded-lg shadow-sm border border-gray-200">
    <h2 class="text-lg font-semibold mb-6 text-gray-700">上傳新影片</h2>

    <div class="flex items-center space-x-4">
      
      <div class="w-32">
        <input type="file" ref="fileInput" @change="handleFileSelect" accept="video/mp4" class="hidden" />
        <button 
          @click="fileInput?.click()" 
          class="w-full h-11 px-6 bg-white text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] transition-all duration-200 font-semibold text-sm shadow-sm flex items-center justify-center group"
        >
          <svg class="w-4 h-4 mr-2 text-slate-500 group-hover:text-indigo-600 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
          </svg>
          選擇檔案
        </button>
      </div>

      <div class="flex-1 h-16 bg-gray-50 rounded-lg border border-gray-100 px-4 flex items-center overflow-hidden">
        
        <div v-if="selectedFile" class="flex items-center space-x-3 w-full">
          <div class="p-2 bg-blue-100 text-blue-600 rounded">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div class="flex flex-col min-w-0">
            <span class="text-sm font-bold text-gray-800 truncate">{{ selectedFile.name }}</span>
            <div class="flex items-center space-x-2 text-xs text-gray-500">
              <span>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
              <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold tracking-wider uppercase border border-slate-200">{{ selectedFile.type.split('/')[1] }}</span>
            </div>
          </div>
        </div>

        <div v-else class="text-sm text-gray-400 italic">
          尚未選擇影片
        </div>
      </div>

      <div class="w-32">
        <button 
          v-if="selectedFile" 
          @click="startUpload" 
          class="h-11 px-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all duration-200 font-semibold text-sm shadow-md shadow-indigo-100 flex items-center justify-center"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
          開始上傳
        </button>
      </div>

    </div>
  </div>
</template>