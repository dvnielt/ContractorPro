import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const photoType = formData.get('photoType') as string | null;

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (!photoType || !['before', 'after', 'during'].includes(photoType)) {
    return NextResponse.json({ error: 'Invalid photoType' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, or WebP.' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large. Maximum 5MB.' }, { status: 400 });
  }

  // Verify job access
  const { data: job } = await supabase.from('jobs').select('assigned_tech_id, is_locked').eq('id', jobId).single();
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  if (job.is_locked) return NextResponse.json({ error: 'Job is locked' }, { status: 400 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isTech = profile?.role === 'tech';
  if (isTech && job.assigned_tech_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Upload to Supabase Storage
  const ext = file.name.split('.').pop() ?? 'jpg';
  const storagePath = `${jobId}/${photoType}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('job-photos')
    .upload(storagePath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  // Insert photo record
  const { data: photo, error: insertError } = await supabase.from('job_photos').insert({
    job_id: jobId,
    photo_url: storagePath,
    photo_type: photoType,
    uploaded_by: user.id,
  }).select().single();

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ photo });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get('photoId');
  if (!photoId) return NextResponse.json({ error: 'photoId required' }, { status: 400 });

  const { data: photo } = await supabase.from('job_photos').select('photo_url, uploaded_by').eq('id', photoId).single();
  if (!photo) return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
  if (photo.uploaded_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  // Delete from storage
  await supabase.storage.from('job-photos').remove([photo.photo_url]);

  // Delete record
  await supabase.from('job_photos').delete().eq('id', photoId);

  return NextResponse.json({ ok: true });
}
