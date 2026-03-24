'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, JobTypeBadge, BidStatusBadge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { BidStatus, JobType } from '@/data/types';
import { TECH_COLOR_PALETTE } from '@/data/mockData';
import { useToast } from '@/context/ToastContext';

export default function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser } = useAuth();
  const {
    getJobById,
    getUserById,
    getJobPhotos,
    getJobInventoryUsage,
    getJobChecklist,
    updateJob,
    getTechs,
  } = useData();

  const job = getJobById(id);

  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeNote, setChangeNote] = useState('');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isActioning, setIsActioning] = useState(false);
  const [editingBid, setEditingBid] = useState(false);
  const [editingJob, setEditingJob] = useState(false);
  const [editClientName, setEditClientName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editJobType, setEditJobType] = useState<JobType>('other');
  const [editTechId, setEditTechId] = useState('');
  const [editColor, setEditColor] = useState('');
  const { toast } = useToast();
  const [bidStatus, setBidStatus] = useState(job?.bidStatus || '');
  const [bidAmount, setBidAmount] = useState(String(job?.bidAmount || ''));

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-100">Job not found</h2>
        <Link href="/admin/jobs" className="text-blue-600 hover:text-blue-400 mt-2 inline-block">
          Back to Jobs
        </Link>
      </div>
    );
  }

  const tech = job.assignedTechId ? getUserById(job.assignedTechId) : null;
  const creator = getUserById(job.createdBy);
  const approver = job.approvedBy ? getUserById(job.approvedBy) : null;
  const photos = getJobPhotos(job.id);
  const inventoryUsed = getJobInventoryUsage(job.id);
  const checklist = getJobChecklist(job.id);
  const allTechs = getTechs();

  const beforePhotos = photos.filter(p => p.photoType === 'before');
  const afterPhotos = photos.filter(p => p.photoType === 'after');
  const duringPhotos = photos.filter(p => p.photoType === 'during');

  const isPendingReview = job.status === 'pending_review';
  const isComplete = job.status === 'complete';

  const openEditJob = () => {
    setEditClientName(job.clientName);
    setEditAddress(job.address);
    setEditDescription(job.description || '');
    setEditJobType(job.jobType);
    setEditTechId(job.assignedTechId || '');
    setEditColor(job.color);
    setEditingJob(true);
  };

  const handleSaveJob = () => {
    updateJob(job.id, {
      clientName: editClientName.trim() || job.clientName,
      address: editAddress.trim() || job.address,
      description: editDescription.trim() || undefined,
      jobType: editJobType,
      assignedTechId: editTechId || undefined,
      color: editColor,
    });
    setEditingJob(false);
    toast('Job updated');
  };

  const techOptions = [
    { value: '', label: 'Unassigned' },
    ...allTechs.map(t => ({ value: t.id, label: t.fullName })),
  ];

  const jobTypeOptions = [
    { value: 'other', label: 'Other' },
    { value: 'tree', label: 'Tree' },
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'sod', label: 'Sod' },
  ];

  const handleApprove = async () => {
    setIsActioning(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/approve`, { method: 'POST' });
      if (!res.ok) {
        const { error } = await res.json();
        toast(error ?? 'Approval failed', 'error');
        return;
      }
      setShowApproveModal(false);
      router.push('/admin/jobs');
      router.refresh();
    } finally {
      setIsActioning(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changeNote.trim()) return;
    setIsActioning(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: changeNote.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast(error ?? 'Request failed', 'error');
        return;
      }
      setShowChangeModal(false);
      setChangeNote('');
      router.push('/admin/jobs');
      router.refresh();
    } finally {
      setIsActioning(false);
    }
  };

  const handleSaveBid = () => {
    updateJob(job.id, {
      bidStatus: (bidStatus as BidStatus) || undefined,
      bidAmount: bidStatus && bidAmount ? parseFloat(bidAmount) : undefined,
    });
    setEditingBid(false);
    toast('Bid information saved');
  };

  const bidStatusOptions = [
    { value: '', label: 'None' },
    { value: 'needs_bid', label: 'Needs Bid' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          ← Back
        </Button>
      </div>

      {job.changeRequestNotes && job.status === 'in_progress' && (
        <div className="p-4 bg-orange-900/20 border border-orange-800/50 rounded-lg">
          <div className="font-semibold text-orange-300 mb-1">Changes Requested</div>
          <p className="text-orange-400 text-sm">{job.changeRequestNotes}</p>
        </div>
      )}

      {isComplete && (
        <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg flex items-center gap-2">
          <span className="text-green-600 text-lg">✓</span>
          <div>
            <div className="font-semibold text-green-300">Job Complete</div>
            {job.approvedAt && (
              <div className="text-sm text-green-600">
                Approved {new Date(job.approvedAt).toLocaleString()}
                {approver && ` by ${approver.fullName}`}
              </div>
            )}
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Job Details</CardTitle>
            {!job.isLocked && !editingJob && (
              <Button size="sm" variant="ghost" onClick={openEditJob}>Edit</Button>
            )}
            {editingJob && (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditingJob(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveJob}>Save</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingJob ? (
            <div className="space-y-4">
              <Input label="Client Name" value={editClientName} onChange={(e) => setEditClientName(e.target.value)} />
              <Input label="Address" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} />
              <Textarea label="Description (optional)" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Describe the job..." />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Job Type" options={jobTypeOptions} value={editJobType} onChange={(e) => setEditJobType(e.target.value as JobType)} />
                <Select label="Assigned Tech" options={techOptions} value={editTechId} onChange={(e) => setEditTechId(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Job Color</label>
                <div className="flex gap-2 flex-wrap">
                  {TECH_COLOR_PALETTE.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setEditColor(value)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${editColor === value ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: value }}
                      title={label}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: job.color }} />
                  <h1 className="text-xl font-bold text-slate-100">{job.clientName}</h1>
                  <span className="text-sm text-slate-500 font-mono">{job.jobNumber}</span>
                  <StatusBadge status={job.status} />
                  <JobTypeBadge jobType={job.jobType} />
                  {job.bidStatus && <BidStatusBadge bidStatus={job.bidStatus} />}
                </div>
                <p className="text-slate-400">{job.address}</p>
                {job.description && <p className="text-slate-400 mt-2 text-sm">{job.description}</p>}
              </div>
              <div className="text-sm text-slate-400 sm:text-right shrink-0">
                <div>Created {new Date(job.createdAt).toLocaleString()}</div>
                {creator && <div>By {creator.fullName}</div>}
                {job.completedAt && (
                  <div className="text-green-600 font-medium mt-1">
                    Submitted {new Date(job.completedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {isPendingReview && (
        <Card>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-slate-100">Ready for Review</div>
                <div className="text-sm text-slate-400">
                  Submitted by {tech?.fullName} — review photos, inventory, and checklist below.
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowChangeModal(true)}>Request Changes</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowApproveModal(true)}>
                  Approve Job
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Assigned Tech</CardTitle></CardHeader>
        <CardContent>
          {tech ? (
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: tech.color }}
              >
                {tech.fullName.split(' ').filter(Boolean).map(n => n.charAt(0)).join('')}
              </div>
              <div>
                <div className="font-medium text-slate-100">{tech.fullName}</div>
                <div className="text-sm text-slate-400">{tech.email}</div>
              </div>
            </div>
          ) : (
            <p className="text-slate-400">No tech assigned</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Bid Information</CardTitle>
            {!editingBid ? (
              <Button size="sm" variant="ghost" onClick={() => {
                setBidStatus(job.bidStatus || '');
                setBidAmount(String(job.bidAmount || ''));
                setEditingBid(true);
              }}>Edit</Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setEditingBid(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveBid}>Save</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingBid ? (
            <div className="flex gap-4">
              <Select label="Bid Status" options={bidStatusOptions} value={bidStatus} onChange={(e) => setBidStatus(e.target.value)} />
              {bidStatus && (
                <Input label="Bid Amount ($)" type="number" placeholder="0.00" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {job.bidStatus ? (
                <>
                  <BidStatusBadge bidStatus={job.bidStatus} />
                  {job.bidAmount && (
                    <span className="font-medium text-slate-100">
                      {'$'}{job.bidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-slate-500 text-sm">No bid information</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {job.notes && (
        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><p className="text-slate-300 whitespace-pre-wrap">{job.notes}</p></CardContent>
        </Card>
      )}

      {checklist && (
        <Card>
          <CardHeader><CardTitle>Job Checklist</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {job.jobType === 'tree' && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Tree Size</span>
                    <span className="font-medium capitalize">{checklist.treeSize}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Tree Height</span>
                    <span className="font-medium">{checklist.treeHeightFt} ft</span>
                  </div>
                </>
              )}
              {job.jobType === 'irrigation' && (
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Valve Count</span>
                  <span className="font-medium">{checklist.valveCount}</span>
                </div>
              )}
              {job.jobType === 'sod' && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Has Irrigation</span>
                    <span className="font-medium">{checklist.hasIrrigation ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Sod Type</span>
                    <span className="font-medium">{checklist.sodType}</span>
                  </div>
                </>
              )}
              {job.jobType === 'other' && checklist.customNotes && (
                <div>
                  <span className="text-slate-400 block mb-1">Notes</span>
                  <p className="font-medium">{checklist.customNotes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: 'Before Photos', photos: beforePhotos },
          { label: 'After Photos', photos: afterPhotos },
          { label: 'During Photos', photos: duringPhotos },
        ].map(({ label, photos: photoList }) => (
          <Card key={label}>
            <CardHeader><CardTitle>{label} ({photoList.length})</CardTitle></CardHeader>
            <CardContent>
              {photoList.length === 0 ? (
                <p className="text-slate-500 text-center py-4 text-sm">None</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {photoList.map((photo) => (
                    <img key={photo.id} src={photo.photoUrl} alt={label} className="w-full h-24 object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Inventory Used ({inventoryUsed.length})</CardTitle></CardHeader>
        <CardContent>
          {inventoryUsed.length === 0 ? (
            <p className="text-slate-400 text-center py-4">No inventory logged</p>
          ) : (
            <div className="space-y-2">
              {inventoryUsed.map((usage) => (
                <div key={usage.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                  <span className="font-medium text-slate-100">{usage.item.name}</span>
                  <span>
                    <span className="font-medium">{usage.quantityUsed}</span>
                    <span className="text-slate-400 ml-1">{usage.item.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title="Approve Job"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowApproveModal(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-500 text-white" onClick={handleApprove} disabled={isActioning}>
              {isActioning ? 'Approving…' : 'Approve & Complete'}
            </Button>
          </>
        }
      >
        <p className="text-slate-300">
          Are you sure? This job will be marked complete and locked.
          {tech && ` ${tech.fullName} will be notified.`}
        </p>
      </Modal>

      <Modal
        isOpen={showChangeModal}
        onClose={() => setShowChangeModal(false)}
        title="Request Changes"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowChangeModal(false)}>Cancel</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleRequestChanges}
              disabled={!changeNote.trim()}
            >
              {isActioning ? 'Sending…' : 'Send Request'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Explain what needs to be fixed. {tech?.fullName} will be notified and the job returns to In Progress.
          </p>
          <textarea
            className="w-full border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            placeholder="What needs to be corrected or added?"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
