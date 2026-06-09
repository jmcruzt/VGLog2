export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const byPlatform = db.prepare(
    "SELECT platform_name as label, COUNT(*) as count FROM games WHERE status='upcoming' GROUP BY platform_name ORDER BY count DESC"
  ).all() as { label: string; count: number }[];

  return NextResponse.json({
    success: true,
    data: { byPlatform },
    error: null,
  });
}
