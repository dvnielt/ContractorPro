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

  // Fetch validation data in parallel
  const [
    { data: job, error: jobError },
    { data: photos, error: photosError },
    { data: inventory, error: inventoryError },
    { data: checklist },
  ] = await Promise.all([
    supabase.from('jobs').select('*').eq('id', jobId).single(),
    supabase.from('job_photos').select('photo_type').eq('job_id', jobId),
    supabase.from('job_inventory').select('id').eq('job_id', jobId),
    supabase.from('job_checklists').select('*').eq('job_id', jobId).single(),
  ]);

  if (jobError || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (photosError || inventoryError) return NextResponse.json({ error: 'Failed to load job data' }, { status: 500 });
  if (job.assigned_tech_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (job.is_locked) return NextResponse.json({ error: 'Job is locked' }, { status: 400 });

  const beforeCount = photos?.filter(p => p.photo_type === 'before').length ?? 0;
  const afterCount = photos?.filter(p => p.photo_type === 'after').length ?? 0;
  const hasInventory = (inventory?.length ?? 0) > 0;

  let checklistOk = false;
  if (job.job_type === 'tree') {
    checklistOk = !!(checklist?.tree_size && checklist?.tree_height_ft && checklist.tree_height_ft > 0);
  } else if (job.job_type === 'irrigation') {
    checklistOk = !!(checklist?.valve_count);
  } else if (job.job_type === 'sod') {
    checklistOk = checklist?.has_irrigation !== null && checklist?.has_irrigation !== undefined && !!(checklist?.sod_type);
  } else {
    checklistOk = true;
  }

  const validation = {
    isValid: beforeCount >= 2 && afterCount >= 2 && hasInventory && checklistOk,
    hasMinBeforePhotos: beforeCount >= 2,
    hasMinAfterPhotos: afterCount >= 2,
    hasInventoryLogged: hasInventory,
    hasChecklistCompleted: checklistOk,
  };

  if (!validation.isValid) {
    return NextResponse.json({ error: 'Validation failed', validation }, { status: 422 });
  }

  // Mark as pending_review
  const now = new Date().toISOString();
  const { error } = await supabase.from('jobs').update({
    status: 'pending_review',
    completed_at: now,
    change_request_notes: null,
  }).eq('id', jobId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Insert status history
  await supabase.from('job_status_history').insert({
    job_id: jobId,
    old_status: job.status,
    new_status: 'pending_review',
    changed_by: user.id,
    changed_at: now,
  });

  // Fire email notification
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ type: 'job_submitted', jobId }),
  }).catch(() => {/* non-blocking */});

  return NextResponse.json({ ok: true });
}
