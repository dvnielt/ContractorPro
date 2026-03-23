'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { JobType, BidStatus } from '@/data/types';
import { TECH_COLOR_PALETTE } from '@/data/mockData';
import { useToast } from '@/context/ToastContext';

export default function CreateJobPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getTechs, createJob, getUserById } = useData();

  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTechId, setAssignedTechId] = useState('');
  const [jobType, setJobType] = useState<JobType>('other');
  const [color, setColor] = useState('#6B7280');
  const [bidStatus, setBidStatus] = useState<string>('');
  const [bidAmount, setBidAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const techs = getTechs();

  // Auto-set color when tech is selected
  const handleTechChange = (techId: string) => {
    setAssignedTechId(techId);
    if (techId) {
      const tech = getUserById(techId);
      if (tech) setColor(tech.color);
    }
  };

  const techOptions = [
    { value: '', label: 'Select a tech...' },
    ...techs.map(t => ({ value: t.id, label: t.fullName })),
  ];

  const jobTypeOptions = [
    { value: 'other', label: 'Other' },
    { value: 'tree', label: 'Tree' },
    { value: 'irrigation', label: 'Irrigation' },
    { value: 'sod', label: 'Sod' },
  ];

  const bidStatusOptions = [
    { value: '', label: 'None' },
    { value: 'needs_bid', label: 'Needs Bid' },
    { value: 'pending_approval', label: 'Pending Approval' },
    { value: 'approved', label: 'Approved' },
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    if (!assignedTechId) newErrors.assignedTechId = 'Assign to a tech is required';
    if (bidStatus && bidAmount && isNaN(parseFloat(bidAmount))) {
      newErrors.bidAmount = 'Bid amount must be a number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !currentUser) return;

    setIsSubmitting(true);
    try {
      createJob(
        clientName.trim(),
        address.trim(),
        currentUser.id,
        {
          description: description.trim() || undefined,
          assignedTechId: assignedTechId || undefined,
          jobType,
          color,
          bidStatus: bidStatus as BidStatus || undefined,
          bidAmount: bidStatus && bidAmount ? parseFloat(bidAmount) : undefined,
        }
      );
      toast('Job created successfully');
      router.push('/admin/jobs');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Client Name *"
              placeholder="e.g., Johnson Residence"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              error={errors.clientName}
            />

            <Input
              label="Address *"
              placeholder="e.g., 123 Main St, Springfield, IL 62701"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              error={errors.address}
            />

            <Textarea
              label="Description (optional)"
              placeholder="Describe the job..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Job Type *"
                options={jobTypeOptions}
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
              />

              <Select
                label="Assign to Tech *"
                options={techOptions}
                value={assignedTechId}
                onChange={(e) => handleTechChange(e.target.value)}
                error={errors.assignedTechId}
              />
            </div>

            {/* Job Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {TECH_COLOR_PALETTE.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setColor(value)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === value ? 'border-gray-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: value }}
                    title={label}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => setColor('#6B7280')}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    color === '#6B7280' ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: '#6B7280' }}
                  title="Default Gray"
                />
              </div>
            </div>

            {/* Bid Status */}
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Bid Status (optional)"
                options={bidStatusOptions}
                value={bidStatus}
                onChange={(e) => {
                  setBidStatus(e.target.value);
                  if (!e.target.value) setBidAmount('');
                }}
              />

              {bidStatus && (
                <Input
                  label="Bid Amount (optional)"
                  type="number"
                  placeholder="0.00"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  error={errors.bidAmount}
                />
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Job'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
