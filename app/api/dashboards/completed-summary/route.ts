export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const totalCompleted = (db.prepare(
    "SELECT COUNT(*) as c FROM games WHERE status='completed'"
  ).get() as { c: number }).c;

  const yearSpanRow = db.prepare(
    "SELECT MIN(release_year) as minY, MAX(release_year) as maxY FROM games WHERE status='completed' AND release_year IS NOT NULL"
  ).get() as { minY: number | null; maxY: number | null };
  const yearSpan = yearSpanRow.minY != null && yearSpanRow.maxY != null
    ? yearSpanRow.maxY - yearSpanRow.minY + 1
    : 0;

  const byPlatform = db.prepare(
    "SELECT platform_name as label, COUNT(*) as count FROM games WHERE status='completed' GROUP BY platform_name ORDER BY count DESC"
  ).all() as { label: string; count: number }[];

  return NextResponse.json({
    success: true,
    data: { totalCompleted, yearSpan, byPlatform },
    error: null,
  });
}
