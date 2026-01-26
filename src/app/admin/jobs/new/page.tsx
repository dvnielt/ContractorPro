'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export default function CreateJobPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { getTechs, createJob } = useData();

  const [clientName, setClientName] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTechId, setAssignedTechId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const techs = getTechs();

  const techOptions = [
    { value: '', label: 'Select a tech...' },
    ...techs.map(t => ({ value: t.id, label: t.fullName })),
  ];

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !currentUser) return;

    createJob(
      clientName.trim(),
      address.trim(),
      currentUser.id,
      description.trim() || undefined,
      assignedTechId || undefined
    );

    router.push('/admin/jobs');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Job</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="Describe the job to be done..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <Select
              label="Assign to Tech"
              options={techOptions}
              value={assignedTechId}
              onChange={(e) => setAssignedTechId(e.target.value)}
            />

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit">
                Create Job
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
