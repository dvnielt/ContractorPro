import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? 'noreply@fieldflow.app';
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean);

type JobWithTech = {
  job_number: string;
  client_name: string;
  address: string;
  change_request_notes: string | null;
  assigned_tech: { email: string; full_name: string } | null;
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null) as { type: string; jobId: string } | null;
  if (!body?.type || !body?.jobId) {
    return NextResponse.json({ error: 'Missing type or jobId' }, { status: 400 });
  }
  const { type, jobId } = body;

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('job_number, client_name, address, change_request_notes, assigned_tech:profiles!jobs_assigned_tech_id_fkey(email, full_name)')
    .eq('id', jobId)
    .single();

  if (jobError || !job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

  const typedJob = job as unknown as JobWithTech;

  try {
    if (type === 'job_submitted') {
      if (ADMIN_EMAILS.length > 0) {
        await resend.emails.send({
          from: FROM,
          to: ADMIN_EMAILS,
          subject: `[FieldFlow] Job ${typedJob.job_number} submitted for review`,
          html: `
            <h2>Job Submitted for Review</h2>
            <p><strong>${typedJob.client_name}</strong> (${typedJob.job_number})</p>
            <p>Address: ${typedJob.address}</p>
            <p>Submitted by: ${typedJob.assigned_tech?.full_name ?? 'Unknown tech'}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/jobs/${jobId}">Review Job →</a></p>
          `,
        });
      }
    } else if (type === 'job_approved') {
      const techEmail = typedJob.assigned_tech?.email;
      if (techEmail) {
        await resend.emails.send({
          from: FROM,
          to: [techEmail],
          subject: `[FieldFlow] Job ${typedJob.job_number} approved`,
          html: `
            <h2>Job Approved</h2>
            <p><strong>${typedJob.client_name}</strong> (${typedJob.job_number}) has been approved and marked complete.</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/tech/jobs/${jobId}">View Job →</a></p>
          `,
        });
      }
    } else if (type === 'changes_requested') {
      const techEmail = typedJob.assigned_tech?.email;
      if (techEmail) {
        await resend.emails.send({
          from: FROM,
          to: [techEmail],
          subject: `[FieldFlow] Changes requested on ${typedJob.job_number}`,
          html: `
            <h2>Manager Requested Changes</h2>
            <p><strong>${typedJob.client_name}</strong> (${typedJob.job_number})</p>
            <p><strong>Note from manager:</strong> ${typedJob.change_request_notes}</p>
            <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/tech/jobs/${jobId}">Open Job →</a></p>
          `,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Email failed' }, { status: 500 });
  }
}
