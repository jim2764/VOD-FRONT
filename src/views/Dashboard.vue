<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { VideoInfoDto, UploadRequestDto } from '../types/video';
import VideoUpload from '../components/VideoUpload.vue';
import VideoList from '../components/VideoList.vue';
import VideoPlayerModal from '../components/VideoPlayerModal.vue';
import { videoApi } from '../api/video';

const videoList = ref<VideoInfoDto[]>([]);
const pollingQueue = ref(new Set<string>());
const isPlayerOpen = ref(false);
const currentVideoUrl = ref('');
let timer: number | null = null;

const startPolling = () => {
  if (timer !== null) return;

  console.log("🚀 偵測到任務，啟動輪詢計時器...");

  timer = window.setInterval(async () => {
    if (pollingQueue.value.size === 0) {
      stopPolling();
      return;
    }

    try {
      const ids = Array.from(pollingQueue.value);
      const { data: { data: res} } = await videoApi.getBatchStatuses(ids);

      // 刪除上傳失敗的資料
      const resIdSet = new Set(res.map(video => video.id));
      const missingVideoIds = new Set([...pollingQueue.value].filter(id => !resIdSet.has(id)));
      missingVideoIds.forEach(videoId => pollingQueue.value.delete(videoId))
      videoList.value = videoList.value.filter(video => !missingVideoIds.has(video.id))
      
      // Update Status and Delete PollingQueue
      res.forEach((item: { id: string, status: string, errorMsg: string }) => {
        const video = videoList.value.find(v => v.id === item.id);
        if (video) {
          video.status = item.status;
          video.errorMsg = item.errorMsg;
          if (item.status === 'READY' || item.status === 'FAIL') {
            pollingQueue.value.delete(item.id);
          }
        }
      });
    } catch (err) {
      console.error("輪詢出錯:", err);
    }
  }, 5000);
};

const stopPolling = () => {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
    console.log("🛑 任務清空，關閉計時器。");
  }
};

const addTaskToPolling = (videoId: string) => {
  pollingQueue.value.add(videoId);
  startPolling();
};

const getAllVideos = async () => {
  try {
    const { data: { data:videos } } = await videoApi.getAllVideos();
  
    videoList.value = videos;

  } catch(error) {
    console.log('取得影片發生錯誤:', error);
  }
}

const handleUploadStart = async (file: File) => {
  try {
    // Gernerate presigned post policy
    const meta = getFileMeta(file);
    const { data: { data: res } } = await videoApi.generatePresignedPolicy(meta);

    // Add video to List
    const newVideo: VideoInfoDto = {
      id: res.videoId,
      videoName: file.name,
      status: 'UPLOADING',
    };
    videoList.value.unshift(newVideo);

    // Uplaod video to minio
    const formData = new FormData();
    formData.append('key', res.videoKey);
    formData.append('content-type', res.contentType);
    formData.append('policy', res.policy);
    formData.append('x-amz-algorithm', res.xAmzAlgorithm);
    formData.append('x-amz-credential', res.xAmzCredential);
    formData.append('x-amz-date', res.xAmzDate);
    formData.append('x-amz-signature', res.xAmzSignature);
    formData.append('file', file);
    await videoApi.uploadToMinio(res.uploadUrl.replace("http://vod-minio:9000", ""), formData);
    
    // Add polling queue and Upladte status
    const targetVideo = videoList.value.find(v => v.id === res.videoId);
    if (targetVideo) {
      targetVideo.status = "UPLOADING";
      addTaskToPolling(res.videoId)
    }
  } catch(error) {
    console.error("上傳過程發生錯誤:", error);
  }
};

const getFileMeta = (file: File): UploadRequestDto => {
  const lastDot = file.name.lastIndexOf('.');
  return {
    videoName: file.name,
    extension: file.name.substring(lastDot).toLowerCase(),
    mimeType: file.type || 'application/octet-stream',
    size: file.size
  };
};

const handlePlay = (video: VideoInfoDto) => {
  if (video.id) {
    currentVideoUrl.value = video.id;
    isPlayerOpen.value = true;
  }
};

const handleError = (msg?: string) => {
  alert(`⚠️ 錯誤詳情：\n${msg || '未知錯誤'}`);
};

onMounted(async () =>  {
  await getAllVideos();

  videoList.value.forEach(v => {
    if (v.status === 'PROCESSING' || v.status === 'UPLOADING') {
      addTaskToPolling(v.id);
    }
  });
});

onUnmounted(() => {
  stopPolling();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 p-8">
    <div class="max-w-5xl mx-auto space-y-6">
      
      <div>
        <h1 class="text-3xl font-extrabold text-gray-900">影片管理控制台</h1>
        <p class="mt-2 text-sm text-gray-600">在此上傳影片並追蹤轉碼狀態。</p>
      </div>

      <VideoUpload @upload-start="handleUploadStart" />

      <VideoList 
        :videos="videoList" 
        @play="handlePlay" 
        @show-error="handleError"
      />
      
    </div>

    <VideoPlayerModal 
      :is-open="isPlayerOpen" 
      :video-id="currentVideoUrl" 
      @close="isPlayerOpen = false" 
    />
  </div>
</template>