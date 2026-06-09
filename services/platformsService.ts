import type { ApiResponse, CreatePlatformDto, Platform, UpdatePlatformDto } from '@/lib/types';
import api from './api';

const platformsService = {
  list: () => api.get<ApiResponse<Platform[]>>('/platforms'),
  create: (dto: CreatePlatformDto) => api.post<ApiResponse<Platform>>('/platforms', dto),
  update: (id: string, dto: UpdatePlatformDto) => api.put<ApiResponse<Platform>>(`/platforms/${id}`, dto),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/platforms/${id}`),
};

export default platformsService;
