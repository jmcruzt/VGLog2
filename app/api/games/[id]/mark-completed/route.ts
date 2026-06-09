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

  const { endDate, completedHours } = await req.json();
  if (!endDate) return err('endDate is required');
  if (!completedHours || completedHours <= 0) return err('completedHours must be > 0');

  // Calculate days to complete if we have a start date
  let daysToComplete: number | null = null;
  if (game.start_date) {
    const start = new Date((game.start_date as string).slice(0, 10));
    const end = new Date(endDate.slice(0, 10));
    daysToComplete = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE games SET status='completed', end_date=?, completed_hours=?, days_to_complete=?,
      is_playing_now=0, updated_at=? WHERE id=?
  `).run(endDate, completedHours, daysToComplete, now, id);

  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'STATUS_CHANGE', 'Game', id, now, JSON.stringify({ status: 'completed', endDate, completedHours }));

  const row = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as Record<string, unknown>;
  return ok(rowToGame(row));
}
