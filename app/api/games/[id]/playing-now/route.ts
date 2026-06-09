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

  const now = new Date().toISOString();
  const isCurrentlyPlaying = Boolean(game.is_playing_now);

  if (isCurrentlyPlaying) {
    // Turning OFF
    db.prepare('UPDATE games SET is_playing_now=0, start_date=NULL, updated_at=? WHERE id=?').run(now, id);
  } else {
    // Turning ON
    let startDate = now;
    try {
      const body = await req.json();
      if (body?.startDate) startDate = body.startDate;
    } catch { /* no body */ }

    db.prepare('UPDATE games SET is_playing_now=1, start_date=?, updated_at=? WHERE id=?').run(startDate, now, id);
  }

  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'STATUS_CHANGE', 'Game', id, now, JSON.stringify({ isPlayingNow: !isCurrentlyPlaying }));

  const row = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as Record<string, unknown>;
  return ok(rowToGame(row));
}
