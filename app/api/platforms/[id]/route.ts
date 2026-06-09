export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db, rowToPlatform } from '@/lib/db';

function ok<T>(data: T) { return NextResponse.json({ success: true, data, error: null }); }
function err(message: string, status = 400) { return NextResponse.json({ success: false, data: null, error: message }, { status }); }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return err('name is required');
  const client = await db();
  const { rows: pRows } = await client.execute({ sql: 'SELECT * FROM platforms WHERE id = ?', args: [id] });
  if (pRows.length === 0) return err('platform not found', 404);
  const { rows: existing } = await client.execute({ sql: 'SELECT id FROM platforms WHERE name = ? AND id != ?', args: [name.trim(), id] });
  if (existing.length > 0) return err(`Platform "${name}" already exists`, 409);
  const now = new Date().toISOString();
  await client.batch([
    { sql: 'UPDATE platforms SET name=? WHERE id=?', args: [name.trim(), id] },
    { sql: 'UPDATE games SET platform_name=?, updated_at=? WHERE platform_id=?', args: [name.trim(), now, id] },
    { sql: 'INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)', args: [randomUUID(), 'UPDATE', 'Platform', id, now, JSON.stringify({ name: name.trim() })] },
  ], 'write');
  const { rows } = await client.execute({ sql: 'SELECT * FROM platforms WHERE id = ?', args: [id] });
  return ok(rowToPlatform(rows[0]));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await db();
  const { rows: pRows } = await client.execute({ sql: 'SELECT * FROM platforms WHERE id = ?', args: [id] });
  if (pRows.length === 0) return err('platform not found', 404);
  const { rows: gRows } = await client.execute({ sql: 'SELECT COUNT(*) as c FROM games WHERE platform_id = ?', args: [id] });
  if (Number(gRows[0].c) > 0) return err('Platform is in use by one or more games', 409);
  const now = new Date().toISOString();
  await client.batch([
    { sql: 'DELETE FROM platforms WHERE id = ?', args: [id] },
    { sql: 'INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)', args: [randomUUID(), 'DELETE', 'Platform', id, now, JSON.stringify({ id })] },
  ], 'write');
  return ok(null);
}
