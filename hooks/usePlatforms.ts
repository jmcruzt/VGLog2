'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreatePlatformDto, UpdatePlatformDto } from '@/lib/types';
import platformsService from '@/services/platformsService';

const platformKeys = { all: ['platforms'] as const };

export function usePlatforms(enabled = true) {
  return useQuery({
    queryKey: platformKeys.all,
    queryFn: async () => {
      const res = await platformsService.list();
      return res.data.data ?? [];
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePlatformDto) => platformsService.create(dto),
    onSuccess: () => { qc.invalidateQueries({ queryKey: platformKeys.all }); },
  });
}

export function useUpdatePlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlatformDto }) => platformsService.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: platformKeys.all });
      qc.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useDeletePlatform() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformsService.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: platformKeys.all }); },
  });
}
