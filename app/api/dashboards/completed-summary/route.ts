export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const client = await db();
  const { rows: [countRow] } = await client.execute("SELECT COUNT(*) as c FROM games WHERE status='completed'");
  const totalCompleted = Number(countRow.c);
  const { rows: [spanRow] } = await client.execute("SELECT MIN(release_year) as minY, MAX(release_year) as maxY FROM games WHERE status='completed' AND release_year IS NOT NULL");
  const yearSpan = spanRow.minY != null && spanRow.maxY != null ? Number(spanRow.maxY) - Number(spanRow.minY) + 1 : 0;
  const { rows: byPlatform } = await client.execute("SELECT platform_name as label, COUNT(*) as count FROM games WHERE status='completed' GROUP BY platform_name ORDER BY count DESC");
  const { rows: byYear } = await client.execute("SELECT release_year as label, COUNT(*) as count FROM games WHERE status='completed' AND release_year IS NOT NULL GROUP BY release_year ORDER BY release_year DESC");
  const { rows: gamePassByYear } = await client.execute("SELECT release_year as label, COUNT(*) as count FROM games WHERE status='completed' AND is_game_pass=1 AND release_year IS NOT NULL GROUP BY release_year ORDER BY release_year DESC");
  return NextResponse.json({
    success: true,
    data: {
      totalCompleted, yearSpan,
      byPlatform: byPlatform.map(r => ({ label: r.label as string, count: Number(r.count) })),
      byYear: byYear.map(r => ({ label: String(r.label), count: Number(r.count) })),
      gamePassByYear: gamePassByYear.map(r => ({ label: String(r.label), count: Number(r.count) })),
    },
    error: null,
  });
}
