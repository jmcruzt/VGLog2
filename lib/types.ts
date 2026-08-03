export type GameStatus = 'pending' | 'completed' | 'upcoming';

export interface Game {
  id: string;
  name: string;
  platformId: string;
  platformName: string;
  status: GameStatus;
  isGamePass: boolean;
  isStarred: boolean;
  estimatedHours: number | null;
  releaseYear: number | null;
  releaseDate: string | null;
  order: number;
  isPlayingNow: boolean;
  startDate: string | null;
  endDate: string | null;
  completedHours: number | null;
  daysToComplete: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Platform {
  id: string;
  name: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface GroupCount {
  label: string;
  count: number;
}

export interface PendingSummary {
  totalHours: number;
  approxDays: number;
  approxEndDate: string;
  byPlatform: GroupCount[];
  byYear: GroupCount[];
  completedByYear: GroupCount[];
}

export interface CompletedSummary {
  totalCompleted: number;
  yearSpan: number;
  byPlatform: GroupCount[];
  byYear: GroupCount[];
  gamePassByYear: GroupCount[];
}

export interface UpcomingSummary {
  byPlatform: GroupCount[];
  byYear: GroupCount[];
  gamePassByYear: GroupCount[];
}

export interface CreateGameDto {
  name: string;
  platformId: string;
  status: GameStatus;
  isGamePass: boolean;
  isStarred: boolean;
  estimatedHours?: number;
  releaseYear?: number;
  releaseDate?: string;
}

export interface UpdateGameDto {
  name: string;
  platformId: string;
  isGamePass: boolean;
  isStarred: boolean;
  estimatedHours?: number;
  releaseYear?: number;
  releaseDate?: string;
}

export interface MarkCompletedDto {
  endDate: string;
  completedHours: number;
}

export interface PromoteToPendingDto {
  platformId: string;
  isGamePass: boolean;
  estimatedHours?: number;
  releaseYear?: number;
  isPlayingNow?: boolean;
  startDate?: string;
}

export interface CreatePlatformDto {
  name: string;
}

export interface UpdatePlatformDto {
  name: string;
}

export interface GamesFilter {
  status: GameStatus;
  platform?: string;
  year?: number;
}
