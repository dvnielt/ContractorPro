'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/context/DataContext';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { JobStatus } from '@/data/types';

export default function AdminJobsPage() {
  const { getJobs, getTechs, getUserById } = useData();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');

  const jobs = getJobs();
  const techs = getTechs();

  // Apply filters
  let filteredJobs = jobs;
  if (statusFilter !== 'all') {
    filteredJobs = filteredJobs.filter(j => j.status === statusFilter);
  }
  if (techFilter !== 'all') {
    filteredJobs = filteredJobs.filter(j => j.assignedTechId === techFilter);
  }

  // Sort by most recent first
  filteredJobs = [...filteredJobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'assigned', label: 'Assigned' },
    { value: 'on_the_way', label: 'On the Way' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'complete', label: 'Complete' },
  ];

  const techOptions = [
    { value: 'all', label: 'All Techs' },
    ...techs.map(t => ({ value: t.id, label: t.fullName })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <Link href="/admin/jobs/new">
          <Button>Create Job</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-48">
          <Select
            options={statusOptions}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={techOptions}
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            No jobs found matching your filters
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const tech = job.assignedTechId ? getUserById(job.assignedTechId) : null;
            return (
              <Link key={job.id} href={`/admin/jobs/${job.id}`}>
                <Card hoverable className="mb-0">
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900">{job.clientName}</span>
                        <StatusBadge status={job.status} />
                      </div>
                      <div className="text-sm text-gray-600 truncate">{job.address}</div>
                      {job.description && (
                        <div className="text-sm text-gray-500 truncate mt-1">{job.description}</div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 sm:text-right shrink-0">
                      {tech ? (
                        <div className="font-medium text-gray-700">{tech.fullName}</div>
                      ) : (
                        <div className="text-gray-400">Unassigned</div>
                      )}
                      <div className="text-xs text-gray-400">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
