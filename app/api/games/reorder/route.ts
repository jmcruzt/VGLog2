export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import db from '@/lib/db';

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data, error: null });
}
function err(message: string, status = 400) {
  return NextResponse.json({ success: false, data: null, error: message }, { status });
}

export async function POST(req: NextRequest) {
  const { orderedIds } = await req.json();
  if (!Array.isArray(orderedIds)) return err('orderedIds must be an array');

  const update = db.prepare('UPDATE games SET sort_order=?, updated_at=? WHERE id=?');
  const now = new Date().toISOString();

  const reorderAll = db.transaction(() => {
    orderedIds.forEach((id: string, index: number) => {
      update.run(index + 1, now, id);
    });
  });
  reorderAll();

  db.prepare(`INSERT INTO audit_logs (id, action, entity, entity_id, timestamp, details) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(randomUUID(), 'REORDER', 'Game', 'batch', now, JSON.stringify({ count: orderedIds.length }));

  return ok(null);
}
