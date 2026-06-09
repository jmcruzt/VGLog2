export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db, { rowToPlatform } from '@/lib/db';

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error: message }, { status });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return err('name is required');

  const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(id);
  if (!platform) return err('platform not found', 404);

  const existing = db.prepare('SELECT id FROM platforms WHERE name = ? AND id != ?').get(name.trim(), id);
  if (existing) return err(`Platform "${name}" already exists`, 409);

  const now = new Date().toISOString();
  db.prepare('UPDATE platforms SET name=? WHERE id=?').run(name.trim(), id);
  // Update denormalized platform_name in all games
  db.prepare('UPDATE games SET platform_name=?, updated_at=? WHERE platform_id=?').run(name.trim(), now, id);

  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'UPDATE', 'Platform', id, now, JSON.stringify({ name: name.trim() }));

  const row = db.prepare('SELECT * FROM platforms WHERE id = ?').get(id) as Record<string, unknown>;
  return ok(rowToPlatform(row));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const platform = db.prepare('SELECT * FROM platforms WHERE id = ?').get(id);
  if (!platform) return err('platform not found', 404);

  const gamesCount = (db.prepare('SELECT COUNT(*) as c FROM games WHERE platform_id = ?').get(id) as Record<string, unknown>).c as number;
  if (gamesCount > 0) return err('Platform is in use by one or more games', 409);

  const now = new Date().toISOString();
  db.prepare('DELETE FROM platforms WHERE id = ?').run(id);

  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'DELETE', 'Platform', id, now, JSON.stringify({ id }));

  return ok(null);
}
