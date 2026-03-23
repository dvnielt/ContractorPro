import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { note } = body as { note: string };
  if (!note?.trim()) return NextResponse.json({ error: 'Note is required' }, { status: 400 });

  const { data: job } = await supabase.from('jobs').select('status').eq('id', jobId).single();
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const now = new Date().toISOString();

  const { error } = await supabase.from('jobs').update({
    status: 'in_progress',
    change_request_notes: note.trim(),
    completed_at: null,
    is_locked: false,
  }).eq('id', jobId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from('job_status_history').insert({
    job_id: jobId,
    old_status: job.status,
    new_status: 'in_progress',
    changed_by: user.id,
    changed_at: now,
    note: note.trim(),
  });

  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ type: 'changes_requested', jobId }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
