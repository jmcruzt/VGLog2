export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const client = await db();
  const { rows: [totalRow] } = await client.execute("SELECT COALESCE(SUM(estimated_hours), 0) as total FROM games WHERE status = 'pending'");
  const totalHours = Math.round(Number(totalRow.total) * 10) / 10;
  const approxDays = Math.ceil(totalHours / 2);
  const approxEndDate = new Date(Date.now() + approxDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const { rows: byPlatform } = await client.execute("SELECT platform_name as label, COUNT(*) as count FROM games WHERE status='pending' GROUP BY platform_name ORDER BY count DESC");
  const { rows: byYearRaw } = await client.execute("SELECT release_year as label, COUNT(*) as count FROM games WHERE status='pending' AND release_year IS NOT NULL GROUP BY release_year ORDER BY release_year DESC");
  const { rows: completedByYear } = await client.execute("SELECT SUBSTR(end_date, 1, 4) as label, COUNT(*) as count FROM games WHERE status='completed' AND end_date IS NOT NULL GROUP BY label ORDER BY label DESC");
  return NextResponse.json({
    success: true,
    data: {
      totalHours, approxDays, approxEndDate,
      byPlatform: byPlatform.map(r => ({ label: r.label as string, count: Number(r.count) })),
      byYear: byYearRaw.map(r => ({ label: String(r.label), count: Number(r.count) })),
      completedByYear: completedByYear.map(r => ({ label: r.label as string, count: Number(r.count) })),
    },
    error: null,
  });
}
