export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db, rowToGame } from '@/lib/db';

function ok<T>(data: T) { return NextResponse.json({ success: true, data, error: null }); }
function err(message: string, status = 400) { return NextResponse.json({ success: false, data: null, error: message }, { status }); }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await db();
  const { rows: gRows } = await client.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [id] });
  if (gRows.length === 0) return err('game not found', 404);
  const game = gRows[0];
  const { endDate, completedHours } = await req.json();
  if (!endDate) return err('endDate is required');
  if (!completedHours || completedHours <= 0) return err('completedHours must be > 0');
  let daysToComplete: number | null = null;
  if (game.start_date) {
    const start = new Date((game.start_date as string).slice(0, 10));
    const end = new Date(endDate.slice(0, 10));
    daysToComplete = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }
  const now = new Date().toISOString();
  await client.batch([
    { sql: `UPDATE games SET status='completed', end_date=?, completed_hours=?, days_to_complete=?, is_playing_now=0, updated_at=? WHERE id=?`, args: [endDate, completedHours, daysToComplete, now, id] },
    { sql: 'INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)', args: [randomUUID(), 'STATUS_CHANGE', 'Game', id, now, JSON.stringify({ status: 'completed', endDate, completedHours })] },
  ], 'write');
  const { rows } = await client.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [id] });
  return ok(rowToGame(rows[0]));
}
