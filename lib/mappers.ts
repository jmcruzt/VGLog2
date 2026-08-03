import type { Row } from '@libsql/client';

export function rowToGame(row: Row) {
  return {
    id: row.id as string,
    name: row.name as string,
    platformId: row.platform_id as string,
    platformName: row.platform_name as string,
    status: row.status as string,
    isGamePass: Boolean(Number(row.is_game_pass)),
    isStarred: Boolean(Number(row.is_starred)),
    estimatedHours: row.estimated_hours != null ? Number(row.estimated_hours) : null,
    releaseYear: row.release_year != null ? Number(row.release_year) : null,
    releaseDate: row.release_date as string | null,
    order: Number(row.sort_order),
    isPlayingNow: Boolean(Number(row.is_playing_now)),
    startDate: row.start_date as string | null,
    endDate: row.end_date as string | null,
    completedHours: row.completed_hours != null ? Number(row.completed_hours) : null,
    daysToComplete: row.days_to_complete != null ? Number(row.days_to_complete) : null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function rowToPlatform(row: Row) {
  return {
    id: row.id as string,
    name: row.name as string,
  };
}
