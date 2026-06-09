import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { rowToGame } from '@/lib/db';

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error: message }, { status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { name, platformId, isROGAllyX, isGamePass, estimatedHours, releaseYear } = body;

  if (!name?.trim()) return err('name is required');
  if (!platformId) return err('platformId is required');

  const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(platformId) as Record<string, unknown> | undefined;
  if (!platform) return err('platform not found', 404);

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE games SET name=?, platform_id=?, platform_name=?, is_rog_ally_x=?, is_game_pass=?,
      estimated_hours=?, release_year=?, updated_at=?
    WHERE id=?
  `).run(name.trim(), platformId, platform.name, isROGAllyX ? 1 : 0, isGamePass ? 1 : 0,
    estimatedHours ?? null, releaseYear ?? null, now, id);

  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'UPDATE', 'Game', id, now, JSON.stringify({ name }));

  const row = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as Record<string, unknown>;
  if (!row) return err('game not found', 404);
  return ok(rowToGame(row));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!game) return err('game not found', 404);

  db.prepare('DELETE FROM games WHERE id = ?').run(id);

  const now = new Date().toISOString();
  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'DELETE', 'Game', id, now, JSON.stringify({ name: game.name }));

  return ok(null);
}
