'use client';

import { use, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { JobStatus, PhotoType } from '@/data/types';

export default function TechJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { currentUser } = useAuth();
  const {
    getJobById,
    updateJob,
    updateJobStatus,
    getJobPhotos,
    addJobPhoto,
    deleteJobPhoto,
    getJobInventoryUsage,
    getTechInventory,
    logJobInventory,
    validateJobCompletion,
  } = useData();

  const job = getJobById(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [photoType, setPhotoType] = useState<PhotoType>('before');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('');
  const [inventoryError, setInventoryError] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [notes, setNotes] = useState(job?.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Job not found</h2>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const photos = getJobPhotos(job.id);
  const inventoryUsed = getJobInventoryUsage(job.id);
  const techInventory = currentUser ? getTechInventory(currentUser.id) : [];

  const beforePhotos = photos.filter(p => p.photoType === 'before');
  const afterPhotos = photos.filter(p => p.photoType === 'after');

  const isComplete = job.status === 'complete';

  // Status progression
  const statusOrder: JobStatus[] = ['assigned', 'on_the_way', 'in_progress', 'complete'];
  const currentIndex = statusOrder.indexOf(job.status);
  const nextStatus = currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : null;

  const handleStatusUpdate = (newStatus: JobStatus) => {
    if (newStatus === 'complete') {
      // Run validation
      const validation = validateJobCompletion(job.id);
      if (!validation.canComplete) {
        setValidationErrors(validation.missingItems);
        setShowValidationModal(true);
        return;
      }
    }
    updateJobStatus(job.id, newStatus);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      addJobPhoto(job.id, base64, photoType, currentUser.id);
      setShowPhotoModal(false);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
    } catch {
      setInventoryError('Failed to log inventory');
    }
  };

  const handleSaveNotes = () => {
    updateJob(job.id, { notes });
    setIsEditingNotes(false);
  };

  const inventoryOptions = [
    { value: '', label: 'Select item...' },
    ...techInventory
      .filter(ti => ti.quantity > 0)
      .map(ti => ({
        value: ti.itemId,
        label: `${ti.item.name} (${ti.quantity} ${ti.item.unit} available)`,
      })),
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => router.back()}>
        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Button>

      {/* Job Header */}
      <Card>
        <CardContent>
          <div className="flex justify-between items-start gap-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{job.clientName}</h1>
              <p className="text-gray-600 mt-1">{job.address}</p>
              {job.description && (
                <p className="text-gray-500 mt-2">{job.description}</p>
              )}
            </div>
            <StatusBadge status={job.status} />
          </div>

          {isComplete && job.completedAt && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-green-700 text-sm font-medium">
                Completed on {new Date(job.completedAt).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update */}
      {!isComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {statusOrder.slice(0, -1).map((status) => {
                const isCurrentOrPast = statusOrder.indexOf(status) <= currentIndex;
                const isNext = status === nextStatus;
                return (
                  <Button
                    key={status}
                    variant={isCurrentOrPast ? 'primary' : isNext ? 'secondary' : 'ghost'}
                    onClick={() => !isCurrentOrPast && handleStatusUpdate(status)}
                    disabled={isCurrentOrPast}
                    className="capitalize"
                  >
                    {status.replace('_', ' ')}
                    {job.status === status && ' (Current)'}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Before Photos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Before Photos ({beforePhotos.length})</CardTitle>
              {!isComplete && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPhotoType('before');
                    setShowPhotoModal(true);
                  }}
                >
                  + Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {beforePhotos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No before photos</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {beforePhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photoUrl}
                      alt="Before"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {!isComplete && (
                      <button
                        onClick={() => deleteJobPhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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

        {/* After Photos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>After Photos ({afterPhotos.length})</CardTitle>
              {!isComplete && (
                <Button
                  size="sm"
                  onClick={() => {
                    setPhotoType('after');
                    setShowPhotoModal(true);
                  }}
                >
                  + Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {afterPhotos.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No after photos</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {afterPhotos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photoUrl}
                      alt="After"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {!isComplete && (
                      <button
                        onClick={() => deleteJobPhoto(photo.id)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
      </div>

      {/* Inventory Used */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Inventory Used ({inventoryUsed.length})</CardTitle>
            {!isComplete && (
              <Button size="sm" onClick={() => setShowInventoryModal(true)}>
                + Log Inventory
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {inventoryUsed.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No inventory logged</p>
          ) : (
            <div className="space-y-2">
              {inventoryUsed.map((usage) => (
                <div
                  key={usage.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="font-medium text-gray-900">{usage.item.name}</span>
                  <span>
                    <span className="font-medium">{usage.quantityUsed}</span>
                    <span className="text-gray-500 ml-1">{usage.item.unit}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Notes</CardTitle>
            {!isComplete && !isEditingNotes && (
              <Button size="sm" variant="ghost" onClick={() => setIsEditingNotes(true)}>
                Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingNotes && !isComplete ? (
            <div className="space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this job..."
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveNotes}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => {
                  setNotes(job.notes || '');
                  setIsEditingNotes(false);
                }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">
              {job.notes || 'No notes added'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Mark Complete Button */}
      {!isComplete && job.status === 'in_progress' && (
        <div className="fixed bottom-20 md:bottom-4 left-0 right-0 px-4 md:ml-64">
          <div className="max-w-4xl mx-auto">
            <Button
              fullWidth
              size="lg"
              onClick={() => handleStatusUpdate('complete')}
              className="bg-green-600 hover:bg-green-700"
            >
              Mark Complete
            </Button>
          </div>
        </div>
      )}

      {/* Photo Upload Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title={`Add ${photoType === 'before' ? 'Before' : 'After'} Photo`}
      >
        <div className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              variant={photoType === 'before' ? 'primary' : 'secondary'}
              onClick={() => setPhotoType('before')}
              fullWidth
            >
              Before
            </Button>
            <Button
              variant={photoType === 'after' ? 'primary' : 'secondary'}
              onClick={() => setPhotoType('after')}
              fullWidth
            >
              After
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoUpload}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500"
          />
          <p className="text-sm text-gray-500 text-center">
            Take a photo or select from gallery
          </p>
        </div>
      </Modal>

      {/* Inventory Modal */}
      <Modal
        isOpen={showInventoryModal}
        onClose={() => {
          setShowInventoryModal(false);
          setInventoryError('');
        }}
        title="Log Inventory Used"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowInventoryModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogInventory} disabled={!selectedItemId || !itemQuantity}>
              Log
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Item"
            options={inventoryOptions}
            value={selectedItemId}
            onChange={(e) => {
              setSelectedItemId(e.target.value);
              setInventoryError('');
            }}
          />
          <Input
            label="Quantity Used"
            type="number"
            placeholder="0"
            value={itemQuantity}
            onChange={(e) => {
              setItemQuantity(e.target.value);
              setInventoryError('');
            }}
          />
          {inventoryError && (
            <p className="text-sm text-red-500">{inventoryError}</p>
          )}
        </div>
      </Modal>

      {/* Validation Error Modal */}
      <Modal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        title="Cannot Complete Job"
        footer={
          <Button onClick={() => setShowValidationModal(false)}>
            OK
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Please complete the following before marking this job as complete:
          </p>
          <ul className="list-disc list-inside space-y-2">
            {validationErrors.map((error, i) => (
              <li key={i} className="text-red-600">{error}</li>
            ))}
          </ul>
        </div>
      </Modal>
    </div>
  );
}
