'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateGameDto, GamesFilter, MarkCompletedDto, PromoteToPendingDto, UpdateGameDto } from '@/lib/types';
import gamesService from '@/services/gamesService';

const gameKeys = {
  all: ['games'] as const,
  list: (filter: GamesFilter) => ['games', filter] as const,
};

export function useGames(filter: GamesFilter, enabled = true) {
  return useQuery({
    queryKey: gameKeys.list(filter),
    queryFn: async () => {
      const res = await gamesService.list(filter);
      return res.data.data ?? [];
    },
    enabled,
  });
}

export function useCreateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateGameDto) => gamesService.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.all });
      qc.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useUpdateGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateGameDto }) => gamesService.update(id, dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameKeys.all }); },
  });
}

export function useDeleteGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gamesService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.all });
      qc.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useTogglePlayingNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, startDate }: { id: string; startDate?: string }) =>
      gamesService.togglePlayingNow(id, startDate),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameKeys.all }); },
  });
}

export function useMarkCompleted() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: MarkCompletedDto }) => gamesService.markCompleted(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.all });
      qc.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function usePromoteToPending() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: PromoteToPendingDto }) => gamesService.promoteToPending(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gameKeys.all });
      qc.invalidateQueries({ queryKey: ['dashboards'] });
    },
  });
}

export function useReorderGames() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => gamesService.reorder(orderedIds),
    onSuccess: () => { qc.invalidateQueries({ queryKey: gameKeys.all }); },
  });
}
