<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import Hls from 'hls.js';
import { videoApi } from '../api/video';

const props = defineProps<{
  isOpen: boolean;
  videoId: string;
}>();

const emit = defineEmits(['close']);

const videoRef = ref<HTMLVideoElement | null>(null);
const playerContainerRef = ref<HTMLElement | null>(null);
const isPlaying = ref(false);
const isLoading = ref(true);
const currentTime = ref(0);
const duration = ref(0);
const volume = ref(1);
const isMuted = ref(false);
const isFullscreen = ref(false);
const showQualityMenu = ref(false);
const currentQuality = ref('自動');
const qualities = ref(new Map<number, string>());
let hls: Hls | null = null;

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00';
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};


const togglePlay = () => {
  if (!videoRef.value) return;
  if (videoRef.value.paused) {
    videoRef.value.play();
  } else {
    videoRef.value.pause();
  }
};

const handleTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime;
  }
};

const handleLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration;
  }
};

const seekVideo = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (videoRef.value) {
    videoRef.value.currentTime = Number(target.value);
  }
};

const changeVolume = (e: Event) => {
  const target = e.target as HTMLInputElement;
  volume.value = Number(target.value);
  if (videoRef.value) {
    videoRef.value.volume = volume.value;
    isMuted.value = volume.value === 0;
  }
};

const toggleMute = () => {
  if (!videoRef.value) return;
  isMuted.value = !isMuted.value;
  videoRef.value.muted = isMuted.value;
  if (!isMuted.value && volume.value === 0) {
    volume.value = 1;
    videoRef.value.volume = 1;
  }
};

const toggleFullscreen = () => {
  if (!playerContainerRef.value) return;

  if (!document.fullscreenElement) {
    playerContainerRef.value.requestFullscreen().catch(err => {
      console.error(`無法進入全螢幕模式: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
};

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

const selectQuality = (index:number, quality: string) => {
  currentQuality.value = quality;
  showQualityMenu.value = false;
  if (hls) hls.currentLevel = index;
};

const handleCanPlay = () => {
  isLoading.value = false;
};

const handleWaiting = () => {
  isLoading.value = true;
};

const resetPlayerState = () => {
  volume.value = 100;
  isPlaying.value = false;
  isLoading.value = true;
  isMuted.value = false;
  currentTime.value = 0;
  duration.value = 0;
  currentQuality.value = "自動";
  showQualityMenu.value = false;
  if (hls) hls.currentLevel = -1;
  qualities.value.clear();

  destroyHls();

  if (videoRef.value) {
    videoRef.value.currentTime = 0;
    videoRef.value.pause();
    videoRef.value.removeAttribute('src');
    videoRef.value.load();
  }
};

const destroyHls = () => {
  if (hls) {
    hls.destroy();
    hls = null;
  }
};

const initHls = (playUrl: string) => {
  const video = videoRef.value;
  if (!video) return;

  if (Hls.isSupported()) {
    destroyHls();
    hls = new Hls();
    hls.loadSource(playUrl);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
      qualities.value.set(-1, "自動")
      data.levels.map((video, index) => {
        qualities.value.set(index, Math.min(video.width, video.height).toString())
      })
      // video.play() // 自動播放
    });
    
  } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = playUrl;
  }
}

watch(() => props.isOpen, async (newVal) => {
  if (!newVal) return;

  resetPlayerState()

  try {
    // Get play url
    const { data: { data: response } } = await videoApi.generatePlaybackUrl(props.videoId);
    const videoPlayUrl = response.playUrl.replace("http://vod-minio:9000", "");

    await nextTick();

    initHls(videoPlayUrl);

  } catch (error) {
    console.error("影片載入失敗:", error);
  }
})

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  destroyHls();
});
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-opacity backdrop-blur-sm">
    <div class="absolute inset-0" @click="emit('close')"></div>

    <div 
      ref="playerContainerRef"
      class="relative group w-full max-w-5xl bg-black rounded-lg shadow-2xl overflow-hidden z-10 flex flex-col justify-center"
    >

      <button 
        v-if="!isFullscreen"
        @click="emit('close')" 
        class="absolute top-4 right-4 text-white hover:text-red-500 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center z-50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
  
      <video 
        ref="videoRef"
        class="w-full h-auto max-h-[85vh] cursor-pointer"
        @click="togglePlay"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
        @play="isPlaying = true"
        @pause="isPlaying = false"
        @canplay="handleCanPlay"  
        @waiting="handleWaiting"
      >
        您的瀏覽器不支援影片播放。
      </video>

      <div 
        v-if="isLoading" 
        class="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-40 transition-opacity duration-300"
      >
        <div class="relative flex items-center justify-center">
          <div class="w-12 h-12 border-4 border-gray-600 rounded-full"></div>
          <div class="absolute top-0 w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p class="mt-4 text-white text-sm font-medium tracking-widest animate-pulse">載入中...</p>
      </div>

      <div class="absolute bottom-0 left-0 right-0 from-black/90 via-black/50 to-transparent px-4 pb-4 pt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col gap-2">

        <div class="w-full flex items-center">
          <input 
            type="range" 
            min="0" 
            :max="duration" 
            step="any"
            :value="currentTime" 
            @input="seekVideo"
            class="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
          >
        </div>

        <div class="flex items-center justify-between text-white mt-1">
          <div class="flex items-center gap-4">
            <button @click="togglePlay" class="hover:text-blue-400 transition-colors">
              <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg>
            </button>

            <span class="text-sm font-medium tabular-nums">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </span>

            <div class="flex items-center gap-2 group/volume">
              <button @click="toggleMute" class="hover:text-blue-400 transition-colors">
                <svg v-if="isMuted || volume === 0" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
              </button>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05" 
                :value="isMuted ? 0 : volume" 
                @input="changeVolume"
                class="w-0 opacity-0 group-hover/volume:w-20 group-hover/volume:opacity-100 transition-all duration-300 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
              >
            </div>
          </div>

          <div class="flex items-center gap-4 relative">
            <div class="relative">
              <button 
                @click="showQualityMenu = !showQualityMenu" 
                class="flex items-center gap-1 text-sm font-medium hover:text-blue-400 transition-colors"
              >
                {{ currentQuality }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
              
              <div v-if="showQualityMenu" class="absolute bottom-full right-0 mb-2 w-24 bg-black/90 rounded-md shadow-lg overflow-hidden border border-gray-700">
                <button 
                  v-for="[index, quality] in qualities" 
                  :key="quality"
                  @click="selectQuality(index, quality)"
                  class="w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors"
                  :class="{'text-blue-400 font-bold': currentQuality === quality}"
                >
                  {{ quality }}
                </button>
              </div>
            </div>

            <button @click="toggleFullscreen" class="hover:text-blue-400 transition-colors">
              <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 14h6m0 0v6m0-6l-7 7m17-11h-6m0 0V4m0 6l7-7m-7 17l7-7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>