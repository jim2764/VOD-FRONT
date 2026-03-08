import axios from 'axios';
import type { ApiResponse, UploadRequestDto, UploadResponse, PlayResponseDto, VideoInfoDto, VideoStatusDto } from '../types/video';

// 建立一個專門對後端的 axios 實例
const api = axios.create({
  baseURL: '/api', // 對應 Nginx 設定的 /api/
  timeout: 10000,
});

export const videoApi = {
  // 取得上傳策略與欄位
  generatePresignedPolicy(uploadRequestDto: UploadRequestDto) {
    return api.post<ApiResponse<UploadResponse>>('/video/presigned-policy',
      uploadRequestDto
    );
  },

  // 上傳到minio透過form data
  uploadToMinio(uploadUrl: string, formData: FormData) {
    return axios.post(uploadUrl, formData);
  },

  // 取得播放連結
  generatePlaybackUrl(videoId: string) {
    return api.get<ApiResponse<PlayResponseDto>>(`/video/play/${videoId}`);
  },

  getAllVideos() {
    return api.get<ApiResponse<VideoInfoDto[]>>('/video/all-video');
  },

  getBatchStatuses(ids: string[]) {
    return api.get<ApiResponse<VideoStatusDto[]>>('/video/batch-status', {
      params: {
        ids: ids 
      }
    });
  }
};