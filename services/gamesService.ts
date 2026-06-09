import type {
  ApiResponse,
  CreateGameDto,
  Game,
  GamesFilter,
  MarkCompletedDto,
  PromoteToPendingDto,
  UpdateGameDto,
} from '@/lib/types';
import api from './api';

const gamesService = {
  list: (filter: GamesFilter) =>
    api.get<ApiResponse<Game[]>>('/games', {
      params: { status: filter.status, platform: filter.platform, year: filter.year },
    }),
  create: (dto: CreateGameDto) => api.post<ApiResponse<Game>>('/games', dto),
  update: (id: string, dto: UpdateGameDto) => api.put<ApiResponse<Game>>(`/games/${id}`, dto),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/games/${id}`),
  togglePlayingNow: (id: string, startDate?: string) =>
    api.patch<ApiResponse<Game>>(`/games/${id}/playing-now`, startDate ? { startDate } : undefined),
  markCompleted: (id: string, dto: MarkCompletedDto) =>
    api.patch<ApiResponse<Game>>(`/games/${id}/mark-completed`, dto),
  promoteToPending: (id: string, dto: PromoteToPendingDto) =>
    api.patch<ApiResponse<Game>>(`/games/${id}/promote-to-pending`, dto),
  reorder: (orderedIds: string[]) =>
    api.post<ApiResponse<null>>('/games/reorder', { orderedIds }),
};

export default gamesService;
