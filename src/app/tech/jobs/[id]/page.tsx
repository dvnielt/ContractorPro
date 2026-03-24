'use client';

import { use, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, JobTypeBadge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { JobStatus, PhotoType } from '@/data/types';
import { useToast } from '@/context/ToastContext';
import imageCompression from 'browser-image-compression';

export default function TechJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser } = useAuth();
  const {
    getJobById,
    updateJob,
    updateJobStatus,
    getJobPhotos,
    deleteJobPhoto,
    getJobInventoryUsage,
    getTechInventory,
    logJobInventory,
    validateJobCompletion,
    getJobChecklist,
    saveJobChecklist,
    refresh,
  } = useData();

  const job = getJobById(id);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false);
  const [photoType, setPhotoType] = useState<PhotoType>('before');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [inventoryError, setInventoryError] = useState('');
  const [validationResult, setValidationResult] = useState<ReturnType<typeof validateJobCompletion> | null>(null);
  const [notes, setNotes] = useState(job?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // Checklist state
  const [editingChecklist, setEditingChecklist] = useState(false);
  const [treeSize, setTreeSize] = useState<'small' | 'medium' | 'large' | ''>('');
  const [treeHeight, setTreeHeight] = useState('');
  const [valveCount, setValveCount] = useState('');
  const [hasIrrigation, setHasIrrigation] = useState<boolean | null>(null);
  const [sodType, setSodType] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-slate-100">Job not found</h2>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const photos = getJobPhotos(job.id);
  const inventoryUsed = getJobInventoryUsage(job.id);
  const techInventory = currentUser ? getTechInventory(currentUser.id) : [];
  const checklist = getJobChecklist(job.id);

  const beforePhotos = photos.filter(p => p.photoType === 'before');
  const afterPhotos = photos.filter(p => p.photoType === 'after');
  const duringPhotos = photos.filter(p => p.photoType === 'during');

  const isLocked = job.isLocked || job.status === 'pending_review' || job.status === 'complete';

  // Status progression: assigned -> on_the_way -> in_progress -> (submit for review)
  const statusOrder: JobStatus[] = ['assigned', 'on_the_way', 'in_progress'];
  const currentIndex = statusOrder.indexOf(job.status);
  const nextStatus = currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;

  const handleStatusUpdate = (newStatus: JobStatus) => {
    updateJobStatus(job.id, newStatus);
    toast(`Status updated to ${newStatus.replace(/_/g, ' ')}`);
  };

  const handleSubmitForReview = () => {
    const validation = validateJobCompletion(job.id);
    setValidationResult(validation);
    if (!validation.isValid) {
      setShowValidationModal(true);
      return;
    }
    setShowConfirmSubmitModal(true);
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/complete`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json() as { error?: string };
        toast(body.error ?? 'Submission failed', 'error');
        return;
      }
      setShowConfirmSubmitModal(false);
      await refresh();
      toast('Job submitted for review');
    } catch {
      toast('Submission failed — please try again', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    setIsUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append('file', compressed, file.name);
      formData.append('photoType', photoType);

      const res = await fetch(`/api/jobs/${job.id}/photos`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const { error } = await res.json() as { error: string };
        toast(error ?? 'Upload failed', 'error');
        return;
      }

      // Refresh data so the new photo (with a signed URL) appears
      await refresh();
      setShowPhotoModal(false);
      toast(`${photoType.charAt(0).toUpperCase() + photoType.slice(1)} photo added`);
    } catch {
      toast('Upload failed — please try again', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleLogInventory = () => {
    if (!currentUser || !selectedItemId || !itemQuantity) return;

    const qty = parseInt(itemQuantity);
    const techInv = techInventory.find(ti => ti.itemId === selectedItemId);

    if (!techInv || qty <= 0) {
      setInventoryError('Invalid quantity');
      return;
    }
    if (qty > techInv.quantity) {
      setInventoryError(`Only ${techInv.quantity} ${techInv.item.unit} available`);
      return;
    }

    try {
      logJobInventory(job.id, selectedItemId, qty, currentUser.id);
      setShowInventoryModal(false);
      setSelectedItemId('');
      setItemQuantity('');
      setInventoryError('');
      toast('Inventory logged');
    } catch {
      setInventoryError('Failed to log inventory');
    }
  };

  const handleSaveNotes = () => {
    updateJob(job.id, { notes });
    setIsEditingNotes(false);
    toast('Notes saved');
  };

  const handleEditChecklist = () => {
    if (checklist) {
      setTreeSize(checklist.treeSize || '');
      setTreeHeight(String(checklist.treeHeightFt || ''));
      setValveCount(String(checklist.valveCount || ''));
      setHasIrrigation(checklist.hasIrrigation ?? null);
      setSodType(checklist.sodType || '');
      setCustomNotes(checklist.customNotes || '');
    }
    setEditingChecklist(true);
  };

  const handleSaveChecklist = () => {
    saveJobChecklist(job.id, {
      treeSize: treeSize as 'small' | 'medium' | 'large' | undefined || undefined,
      treeHeightFt: treeHeight ? parseInt(treeHeight) : undefined,
      valveCount: valveCount ? parseInt(valveCount) : undefined,
      hasIrrigation: hasIrrigation !== null ? hasIrrigation : undefined,
      sodType: sodType || undefined,
      customNotes: customNotes || undefined,
    });
    setEditingChecklist(false);
    toast('Checklist saved');
  };

  const inventoryOptions = [
    { value: '', label: 'Select item...' },
    ...techInventory
      .filter(ti => ti.quantity > 0)
      .map(ti => ({
        value: ti.itemId,
        label: `${ti.item.name} (${ti.quantity} ${ti.item.unit} remaining)`,
      })),
  ];

  const photoSections: { type: PhotoType; label: string; photos: typeof photos }[] = [
    { type: 'before', label: 'Before', photos: beforePhotos },
    { type: 'after', label: 'After', photos: afterPhotos },
    { type: 'during', label: 'During', photos: duringPhotos },
  ];

  return (
    <div className="space-y-5 pb-28">
      <Button variant="ghost" onClick={() => router.back()}>← Back</Button>

      {/* Change Request Banner */}
      {job.changeRequestNotes && job.status === 'in_progress' && (
        <div className="p-4 bg-orange-900/20 border border-orange-300 rounded-lg">
          <div className="font-semibold text-orange-300 mb-1">Manager Requested Changes</div>
          <p className="text-orange-400 text-sm">{job.changeRequestNotes}</p>
          <p className="text-orange-600 text-xs mt-2">Address these issues and re-submit for review.</p>
        </div>
      )}

      {/* Pending Review Banner */}
      {job.status === 'pending_review' && (
        <div className="p-4 bg-teal-900/20 border border-teal-800/50 rounded-lg flex items-center gap-2">
          <span className="text-teal-600 text-lg">⏳</span>
          <div>
            <div className="font-semibold text-teal-300">Job Submitted for Review</div>
            <div className="text-sm text-teal-600">Awaiting manager approval. No further edits until reviewed.</div>
          </div>
        </div>
      )}

      {/* Complete Banner */}
      {job.status === 'complete' && (
        <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg flex items-center gap-2">
          <span className="text-green-600 text-lg">✓</span>
          <div>
            <div className="font-semibold text-green-300">Job Complete</div>
            {job.completedAt && (
              <div className="text-sm text-green-600">Completed {new Date(job.completedAt).toLocaleString()}</div>
            )}
          </div>
        </div>
      )}

      {/* Job Header */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-start gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl font-bold text-slate-100">{job.clientName}</h1>
                <span className="text-xs text-slate-500 font-mono">{job.jobNumber}</span>
              </div>
              <p className="text-slate-400 text-sm">{job.address}</p>
              {job.description && <p className="text-slate-400 mt-2 text-sm">{job.description}</p>}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <StatusBadge status={job.status} />
              <JobTypeBadge jobType={job.jobType} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Update */}
      {!isLocked && nextStatus && (
        <Card>
          <CardHeader><CardTitle>Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-400">Current</div>
                <StatusBadge status={job.status} />
              </div>
              <Button onClick={() => handleStatusUpdate(nextStatus)} className="capitalize">
                Mark as {nextStatus.replace('_', ' ')} →
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos */}
      {photoSections.map(({ type, label, photos: sectionPhotos }) => (
        <Card key={type}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>
                {label} Photos ({type === 'during' ? sectionPhotos.length : `${sectionPhotos.length}/2 min`})
              </CardTitle>
              {!isLocked && (
                <Button size="sm" onClick={() => { setPhotoType(type); setShowPhotoModal(true); }}>
                  + Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sectionPhotos.length === 0 ? (
              <p className="text-slate-500 text-center py-3 text-sm">
                No {label.toLowerCase()} photos{type !== 'during' ? ' — 2 required' : ''}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {sectionPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img src={photo.photoUrl} alt={label} className="w-full h-24 object-cover rounded-lg" />
                    {!isLocked && (
                      <button
                        onClick={() => deleteJobPhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-900/200 text-white p-0.5 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Inventory */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inventory Used ({inventoryUsed.length})</CardTitle>
            {!isLocked && (
              <Button size="sm" onClick={() => setShowInventoryModal(true)}>+ Log</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {inventoryUsed.length === 0 ? (
            <p className="text-slate-500 text-center py-3 text-sm">No inventory logged — 1 required</p>
          ) : (
            <div className="space-y-2">
              {inventoryUsed.map((usage) => (
                <div key={usage.id} className="flex justify-between items-center p-3 bg-slate-950 rounded-lg">
                  <span className="font-medium text-slate-100 text-sm">{usage.item.name}</span>
                  <span className="text-sm">
                    <span className="font-medium">{usage.quantityUsed}</span>
                    <span className="text-slate-400 ml-1">{usage.item.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job Checklist */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Job Checklist ({job.jobType})</CardTitle>
            {!isLocked && !editingChecklist && (
              <Button size="sm" variant="ghost" onClick={handleEditChecklist}>
                {checklist ? 'Edit' : 'Fill Out'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {editingChecklist ? (
            <div className="space-y-4 animate-fade-in">
              {job.jobType === 'tree' && (
                <>
                  <Select
                    label="Tree Size *"
                    options={[
                      { value: '', label: 'Select size...' },
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ]}
                    value={treeSize}
                    onChange={(e) => setTreeSize(e.target.value as 'small' | 'medium' | 'large' | '')}
                  />
                  <Input
                    label="Tree Height (ft) *"
                    type="number"
                    placeholder="Height in feet"
                    value={treeHeight}
                    onChange={(e) => setTreeHeight(e.target.value)}
                  />
                </>
              )}
              {job.jobType === 'irrigation' && (
                <Input
                  label="Valve Count *"
                  type="number"
                  placeholder="Number of valves"
                  value={valveCount}
                  onChange={(e) => setValveCount(e.target.value)}
                />
              )}
              {job.jobType === 'sod' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Has Irrigation? *</label>
                    <div className="flex gap-3">
                      <Button
                        size="sm"
                        variant={hasIrrigation === true ? 'primary' : 'secondary'}
                        onClick={() => setHasIrrigation(true)}
                      >Yes</Button>
                      <Button
                        size="sm"
                        variant={hasIrrigation === false ? 'primary' : 'secondary'}
                        onClick={() => setHasIrrigation(false)}
                      >No</Button>
                    </div>
                  </div>
                  <Input
                    label="Sod Type *"
                    placeholder="e.g., St. Augustine, Bermuda, Zoysia"
                    value={sodType}
                    onChange={(e) => setSodType(e.target.value)}
                  />
                </>
              )}
              {job.jobType === 'other' && (
                <Textarea
                  label="Custom Notes (optional)"
                  placeholder="Any notes about the job..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              )}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="secondary" onClick={() => setEditingChecklist(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveChecklist}>Save Checklist</Button>
              </div>
            </div>
          ) : checklist ? (
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
              {job.jobType === 'other' && (
                <div>
                  <span className="text-slate-400 block">Notes</span>
                  <p className="font-medium mt-1">{checklist.customNotes || 'None'}</p>
                </div>
              )}
              <div className="text-xs text-green-600 mt-2">✓ Checklist saved</div>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-3 text-sm">
              {job.jobType !== 'other' ? 'Checklist required — tap Fill Out' : 'No checklist required for this job type'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Notes</CardTitle>
            {!isLocked && !isEditingNotes && (
              <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(true)}>Edit</Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingNotes && !isLocked ? (
            <div className="space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this job..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotes}>Save</Button>
                <Button size="sm" variant="secondary" onClick={() => { setNotes(job.notes || ''); setIsEditingNotes(false); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-slate-300 whitespace-pre-wrap text-sm">
              {job.notes || <span className="text-slate-500">No notes added</span>}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Submit for Review Button */}
      {!isLocked && job.status === 'in_progress' && (
        <div className="fixed bottom-20 md:bottom-4 left-0 right-0 px-4 md:ml-64">
          <div className="max-w-4xl mx-auto">
            <Button
              fullWidth
              size="lg"
              onClick={handleSubmitForReview}
              className="bg-teal-600 hover:bg-teal-700 shadow-lg"
            >
              Submit for Review
            </Button>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="Add Photo"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['before', 'after', 'during'] as PhotoType[]).map(type => (
              <Button
                key={type}
                size="sm"
                variant={photoType === type ? 'primary' : 'secondary'}
                onClick={() => setPhotoType(type)}
                className="capitalize flex-1"
              >
                {type}
              </Button>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            disabled={isUploading}
            onChange={handlePhotoUpload}
            className="w-full p-4 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="text-sm text-slate-400 text-center">
            {isUploading ? 'Uploading...' : 'Take a photo or select from gallery'}
          </p>
        </div>
      </Modal>

      {/* Inventory Modal */}
      <Modal
        isOpen={showInventoryModal}
        onClose={() => { setShowInventoryModal(false); setInventoryError(''); }}
        title="Log Inventory Used"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowInventoryModal(false)}>Cancel</Button>
            <Button onClick={handleLogInventory} disabled={!selectedItemId || !itemQuantity}>Log</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Item"
            options={inventoryOptions}
            value={selectedItemId}
            onChange={(e) => { setSelectedItemId(e.target.value); setInventoryError(''); }}
          />
          <Input
            label="Quantity Used"
            type="number"
            placeholder="0"
            value={itemQuantity}
            onChange={(e) => { setItemQuantity(e.target.value); setInventoryError(''); }}
          />
          {inventoryError && <p className="text-sm text-red-500">{inventoryError}</p>}
        </div>
      </Modal>

      {/* Validation Modal */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Can't Submit Yet"
        footer={<Button onClick={() => setShowValidationModal(false)}>Got it</Button>}
      >
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">Complete all requirements before submitting:</p>
          <div className="space-y-2">
            {validationResult && (
              <>
                <div className="flex items-center gap-2 text-sm">
                  <span>{validationResult.hasMinBeforePhotos ? '✅' : '❌'}</span>
                  <span className={validationResult.hasMinBeforePhotos ? 'text-green-400' : 'text-red-400'}>
                    2+ before photos ({beforePhotos.length} uploaded)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{validationResult.hasMinAfterPhotos ? '✅' : '❌'}</span>
                  <span className={validationResult.hasMinAfterPhotos ? 'text-green-400' : 'text-red-400'}>
                    2+ after photos ({afterPhotos.length} uploaded)
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{validationResult.hasInventoryLogged ? '✅' : '❌'}</span>
                  <span className={validationResult.hasInventoryLogged ? 'text-green-400' : 'text-red-400'}>
                    At least 1 inventory item logged
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{validationResult.hasChecklistCompleted ? '✅' : '❌'}</span>
                  <span className={validationResult.hasChecklistCompleted ? 'text-green-400' : 'text-red-400'}>
                    Checklist completed
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{validationResult.hasNotes ? '✅' : '❌'}</span>
                  <span className={validationResult.hasNotes ? 'text-green-400' : 'text-red-400'}>
                    Job notes added
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirm Submit Modal */}
      <Modal
        isOpen={showConfirmSubmitModal}
        onClose={() => setShowConfirmSubmitModal(false)}
        title="Submit for Review?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowConfirmSubmitModal(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleConfirmSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </>
        }
      >
        <p className="text-slate-300">
          Once submitted, you cannot edit this job until a manager reviews it. Continue?
        </p>
      </Modal>
    </div>
  );
}
