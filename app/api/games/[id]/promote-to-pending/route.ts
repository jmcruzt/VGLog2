export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { rowToGame } from '@/lib/db';

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error: message }, { status });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!game) return err('game not found', 404);

  const { platformId, isROGAllyX, isGamePass, estimatedHours, releaseYear, isPlayingNow, startDate } = await req.json();

  const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(platformId) as Record<string, unknown> | undefined;
  if (!platform) return err('platform not found', 404);

  const maxOrder = ((db.prepare('SELECT MAX(sort_order) as m FROM games WHERE status = ?').get('pending') as Record<string, unknown>).m as number ?? 0) + 1;
  const now = new Date().toISOString();
  const playStart = isPlayingNow ? (startDate ?? now) : null;

  db.prepare(`
    UPDATE games SET status='pending', platform_id=?, platform_name=?, is_rog_ally_x=?, is_game_pass=?,
      estimated_hours=?, release_year=?, sort_order=?, is_playing_now=?, start_date=?, updated_at=? WHERE id=?
  `).run(platformId, platform.name, isROGAllyX ? 1 : 0, isGamePass ? 1 : 0,
    estimatedHours ?? null, releaseYear ?? null, maxOrder, isPlayingNow ? 1 : 0, playStart, now, id);

  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'STATUS_CHANGE', 'Game', id, now, JSON.stringify({ status: 'pending', isPlayingNow }));

  const row = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as Record<string, unknown>;
  return ok(rowToGame(row));
}
