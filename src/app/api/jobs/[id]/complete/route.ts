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
    supabase.from('jobs').select('id, status, assigned_tech_id, is_locked, job_type, notes').eq('id', jobId).single(),
    supabase.from('job_photos').select('photo_type').eq('job_id', jobId),
    supabase.from('job_inventory').select('id').eq('job_id', jobId),
    supabase.from('job_checklists').select('tree_size, tree_height_ft, valve_count, has_irrigation, sod_type, custom_notes').eq('job_id', jobId).single(),
  ]);

  if (jobError || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (photosError || inventoryError) return NextResponse.json({ error: 'Failed to load job data' }, { status: 500 });
  if (job.assigned_tech_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (job.is_locked) return NextResponse.json({ error: 'Job is locked' }, { status: 400 });

  const beforeCount = photos?.filter(p => p.photo_type === 'before').length ?? 0;
  const afterCount = photos?.filter(p => p.photo_type === 'after').length ?? 0;
  const hasInventory = (inventory?.length ?? 0) > 0;
  const hasNotes = !!(job.notes?.trim());

  let checklistOk = false;
  if (job.job_type === 'tree') {
    checklistOk = !!(checklist?.tree_size && checklist?.tree_height_ft && checklist.tree_height_ft > 0);
  } else if (job.job_type === 'irrigation') {
    checklistOk = !!(checklist?.valve_count);
  } else if (job.job_type === 'sod') {
    checklistOk = checklist?.has_irrigation !== null && checklist?.has_irrigation !== undefined && !!(checklist?.sod_type);
  } else {
    // other jobs require custom_notes to be non-empty
    checklistOk = !!(checklist?.custom_notes?.trim());
  }

  const validation = {
    isValid: beforeCount >= 2 && afterCount >= 2 && hasInventory && checklistOk && hasNotes,
    hasMinBeforePhotos: beforeCount >= 2,
    hasMinAfterPhotos: afterCount >= 2,
    hasInventoryLogged: hasInventory,
    hasChecklistCompleted: checklistOk,
    hasNotes,
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

  // Insert status history (non-blocking — log error but don't fail the request)
  const { error: historyError } = await supabase.from('job_status_history').insert({
    job_id: jobId,
    old_status: job.status,
    new_status: 'pending_review',
    changed_by: user.id,
    changed_at: now,
  });
  if (historyError) console.error('Status history insert failed:', historyError.message);

  // Fire email notification
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ type: 'job_submitted', jobId }),
  }).catch(() => {/* non-blocking */});

  return NextResponse.json({ ok: true });
}
