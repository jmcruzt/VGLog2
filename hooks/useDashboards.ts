'use client';
import { useQuery } from '@tanstack/react-query';
import dashboardsService from '@/services/dashboardsService';

export function usePendingSummary(enabled = true) {
  return useQuery({
    queryKey: ['dashboards', 'pending-summary'],
    queryFn: async () => {
      const res = await dashboardsService.pendingSummary();
      return res.data.data;
    },
    enabled,
  });
}

export function useCompletedSummary(enabled = true) {
  return useQuery({
    queryKey: ['dashboards', 'completed-summary'],
    queryFn: async () => {
      const res = await dashboardsService.completedSummary();
      return res.data.data;
    },
    enabled,
  });
}

export function useUpcomingSummary(enabled = true) {
  return useQuery({
    queryKey: ['dashboards', 'upcoming-summary'],
    queryFn: async () => {
      const res = await dashboardsService.upcomingSummary();
      return res.data.data;
    },
    enabled,
  });
}
