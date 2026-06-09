import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { rowToGame } from '@/lib/db';

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error: message }, { status });
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const status = searchParams.get('status');
  const platform = searchParams.get('platform');
  const year = searchParams.get('year');

  if (!status) return err('status is required');

  let sql = 'SELECT * FROM games WHERE status = ?';
  const params: unknown[] = [status];

  if (platform) {
    sql += ' AND platform_name = ?';
    params.push(platform);
  }
  if (year) {
    sql += ' AND release_year = ?';
    params.push(parseInt(year));
  }

  sql += ' ORDER BY is_playing_now DESC, sort_order ASC, created_at ASC';

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return ok(rows.map(rowToGame));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, platformId, status, isROGAllyX, isGamePass, estimatedHours, releaseYear } = body;

  if (!name?.trim()) return err('name is required');
  if (!platformId) return err('platformId is required');
  if (!status) return err('status is required');

  const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(platformId) as Record<string, unknown> | undefined;
  if (!platform) return err('platform not found', 404);

  // Get max sort_order for pending games
  const maxOrder = status === 'pending'
    ? ((db.prepare('SELECT MAX(sort_order) as m FROM games WHERE status = ?').get('pending') as Record<string, unknown>).m as number ?? 0) + 1
    : 0;

  const now = new Date().toISOString();
  const id = randomUUID();

  db.prepare(`
    INSERT INTO games (id, name, platform_id, platform_name, status, is_rog_ally_x, is_game_pass,
      estimated_hours, release_year, sort_order, is_playing_now, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `).run(id, name.trim(), platformId, platform.name, status, isROGAllyX ? 1 : 0, isGamePass ? 1 : 0,
    estimatedHours ?? null, releaseYear ?? null, maxOrder, now, now);

  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'CREATE', 'Game', id, now, JSON.stringify({ name, status }));

  const row = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as Record<string, unknown>;
  return ok(rowToGame(row));
}
