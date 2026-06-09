export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const totalHoursRow = db.prepare(
    "SELECT COALESCE(SUM(estimated_hours), 0) as total FROM games WHERE status = 'pending'"
  ).get() as { total: number };
  const totalHours = Math.round(totalHoursRow.total * 10) / 10;
  const approxDays = Math.ceil(totalHours / 2);
  const approxEndDate = new Date(Date.now() + approxDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const byPlatform = (db.prepare(
    "SELECT platform_name as label, COUNT(*) as count FROM games WHERE status='pending' GROUP BY platform_name ORDER BY count DESC"
  ).all() as { label: string; count: number }[]);

  const byYear = (db.prepare(
    "SELECT release_year as label, COUNT(*) as count FROM games WHERE status='pending' AND release_year IS NOT NULL GROUP BY release_year ORDER BY release_year DESC"
  ).all() as { label: number; count: number }[]).map(r => ({ label: String(r.label), count: r.count }));

  const completedByYear = (db.prepare(
    "SELECT SUBSTR(end_date, 1, 4) as label, COUNT(*) as count FROM games WHERE status='completed' AND end_date IS NOT NULL GROUP BY label ORDER BY label DESC"
  ).all() as { label: string; count: number }[]);

  return NextResponse.json({
    success: true,
    data: { totalHours, approxDays, approxEndDate, byPlatform, byYear, completedByYear },
    error: null,
  });
}
