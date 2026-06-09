import type { ApiResponse, CompletedSummary, PendingSummary, UpcomingSummary } from '@/lib/types';
import api from './api';

const dashboardsService = {
  pendingSummary: () => api.get<ApiResponse<PendingSummary>>('/dashboards/pending-summary'),
  completedSummary: () => api.get<ApiResponse<CompletedSummary>>('/dashboards/completed-summary'),
  upcomingSummary: () => api.get<ApiResponse<UpcomingSummary>>('/dashboards/upcoming-summary'),
};

export default dashboardsService;
