import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) { console.error('Auth error:', authError.message); return NextResponse.json({ error: 'Service unavailable' }, { status: 503 }); }
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Verify caller is admin
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profileError) return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: job } = await supabase.from('jobs').select('status').eq('id', jobId).single();
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (job.status !== 'pending_review') return NextResponse.json({ error: 'Job is not pending review' }, { status: 400 });

  const now = new Date().toISOString();

  const { error } = await supabase.from('jobs').update({
    status: 'complete',
    is_locked: true,
    approved_at: now,
    approved_by: user.id,
  }).eq('id', jobId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { error: historyError } = await supabase.from('job_status_history').insert({
    job_id: jobId,
    old_status: 'pending_review',
    new_status: 'complete',
    changed_by: user.id,
    changed_at: now,
  });
  if (historyError) console.error('Status history insert failed:', historyError.message);

  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ type: 'job_approved', jobId }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
