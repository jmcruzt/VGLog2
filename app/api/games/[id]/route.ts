export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db, rowToGame } from '@/lib/db';

function ok<T>(data: T) { return NextResponse.json({ success: true, data, error: null }); }
function err(message: string, status = 400) { return NextResponse.json({ success: false, data: null, error: message }, { status }); }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, platformId, isROGAllyX, isGamePass, estimatedHours, releaseYear } = body;
  if (!name?.trim()) return err('name is required');
  if (!platformId) return err('platformId is required');
  const client = await db();
  const { rows: pRows } = await client.execute({ sql: 'SELECT * FROM platforms WHERE id = ?', args: [platformId] });
  if (pRows.length === 0) return err('platform not found', 404);
  const platform = pRows[0];
  const now = new Date().toISOString();
  await client.batch([
    {
      sql: `UPDATE games SET name=?, platform_id=?, platform_name=?, is_rog_ally_x=?, is_game_pass=?,
        estimated_hours=?, release_year=?, updated_at=? WHERE id=?`,
      args: [name.trim(), platformId, platform.name, isROGAllyX ? 1 : 0, isGamePass ? 1 : 0, estimatedHours ?? null, releaseYear ?? null, now, id],
    },
    { sql: 'INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)', args: [randomUUID(), 'UPDATE', 'Game', id, now, JSON.stringify({ name })] },
  ], 'write');
  const { rows } = await client.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [id] });
  if (rows.length === 0) return err('game not found', 404);
  return ok(rowToGame(rows[0]));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await db();
  const { rows: gRows } = await client.execute({ sql: 'SELECT * FROM games WHERE id = ?', args: [id] });
  if (gRows.length === 0) return err('game not found', 404);
  const game = gRows[0];
  const now = new Date().toISOString();
  await client.batch([
    { sql: 'DELETE FROM games WHERE id = ?', args: [id] },
    { sql: 'INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)', args: [randomUUID(), 'DELETE', 'Game', id, now, JSON.stringify({ name: game.name })] },
  ], 'write');
  return ok(null);
}
