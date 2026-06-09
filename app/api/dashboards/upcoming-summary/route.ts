export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const client = await db();
  const { rows: byPlatform } = await client.execute("SELECT platform_name as label, COUNT(*) as count FROM games WHERE status='upcoming' GROUP BY platform_name ORDER BY count DESC");
  return NextResponse.json({
    success: true,
    data: { byPlatform: byPlatform.map(r => ({ label: r.label as string, count: Number(r.count) })) },
    error: null,
  });
}
