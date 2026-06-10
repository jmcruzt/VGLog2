export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db, rowToGame } from '@/lib/db';
import type { InStatement } from '@libsql/client';

function ok<T>(data: T) { return NextResponse.json({ success: true, data, error: null }); }
function err(message: string, status = 400) { return NextResponse.json({ success: false, data: null, error: message }, { status }); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await db();
  const { rows: gRows } = await client.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [id] });
  if (gRows.length === 0) return err('game not found', 404);
  const game = gRows[0];
  const now = new Date().toISOString();
  const isCurrentlyPlaying = Boolean(Number(game.is_playing_now));
  const statements: InStatement[] = [];
  if (isCurrentlyPlaying) {
    statements.push({ sql: 'UPDATE games SET is_playing_now=0, start_date=NULL, updated_at=? WHERE id=?', args: [now, id] });
  } else {
    let startDate = now;
    try { const body = await req.json(); if (body?.startDate) startDate = body.startDate; } catch { /* no body */ }
    statements.push({ sql: 'UPDATE games SET is_playing_now=1, start_date=?, updated_at=? WHERE id=?', args: [startDate, now, id] });
  }
  statements.push({ sql: 'INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)', args: [randomUUID(), 'STATUS_CHANGE', 'Game', id, now, JSON.stringify({ isPlayingNow: !isCurrentlyPlaying })] });
  await client.batch(statements, 'write');
  const { rows } = await client.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [id] });
  return ok(rowToGame(rows[0]));
}
