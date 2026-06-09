export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db, rowToGame } from '@/lib/db';

function ok<T>(data: T) { return NextResponse.json({ success: true, data, error: null }); }
function err(message: string, status = 400) { return NextResponse.json({ success: false, data: null, error: message }, { status }); }

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const platform = searchParams.get('platform');
  const year = searchParams.get('year');
  if (!status) return err('status is required');
  let sql = 'SELECT * FROM games WHERE status = ?';
  const args: unknown[] = [status];
  if (platform) { sql += ' AND platform_name = ?'; args.push(platform); }
  if (year) { sql += ' AND release_year = ?'; args.push(parseInt(year)); }
  sql += ' ORDER BY is_playing_now DESC, sort_order ASC, created_at ASC';
  const client = await db();
  const { rows } = await client.execute({ sql, args });
  return ok(rows.map(rowToGame));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, platformId, status, isROGAllyX, isGamePass, estimatedHours, releaseYear } = body;
  if (!name?.trim()) return err('name is required');
  if (!platformId) return err('platformId is required');
  if (!status) return err('status is required');
  const client = await db();
  const { rows: pRows } = await client.execute({ sql: 'SELECT * FROM platforms WHERE id = ?', args: [platformId] });
  if (pRows.length === 0) return err('platform not found', 404);
  const platform = pRows[0];
  const { rows: orderRows } = await client.execute({ sql: 'SELECT MAX(sort_order) as m FROM games WHERE status = ?', args: ['pending'] });
  const maxOrder = status === 'pending' ? (Number(orderRows[0].m) || 0) + 1 : 0;
  const now = new Date().toISOString();
  const id = randomUUID();
  await client.batch([
    {
      sql: `INSERT INTO games (id, name, platform_id, platform_name, status, is_rog_ally_x, is_game_pass,
        estimated_hours, release_year, sort_order, is_playing_now, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      args: [id, name.trim(), platformId, platform.name, status, isROGAllyX ? 1 : 0, isGamePass ? 1 : 0, estimatedHours ?? null, releaseYear ?? null, maxOrder, now, now],
    },
    { sql: 'INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)', args: [randomUUID(), 'CREATE', 'Game', id, now, JSON.stringify({ name, status })] },
  ], 'write');
  const { rows } = await client.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [id] });
  return ok(rowToGame(rows[0]));
}
