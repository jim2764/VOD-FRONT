export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  data: T;
  timestamp: string;
}

export interface VideoStatusDto {
  id: string,
  status: string,
  errorMsg: string
}

export interface UploadRequestDto {
  videoName: string;
  mimeType: string;
  extension: string;
  size: number;
}

export type VideoStatus = 'UPLOADING' | 'PROCESSING' | 'FAILED' | 'READY';

export interface UploadResponse {
  videoId: string,
  videoName: string,
  videoKey: string,
  uploadUrl: string,
  contentType: string,
  policy: string,
  xAmzAlgorithm: string,
  xAmzCredential: string,
  xAmzDate: string,
  xAmzSignature: string
}

export interface VideoInfoDto {
  id: string,
  videoName: string,
  status: string,
  errorMsg?: string,
}

export interface PlayResponseDto {
  playUrl: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileId: string;
  objectName: string;
}